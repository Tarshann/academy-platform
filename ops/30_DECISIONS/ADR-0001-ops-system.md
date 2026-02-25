# ADR-0001: Agent Coordination via /ops/ System

**Date**: 2026-02-23
**Status**: Accepted
**Affects**: All workstreams

## Context

Multiple agents need to work across mobile app, web portal, marketing site, and research simultaneously without overlap, duplication, or misalignment.

## Decision

Use a folder-based coordination system at `/ops/` with:
- Read-first foundation docs (vision, rules, quality bar, definitions)
- Ticketed backlog with acceptance criteria (NOW/NEXT/LATER)
- Workstream-scoped files with ownership boundaries
- Architecture Decision Records for cross-cutting choices
- Release checklists and QA gates
- Status reports for cross-agent communication

## Rationale

- **Folder over single doc**: Agents can read in parallel without context pollution
- **Tickets over prose**: Acceptance criteria prevent "kind of done" situations
- **Ownership boundaries**: Directory maps prevent agents from stepping on each other
- **ADRs**: Prevent re-litigating decisions across sessions

## Consequences

- Every agent must read ops/00_READ_FIRST/ before starting work
- Every code change must trace to a ticket
- Status updates are mandatory at session start and end
