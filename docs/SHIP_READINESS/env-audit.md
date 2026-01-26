# Environment Variable Audit (Production vs. Dev)

> Fill in after confirming required variables for Vercel production.

| Variable                        | Required in Production | Dev-only | Notes                                     |
| ------------------------------- | ---------------------- | -------- | ----------------------------------------- |
| `DATABASE_URL`                  | Yes                    | No       |                                           |
| `VITE_CLERK_PUBLISHABLE_KEY`    | Yes                    | No       |                                           |
| `CLERK_SECRET_KEY`              | Yes                    | No       |                                           |
| `STRIPE_SECRET_KEY`             | Yes                    | No       |                                           |
| `STRIPE_WEBHOOK_SECRET`         | Yes                    | No       |                                           |
| `RESEND_API_KEY`                | Yes                    | No       |                                           |
| `BUILT_IN_FORGE_API_KEY`        | Yes                    | No       |                                           |
| `ENABLE_SOCKET_IO`              | Conditional            | No       | Enable only on websocket-capable runtime. |
| `VITE_ENABLE_SOCKET_IO`         | Conditional            | No       | Disable chat UI when realtime is off.     |
| `STORAGE_MAX_BYTES`             | Recommended            | No       | Upload size limit in bytes.               |
| `STORAGE_ALLOWED_CONTENT_TYPES` | Recommended            | No       | Comma-separated allowlist.                |
