# Deployment Audit Checklist

## Auth & Role Enforcement

- [ ] Server-side auth applied to all mutating tRPC procedures.
- [ ] Role checks enforced server-side (admin/coach/parent/athlete).
- [ ] Clerk webhooks/session validation verified on production domains.
- [ ] OAuth fallback disabled or gated when Clerk is configured.

## Vercel Routing & Runtime

- [ ] Decide serverless vs. separate host for Express backend.
- [ ] Validate `vercel.json` rewrites for API routes + SPA fallback.
- [ ] Websocket strategy documented and tested in production.

## Stripe Payments

- [ ] Webhook signature verification implemented.
- [ ] Webhook endpoint accessible without auth blocking Stripe.
- [ ] Idempotency keys used for charge creation.

## Database (Postgres + Drizzle)

- [ ] Drizzle schema matches deployed Postgres schema.
- [ ] Seeds contain production-safe data only.
- [ ] Indexes added for high-traffic queries.

## Storage (S3 via Forge API)

- [ ] No public write access to buckets.
- [ ] Signed URLs/proxy with strict content-type + size limits.
- [ ] Object keys are non-guessable and tenant-safe.

## Email (Resend)

- [ ] Sender domain verified.
- [ ] Bounce/complaint handling documented.
