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
| Platform | App? | Web? | Key Strength |
|----------|------|------|-------------|
| TeamSnap | Yes | Yes | Team management + scheduling |
| SportsEngine | Yes | Yes | Registration + org management |
| GameChanger | Yes | Yes | Live scoring + stats |
| LeagueApps | No | Yes | Registration workflows |
| BAND | Yes | No | Group communication |
| TeamLinkt | Yes | Yes | Canadian market |

### Aspirational (Engagement/UX Models)
| Platform | Why Study |
|----------|----------|
| ClassPass | Subscription booking UX |
| Mindbody | Fitness business management patterns |
| Peloton | Engagement loops, streaks, achievements |
| Nike Training Club | Training content, progress tracking |

### Local (Gallatin, TN Area)
*(To be researched in RES-002)*

---

## Research Tracker

| ID | Area | Status | Output Location |
|----|------|--------|----------------|
| RES-001 | Competitor app feature analysis | BACKLOG | `competitor-snapshots.md` |
| RES-002 | Local competitor analysis | BACKLOG | `competitor-snapshots.md` |
| RES-003 | SEO keyword competitive analysis | BACKLOG | `competitor-snapshots.md` |

---

## Recommendations Pipeline

### For Mobile Agent
*(Populated after RES-001)*

### For Portal Agent
*(Populated after RES-001)*

### For Marketing/SEO Agent
*(Populated after RES-002, RES-003)*
