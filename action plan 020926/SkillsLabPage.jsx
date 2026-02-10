import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Academy Skills Lab Page
 * Route: /skills-lab
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │  GUARDRAIL: This page is a PARALLEL LANE to Performance Lab.       │
 * │                                                         │
 * │  Rules:                                                 │
 * │  • Skills Lab is NOT part of Performance Lab                        │
 * │  • No premium language (no "transform", "elite", etc.)  │
 * │  • No pricing comparison with Performance Lab                       │
 * │  • No cross-links INTO Performance Lab page body                    │
 * │  • One soft mention of Performance Lab at bottom — that's it        │
 * │  • Intentionally less polished than /performance-lab                │
 * │  • Never call this: "Open Gym", "Drop-In Training",    │
 * │    "Group Training", or "Skills Night"                  │
 * │                                                         │
 * │  Purpose: goodwill, access, talent discovery              │
 * │  Revenue: $10/session (not a profit center)              │
 * └─────────────────────────────────────────────────────────┘
 */

const REGISTER_URL = '/skills-lab/register';

export default function SkillsLabPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        .skills-lab * { box-sizing: border-box; margin: 0; padding: 0; }
        .skills-lab { font-family: 'DM Sans', sans-serif; color: #2A2A2A; line-height: 1.6; -webkit-font-smoothing: antialiased; }
        .skills-lab a { text-decoration: none; }
        .sl-container { max-width: 720px; margin: 0 auto; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 640px) {
          .sl-schedule-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="skills-lab">
        {/* ── HEADER ── */}
        <section style={{
          background: 'linear-gradient(165deg, #0F1A2E 0%, #1B2A4A 100%)',
          padding: '6rem 2rem 4rem', textAlign: 'center',
        }}>
          <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
            <div style={{
              display: 'inline-block', background: 'rgba(74,164,96,0.15)', border: '1px solid rgba(74,164,96,0.3)',
              color: '#4AA460', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
              padding: '6px 16px', borderRadius: 100, marginBottom: '1.5rem',
            }}>Open to All Ages · Gallatin + Sumner County</div>

            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              color: '#fff', letterSpacing: 1, lineHeight: 1.1, marginBottom: '1rem',
            }}>
              ACADEMY <span style={{ color: '#4AA460' }}>SKILLS LAB</span>
            </h1>

            <p style={{
              fontSize: '1.05rem', color: 'rgba(255,255,255,0.65)', maxWidth: 520,
              margin: '0 auto 2rem', lineHeight: 1.7,
            }}>
              A high-energy, low-commitment session focused on fundamentals, movement, and positive competition — open to every young athlete in the community.
            </p>

            <Link to={REGISTER_URL} style={{
              display: 'inline-block', background: '#4AA460', color: '#fff', padding: '14px 40px',
              borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', letterSpacing: 0.3,
              transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(74,164,96,0.3)',
            }}>Register for This Week's Session</Link>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section style={{ padding: '4rem 2rem' }}>
          <div className="sl-container">
            <p style={{ fontSize: '1.05rem', color: '#555', lineHeight: 1.8 }}>
              <strong style={{ color: '#1B2A4A' }}>Academy Skills Lab</strong> sessions are part of The Academy's commitment to serving the broader community. These sessions are open to athletes of all ages and provide access to quality coaching, fun drills, and positive competition in a high-energy environment. Skills Lab is a way for athletes to stay active, learn fundamentals, and compete.
            </p>
            {/* GUARDRAIL: "What it's not" line protects Performance Lab without selling. Do not remove. */}
            <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '1rem', fontStyle: 'italic' }}>
              Skills Lab is not a long-term training program or membership.
            </p>
          </div>
        </section>

        {/* ── SCHEDULE ── */}
        <section style={{ padding: '3rem 2rem 4rem', background: '#F7FAF8' }}>
          <div className="sl-container">
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#1B2A4A',
              letterSpacing: 1, marginBottom: '0.5rem',
            }}>WEEKLY SCHEDULE</h2>
            <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '2rem' }}>
              Two sessions per week. Registration required.
            </p>

            <div className="sl-schedule-grid" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem',
            }}>
              {/* Tuesday */}
              <div style={{
                background: '#fff', borderRadius: 12, overflow: 'hidden',
                border: '1px solid #E0E8E2',
              }}>
                <div style={{
                  background: '#1B2A4A', padding: '1rem 1.5rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', background: '#E8722A',
                  }} />
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem',
                    color: '#fff', letterSpacing: 1,
                  }}>TUESDAY</span>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>Time</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1B2A4A' }}>6:00 – 7:00 PM</div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>Location</div>
                    <div style={{ fontSize: '0.95rem', color: '#555' }}>Indoor Gym</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>Ages</div>
                    <div style={{ fontSize: '0.95rem', color: '#555' }}>All ages welcome</div>
                  </div>
                </div>
              </div>

              {/* Thursday */}
              <div style={{
                background: '#fff', borderRadius: 12, overflow: 'hidden',
                border: '1px solid #E0E8E2',
              }}>
                <div style={{
                  background: '#1B2A4A', padding: '1rem 1.5rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', background: '#4AA460',
                  }} />
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem',
                    color: '#fff', letterSpacing: 1,
                  }}>THURSDAY</span>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>Time</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1B2A4A' }}>6:00 – 7:00 PM</div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>Location</div>
                    <div style={{ fontSize: '0.95rem', color: '#555' }}>Indoor Gym</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>Ages</div>
                    <div style={{ fontSize: '0.95rem', color: '#555' }}>All ages welcome</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '1.5rem', background: '#fff', borderRadius: 10, padding: '1rem 1.5rem',
              border: '1px solid #E0E8E2', display: 'flex', alignItems: 'center', gap: '0.75rem',
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '0.85rem', color: '#555' }}>
                <strong style={{ color: '#1B2A4A' }}>$10 per session</strong> · Registration required · Cap: 25–30 athletes per session
              </span>
            </div>
          </div>
        </section>

        {/* ── WHAT TO EXPECT ── */}
        <section style={{ padding: '4rem 2rem' }}>
          <div className="sl-container">
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#1B2A4A',
              letterSpacing: 1, marginBottom: '1.5rem',
            }}>WHAT TO EXPECT</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Dynamic Warmup', desc: 'Movement prep to get loose and ready to go.' },
                { label: 'Skill Stations', desc: 'Rotating drills covering fundamentals — dribbling, passing, footwork, agility.' },
                { label: 'Competitive Games', desc: 'Fun, structured games that put skills to work in a team environment.' },
                { label: 'Cool-Down', desc: 'Wrap-up and a high note to end on.' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '1rem', alignItems: 'flex-start',
                  padding: '1rem 0', borderBottom: i < 3 ? '1px solid #F0F0F0' : 'none',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: '#F0F7F2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 700, color: '#4AA460', flexShrink: 0,
                    fontFamily: "'Bebas Neue', sans-serif",
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1B2A4A', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REGISTER CTA ── */}
        <section style={{ padding: '3rem 2rem 4rem', background: '#F7FAF8' }}>
          <div className="sl-container" style={{ textAlign: 'center' }}>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#1B2A4A',
              letterSpacing: 1, marginBottom: '0.75rem',
            }}>REGISTER FOR THIS WEEK</h2>
            <p style={{ fontSize: '0.95rem', color: '#666', marginBottom: '1.5rem' }}>
              Registration is required so we can plan for the right number of coaches and equipment.
            </p>
            <Link to={REGISTER_URL} style={{
              display: 'inline-block', background: '#4AA460', color: '#fff', padding: '14px 40px',
              borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', letterSpacing: 0.3,
              transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(74,164,96,0.3)',
            }}>Register for Skills Lab</Link>
          </div>
        </section>

        {/* ── PERFORMANCE LAB DISTINCTION (soft, one-time, bottom of page) ── */}
        {/*
          GUARDRAIL: This is the ONLY place Performance Lab is mentioned on this page.
          Do not add Performance Lab callouts, comparisons, or CTAs anywhere else.
          Keep this understated. It's a signpost, not a pitch.
        */}
        <section style={{
          padding: '2.5rem 2rem', borderTop: '1px solid #E8E8E8',
        }}>
          <div className="sl-container" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: '#999', lineHeight: 1.7 }}>
              Families looking for year-round, structured weekly training can learn about the{' '}
              <Link to="/performance-lab" style={{ color: '#E8722A', fontWeight: 600 }}>
                Academy Performance Lab
              </Link>.
            </p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{
          background: '#0F1A2E', padding: '2rem', textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
            © 2026 The Academy · Gallatin, TN ·{' '}
            <a href="tel:5712920833" style={{ color: '#4AA460' }}>(571) 292-0833</a> ·{' '}
            <a href="https://academytn.com" style={{ color: '#4AA460' }}>academytn.com</a>
          </p>
        </footer>
      </div>
    </>
  );
}
