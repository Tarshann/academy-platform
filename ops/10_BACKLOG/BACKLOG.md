# Backlog System

> Tickets are organized across three files by priority:
>
> - **NOW.md** — Currently in flight. Agents are actively working these.
> - **NEXT.md** — Prioritized for the next cycle. Ready to pull when NOW empties.
> - **LATER.md** — Valuable but not time-critical. Will be promoted as capacity allows.
>
> Completed tickets move to the DONE section at the bottom of their original file.

---

## Ticket Template

Every ticket MUST use this format:

```markdown
### [ID]: [Short Title]
- **Workstream**: Mobile / Portal / Marketing / SEO / Research / Release
- **Owner**: [Agent role — assigned when work begins]
- **Status**: BACKLOG / IN PROGRESS / BLOCKED / DONE
- **Goal**: One sentence describing the user-facing outcome
- **Scope**:
  - Bullet list of what's included
- **Non-goals**:
  - What this ticket explicitly does NOT cover
- **Acceptance Criteria**:
  - [ ] Specific, testable checkbox
  - [ ] Another criterion
- **Touched Files**:
  - `path/to/file.tsx`
- **Test Plan**:
  - Step-by-step manual verification
- **Telemetry**:
  - PostHog events added/modified
- **Release**: v1.3.0 / web deploy / SEO push
```

## Numbering Convention

- `MOB-001` through `MOB-099`: Mobile app
- `WEB-001` through `WEB-099`: Web portal
- `MKT-001` through `MKT-099`: Marketing site
- `SEO-001` through `SEO-099`: SEO work
- `RES-001` through `RES-099`: Research
- `REL-001` through `REL-099`: Release/QA

## Moving Tickets

- When starting: set Status to `IN PROGRESS`, add your agent role to Owner
- When blocked: set Status to `BLOCKED`, add blocker description
- When done: set Status to `DONE`, move to DONE section at bottom of file
- To re-prioritize: move the entire ticket block between NOW/NEXT/LATER files
