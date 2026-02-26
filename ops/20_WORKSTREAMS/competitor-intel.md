# Workstream: Competitive Intelligence

> **Owner**: Competitor Intel Agent
> **Scope**: Research only — NO code changes
> **Output**: Reports in `ops/50_REPORTS/`, adoption tickets in `NEXT.md`

---

## Mission

Turn competitor analysis into shipping tickets. Every insight must end with a recommendation that another agent can execute.

---

## Output Format

Every competitor finding becomes:

```markdown
### [Finding Title]
- **Observation**: What the competitor does
- **Why it matters**: Metric impact (engagement, revenue, retention)
- **How to implement**: Where in our platform, what API/routes exist
- **Effort**: S (< 1 session) / M (1-2 sessions) / L (3+ sessions)
- **Ticket created**: [ID] in NEXT.md or LATER.md
```

---

## Competitors

### Direct (Youth Sports Platforms)
| Platform | App? | Web? | Key Strength | Analyzed? |
|----------|------|------|-------------|-----------|
| TeamSnap | Yes | Yes | Team management + scheduling | Done (RES-001) |
| SportsEngine | Yes | Yes | Registration + org management | Done (RES-001) |
| GameChanger | Yes | Yes | Live scoring + stats + video highlights | Done (RES-001) |
| LeagueApps | No | Yes | Registration workflows | Not yet |
| BAND | Yes | No | Group communication | Not yet |
| TeamLinkt | Yes | Yes | Canadian market | Not yet |

### Aspirational (Engagement/UX Models)
| Platform | Why Study | Analyzed? |
|----------|----------|-----------|
| ClassPass | Subscription booking UX | Not yet |
| Mindbody | Fitness business management patterns | Not yet |
| Peloton | Engagement loops, streaks, achievements | Referenced in RES-001 |
| Nike Training Club | Training content, progress tracking | Referenced in RES-001 |

### Local (Gallatin, TN Area)
| Competitor | Location | Threat Level | Analyzed? |
|-----------|----------|-------------|-----------|
| D1 Training Hendersonville | Hendersonville, TN | HIGH | Done (RES-002) |
| Six1Five Sports Training | Mt. Juliet / Lebanon / Gallatin | MEDIUM | Done (RES-002) |
| N Zone Sports Northern TN | Gallatin, TN | LOW | Done (RES-002) |
| Sports Lab TN | Mt. Juliet / Lebanon | LOW | Done (RES-002) |
| Next Level Athlete Training | Middle TN | MEDIUM | Done (RES-002) |
| 26 Training Academy | Nashville area | LOW | Done (RES-002) |
| i9 Sports East Nashville | East Nashville | LOW | Done (RES-002) |

---

## Research Tracker

| ID | Area | Status | Output Location | Date |
|----|------|--------|----------------|------|
| RES-001 | Competitor app feature analysis | DONE | `competitor-snapshots.md` | 2026-02-26 |
| RES-002 | Local competitor analysis | DONE | `competitor-snapshots.md` | 2026-02-26 |
| RES-003 | SEO keyword competitive analysis | DONE | `competitor-snapshots.md` | 2026-02-26 |

---

## Recommendations Pipeline

### For Mobile Agent
| Ticket | Feature | Source | Priority |
|--------|---------|--------|----------|
| MOB-040 | Session RSVP / Availability | RES-001 (TeamSnap) | HIGH — NEXT.md |
| MOB-018 | Guided Onboarding Flow | RES-001 (all competitors) | HIGH — promoted to NEXT.md |
| MOB-041 | Progress/Stats Dashboard | RES-001 (GameChanger) | MEDIUM — LATER.md |
| MOB-042 | Achievement Badges/Streaks | RES-001 (Peloton/NTC) | LOW — LATER.md |
| MOB-050 | Family/Multi-Child Accounts | RES-001 (TeamSnap/SportsEngine) | MEDIUM — LATER.md |

### For Portal Agent
| Ticket | Feature | Source | Priority |
|--------|---------|--------|----------|
| WEB-030 | Calendar iCal Feed Export | RES-001 (TeamSnap/SportsEngine) | HIGH — NEXT.md |

### For Marketing/SEO Agent
| Ticket | Feature | Source | Priority |
|--------|---------|--------|----------|
| SEO-010 | Google Business Profile Activation | RES-002, RES-003 | CRITICAL — NEXT.md |
| SEO-011 | FAQPage Schema Markup | RES-003 | HIGH (easy win) — NEXT.md |
| MKT-020 | Blog Content Publishing System | RES-003 | HIGH — NEXT.md |
| MKT-021 | Sport-Specific Landing Pages | RES-003 | HIGH — NEXT.md |
| MKT-022 | Service-Area City Pages | RES-002, RES-003 | MEDIUM — LATER.md |
| MKT-023 | Testimonial Expansion | RES-002 | MEDIUM — LATER.md |
| MKT-024 | Video Content on Marketing Site | RES-003 | MEDIUM — LATER.md |
| MKT-025 | Results/Metrics Page | RES-001, RES-003 | MEDIUM — LATER.md |
