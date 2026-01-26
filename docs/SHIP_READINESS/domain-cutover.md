# Domain Cutover Checklist (academytn.com)

## Prerequisites

- Ship readiness gates passed (`pnpm lint`, `pnpm check`, `pnpm test`, `pnpm test:e2e`).
- Evidence artifacts populated in `docs/SHIP_READINESS/`.
- Stripe webhooks verified and processing without duplicates.
- Realtime strategy confirmed and deployed appropriately.

## Safe Cutover Sequence

1. Add `academytn.com` and `www.academytn.com` to the Vercel project.
2. Verify domain ownership (TXT record).
3. Confirm HTTPS certificate issuance and redirect rules.
4. Update DNS:
   - `academytn.com` → Vercel A record
   - `www.academytn.com` → Vercel CNAME
5. Confirm final redirects (www → apex or apex → www).
6. Run a post-cutover smoke test (home, programs, signup, member redirect).

## NO-GO Conditions

- Register requires login prior to guest checkout.
- Any mutation endpoint accepts unauthenticated requests.
- Stripe webhook signature verification missing.
- Chat enabled on Vercel without websocket-capable runtime.
- Link crawl reports broken links or console errors.
