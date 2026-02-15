# Ship Readiness Pack

This folder contains the ship-readiness checklist, acceptance criteria, and the copy/paste instruction pack requested for verifying the Academy Platform migration and production readiness.

## What to do next

1. Run the instruction pack in `instruction-pack.md`.
2. Fill in the evidence files (`link-crawl.json`, `auth-matrix.md`, `env-audit.md`, `realtime-decision.md`, `vercel-prod-check.md`).
3. Use `acceptance-criteria.md` as the final ship gate.

## Files

- `deployment-audit-checklist.md` — Deployment-grade audit checklist.
- `acceptance-criteria.md` — Ship gate criteria and evidence bundle.
- `instruction-pack.md` — Copy/paste commands and tasks.
- `domain-cutover.md` — Domain flip checklist for academytn.com.
- `link-crawl.json` — Link crawl evidence (populate after running Playwright).
- `link-crawl-summary.md` — Human-readable crawl summary.
- `auth-matrix.md` — Auth + role enforcement matrix.
- `env-audit.md` — Production vs. dev env audit.
- `realtime-decision.md` — Socket.IO/Vercel realtime decision.
- `vercel-prod-check.md` — Vercel production configuration checklist.
