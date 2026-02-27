# Review Log — Cross-Cutting Issues & QA Findings

> Any agent can write here. This is the place for issues that span workstreams,
> bugs found during review, and items that need another agent's attention.

---

## How to Log

Add entries in reverse chronological order (newest first). Include:
- **Date**
- **Found by** (which agent/workstream)
- **Severity**: CRITICAL / HIGH / MEDIUM / LOW
- **Affects**: Which app(s) or workstream(s)
- **Description**: What's the issue
- **Action needed**: What should be done and by whom
- **Status**: OPEN / IN PROGRESS / RESOLVED

---

## Open Issues

| # | Date | Severity | Found By | Affects | Description | Action | Status |
|---|------|----------|----------|---------|-------------|--------|--------|
| 1 | 2026-02-23 | MEDIUM | Coordinator | Mobile + Marketing | Testimonials exist in two places: `academy-marketing/lib/config.ts` and `client/src/components/StructuredData.tsx`. Can drift. | Any testimonial change must update both. Portal agent should consider consolidating. | OPEN |
| 2 | 2026-02-23 | LOW | Coordinator | Mobile | Coach contact info hardcoded in `academy-app/app/(tabs)/profile.tsx`. Should pull from `coaches.list` API. | Mobile agent: replace hardcoded phone numbers with API data. | OPEN |
| 3 | 2026-02-23 | LOW | Coordinator | Mobile | Profile footer shows hardcoded "v1.1" instead of actual app version. | Mobile agent: read version from Constants.expoConfig. | OPEN |

---

## Resolved Issues

| # | Date | Resolved | Description | Resolution |
|---|------|----------|-------------|------------|
| — | — | — | — | — |

---

## Architecture Decisions Record (ADR)

Cross-cutting architectural decisions that affect multiple workstreams go here.

| # | Date | Decision | Context | Affects |
|---|------|----------|---------|---------|
| — | — | — | — | — |
