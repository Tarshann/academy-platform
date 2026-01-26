# Vercel Production Checklist

> Fill in after verifying the production deployment configuration.

## Environment Variables

- [ ] Clerk variables set (publishable + secret).
- [ ] Stripe keys + webhook secret set.
- [ ] Database connection set (Neon/PG).
- [ ] Resend API key set.
- [ ] Forge/S3 variables set (`BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`).
- [ ] `ENABLE_SOCKET_IO` and `VITE_ENABLE_SOCKET_IO` set appropriately for the runtime.
- [ ] `STORAGE_MAX_BYTES` and `STORAGE_ALLOWED_CONTENT_TYPES` set for upload safety.

## Build + Output

- [ ] Vercel build output configured correctly (Vite + server).
- [ ] API routes reachable from deployed domain.
- [ ] SPA fallback configured where needed.

## Client Bundle Safety

- [ ] Vite env usage verified (no secrets bundled to client).
