# Logging Middleware

Shared logging middleware for the notification system.

- Use `logInfo`, `logWarn`, `logError`, or `withRequestLogging` instead of `console.*`.
- Logs are buffered in memory for local development.
- Set `LOGGING_MIDDLEWARE_URL` to POST every log entry to a remote collector.
- Authentication is not enforced here; callers are treated as pre-authorized by the application.
