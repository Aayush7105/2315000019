import {
  logDebug,
  logError,
  logEvent,
  logInfo,
  logWarn,
  withRequestLogging,
  type LogEntryInput,
  type LogMetadata,
  type RequestLogDefaults,
} from "logging-middleware";

const frontendDefaults = {
  stack: "frontend",
  service: "notification_fe",
} satisfies Pick<LogEntryInput, "stack" | "service">;

type FrontendLogOptions = {
  packageName: string;
  message: string;
  metadata?: LogMetadata;
};

function toLogInput(options: FrontendLogOptions): LogEntryInput {
  return {
    ...frontendDefaults,
    package: options.packageName,
    message: options.message,
    metadata: options.metadata,
  };
}

export function logFrontendEvent(input: Omit<LogEntryInput, "stack" | "service">) {
  return logEvent({
    ...frontendDefaults,
    ...input,
  });
}

export function logFrontendDebug(options: FrontendLogOptions) {
  return logDebug(toLogInput(options));
}

export function logFrontendInfo(options: FrontendLogOptions) {
  return logInfo(toLogInput(options));
}

export function logFrontendWarn(options: FrontendLogOptions) {
  return logWarn(toLogInput(options));
}

export function logFrontendError(options: FrontendLogOptions) {
  return logError(toLogInput(options));
}

export function withFrontendRequestLogging<TArgs extends unknown[], TResponse extends Response>(
  handler: (request: Request, ...args: TArgs) => TResponse | Promise<TResponse>,
  options: Omit<RequestLogDefaults, "stack" | "service" | "package"> & {
    packageName: string;
  },
) {
  return withRequestLogging(handler, {
    ...frontendDefaults,
    ...options,
    package: options.packageName,
  });
}
