const bufferKey = Symbol.for("logging_middleware_.buffer");
const maxBufferedEntries = 500;

function getBuffer() {
  if (!globalThis[bufferKey]) {
    globalThis[bufferKey] = [];
  }

  return globalThis[bufferKey];
}

function getEnv(name) {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  return process.env[name];
}

function createRequestId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `req_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function cleanValue(value, depth = 0, seen = new WeakSet()) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "function") {
    return `[Function ${value.name || "anonymous"}]`;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (value instanceof URL) {
    return value.toString();
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  if (depth >= 4) {
    return "[DepthLimit]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => cleanValue(item, depth + 1, seen));
  }

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 50)
      .map(([key, nestedValue]) => [key, cleanValue(nestedValue, depth + 1, seen)]),
  );
}

function cleanMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  return cleanValue(metadata);
}

function normalizeEntry(input = {}) {
  const {
    level = "info",
    stack = "shared",
    service = "notification_system",
    package: packageName = "app",
    message = "Application event",
    metadata = {},
  } = input;

  return {
    id: createRequestId(),
    timestamp: new Date().toISOString(),
    level,
    stack,
    service,
    package: packageName,
    message,
    metadata: cleanMetadata(metadata),
  };
}

function trimBuffer(buffer) {
  if (buffer.length > maxBufferedEntries) {
    buffer.splice(0, buffer.length - maxBufferedEntries);
  }
}

async function deliverEntry(entry, endpoint) {
  if (!endpoint || typeof fetch !== "function") {
    return;
  }

  await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(entry),
    keepalive: true,
  });
}

export async function logEvent(input) {
  const entry = normalizeEntry(input);
  const buffer = getBuffer();
  buffer.push(entry);
  trimBuffer(buffer);

  const endpoint =
    input.endpoint ||
    getEnv("LOGGING_MIDDLEWARE_URL") ||
    getEnv("NEXT_PUBLIC_LOGGING_MIDDLEWARE_URL");

  try {
    await deliverEntry(entry, endpoint);
  } catch (error) {
    buffer.push(
      normalizeEntry({
        level: "error",
        stack: "logging",
        service: "logging_middleware_",
        package: "delivery",
        message: "Log delivery failed",
        metadata: { error },
      }),
    );
    trimBuffer(buffer);
  }

  return entry;
}

export function logDebug(input) {
  return logEvent({ ...input, level: "debug" });
}

export function logInfo(input) {
  return logEvent({ ...input, level: "info" });
}

export function logWarn(input) {
  return logEvent({ ...input, level: "warn" });
}

export function logError(input) {
  return logEvent({ ...input, level: "error" });
}

function summarizeWebRequest(request) {
  const requestUrl = request && request.url ? new URL(request.url) : undefined;

  return {
    method: request?.method,
    path: requestUrl?.pathname,
    query: requestUrl?.search || undefined,
    userAgent:
      typeof request?.headers?.get === "function"
        ? request.headers.get("user-agent") || undefined
        : undefined,
  };
}

export function withRequestLogging(handler, defaults = {}) {
  return async function loggedRequestHandler(request, ...args) {
    const startedAt = Date.now();
    const requestId = createRequestId();
    const requestSummary = summarizeWebRequest(request);

    await logInfo({
      ...defaults,
      message: defaults.startMessage || "HTTP request received",
      metadata: {
        ...requestSummary,
        requestId,
        ...(defaults.metadata || {}),
      },
    });

    try {
      const response = await handler(request, ...args);

      await logInfo({
        ...defaults,
        message: defaults.successMessage || "HTTP request completed",
        metadata: {
          ...requestSummary,
          requestId,
          status: response?.status,
          durationMs: Date.now() - startedAt,
          ...(defaults.metadata || {}),
        },
      });

      return response;
    } catch (error) {
      await logError({
        ...defaults,
        message: defaults.errorMessage || "HTTP request failed",
        metadata: {
          ...requestSummary,
          requestId,
          durationMs: Date.now() - startedAt,
          error,
          ...(defaults.metadata || {}),
        },
      });

      throw error;
    }
  };
}

export function withNodeHttpLogging(handler, defaults = {}) {
  return async function loggedNodeHttpHandler(request, response) {
    const startedAt = Date.now();
    const requestId = createRequestId();
    const requestSummary = {
      method: request.method,
      path: request.url,
      userAgent: request.headers?.["user-agent"],
    };

    if (typeof response.setHeader === "function") {
      response.setHeader("x-request-id", requestId);
    }

    await logInfo({
      ...defaults,
      message: defaults.startMessage || "HTTP request received",
      metadata: {
        ...requestSummary,
        requestId,
        ...(defaults.metadata || {}),
      },
    });

    let completed = false;
    const complete = () => {
      if (completed) {
        return;
      }

      completed = true;
      void logInfo({
        ...defaults,
        message: defaults.successMessage || "HTTP request completed",
        metadata: {
          ...requestSummary,
          requestId,
          status: response.statusCode,
          durationMs: Date.now() - startedAt,
          ...(defaults.metadata || {}),
        },
      });
    };

    if (typeof response.once === "function") {
      response.once("finish", complete);
      response.once("close", complete);
    }

    try {
      await handler(request, response, requestId);
    } catch (error) {
      await logError({
        ...defaults,
        message: defaults.errorMessage || "HTTP request failed",
        metadata: {
          ...requestSummary,
          requestId,
          durationMs: Date.now() - startedAt,
          error,
          ...(defaults.metadata || {}),
        },
      });

      if (!response.headersSent) {
        response.statusCode = 500;
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ error: "Internal server error", requestId }));
      } else if (!response.writableEnded) {
        response.end();
      }
    }
  };
}

export function getBufferedLogs() {
  return [...getBuffer()];
}

export function clearBufferedLogs() {
  getBuffer().splice(0);
}
