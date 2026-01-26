# Ship Readiness Acceptance Criteria

## Evidence Bundle

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (Vitest)
- [ ] `pnpm e2e` passes (Playwright)
- [ ] Link crawl report with 0 broken links and sane flows
- [ ] Auth + role enforcement matrix (routes + API procedures)
- [ ] Env audit for Vercel production vs. dev-only variables

## UX Flow Sanity

- [ ] Public user can browse Programs/Schedule/About without login.
- [ ] Register flow does not require login before signup.
- [ ] Post-signup routing lands in a functional member hub.
- [ ] CTAs map to a single, clear outcome (no dead buttons/placeholder routes).

## Realtime Strategy

- [ ] Realtime decision documented (Socket.IO on Vercel).
