# Notification Backend

Minimal Node.js notification API.

- `GET /health`
- `GET /notifications`
- `GET /notifications?status=queued`

All routes use `logging_middleware_`. No login or registration flow is required because requests are treated as pre-authorized.
