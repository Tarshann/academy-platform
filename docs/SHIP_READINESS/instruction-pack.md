# Ship Readiness Instruction Pack (Copy/Paste)

## 1) Local + CI audit commands

```bash
pnpm -v
node -v

pnpm install

# Quality gates
pnpm lint
pnpm typecheck
pnpm test

# E2E (must include auth + register flows)
pnpm e2e
```

## 2) Crawl the app and validate links + interactions

Implement a Playwright crawl that:

- Visits every nav link
- Clicks every CTA button
- Validates that routes render non-empty content
- Captures console errors + failed network requests

Outputs:

- `docs/SHIP_READINESS/link-crawl.json`
- `docs/SHIP_READINESS/link-crawl-summary.md`

Run the provided Playwright spec:

```bash
E2E_BASE_URL="https://your-preview-url.vercel.app" pnpm test:e2e -- --grep \"link crawl\"
```

## 3) Produce an Auth + Role Enforcement Matrix

Create a table like:

- Route: `/signup` → Public
- Route: `/dashboard` → Auth required
- API: `programs.create` → Admin only
- API: `chat.send` → Member only

Output:

- `docs/SHIP_READINESS/auth-matrix.md`

## 4) Websocket decision (Socket.IO on Vercel)

Pick one and document it:

- Option A: Replace live Socket.IO with polling/SSE for Phase 1
- Option B: Move backend to a websocket-friendly host (Render/Fly/DO)
- Option C: Replace Socket.IO with a managed realtime layer (Pusher/Ably)

Output:

- `docs/SHIP_READINESS/realtime-decision.md`

## 5) Vercel production checklist

Confirm:

- Production env vars set (Clerk/Stripe/DB/Resend/Forge).
- Correct build + output configuration.
- API routes reachable from deployed domain.
- No secrets in client bundle (verify Vite env usage).

Output:

- `docs/SHIP_READINESS/vercel-prod-check.md`
