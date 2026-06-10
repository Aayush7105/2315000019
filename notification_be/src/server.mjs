import http from "node:http";
import { URL } from "node:url";
import {
  logError,
  logInfo,
  withNodeHttpLogging,
} from "../../logging_middleware_/index.js";

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4000);

const notifications = [
  {
    id: "notif-101",
    title: "Payment reminder",
    message: "Loan EMI notification is ready for delivery.",
    priority: "high",
    channel: "sms",
    status: "queued",
  },
  {
    id: "notif-102",
    title: "KYC update",
    message: "Customer profile verification event was sent.",
    priority: "medium",
    channel: "email",
    status: "sent",
  },
];

function applyCors(response) {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type");
}

function sendJson(response, statusCode, body) {
  applyCors(response);
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(body));
}

async function handleRequest(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host || host}`);

  if (request.method === "OPTIONS") {
    applyCors(response);
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    await logInfo({
      stack: "backend",
      service: "notification_be",
      package: "health",
      message: "Health check completed",
      metadata: { authentication: "pre-authorized" },
    });

    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "GET" && url.pathname === "/notifications") {
    const status = url.searchParams.get("status");
    const filteredNotifications = status
      ? notifications.filter((notification) => notification.status === status)
      : notifications;

    await logInfo({
      stack: "backend",
      service: "notification_be",
      package: "notifications",
      message: "Notifications fetched",
      metadata: {
        status: status || "all",
        notificationCount: filteredNotifications.length,
        authentication: "pre-authorized",
      },
    });

    sendJson(response, 200, {
      notifications: filteredNotifications,
      authentication: "pre-authorized",
    });
    return;
  }

  await logInfo({
    stack: "backend",
    service: "notification_be",
    package: "router",
    message: "Route not found",
    metadata: {
      method: request.method,
      path: url.pathname,
    },
  });

  sendJson(response, 404, { error: "Not found" });
}

const server = http.createServer(
  withNodeHttpLogging(handleRequest, {
    stack: "backend",
    service: "notification_be",
    package: "http-server",
  }),
);

server.on("error", (error) => {
  void logError({
    stack: "backend",
    service: "notification_be",
    package: "startup",
    message: "Notification backend failed",
    metadata: { error },
  });
});

server.listen(port, host, () => {
  void logInfo({
    stack: "backend",
    service: "notification_be",
    package: "startup",
    message: "Notification backend started",
    metadata: { host, port },
  });
});
