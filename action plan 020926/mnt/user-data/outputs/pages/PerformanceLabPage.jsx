import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Performance Lab Landing Page — Academy Performance Lab
 * 
 * Integration:
 *   1. Add route in your router: <Route path="/performance-lab" element={<PerformanceLabPage />} />
 *   2. Add route for apply form: <Route path="/performance-lab/apply" element={<PerformanceLabApplyPage />} />
 *   3. Add "ADM" nav link to your site header
 *   4. Import fonts in index.html or root CSS:
 *      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
 */

const APPLY_URL = '/performance-lab/apply';

// ─── FAQ Data ──────────────────────────────────────────────
const faqs = [
  {
    q: 'Is this just basketball training?',
    a: "Basketball is our primary sport vehicle, but we're building athletes first. Your child gets strength, speed, agility, and coordination training that transfers to every sport they play. Soccer players, football players, multi-sport kids — they all benefit equally.",
  },
  {
    q: 'My kid already does basketball training. Why switch?',
    a: "Most basketball programs only work on basketball skills. They skip the athletic foundation — the strength, speed, and agility work that actually makes skill development stick. We combine both, so your child progresses faster and is less likely to get injured.",
  },
  {
    q: '$280/month seems like a lot. Can we do one session a week?',
    a: "Performance Lab is a membership because consistency is the product — three sessions per week is the effective dose for real development. Most families are already spending $340–$440+/month across fragmented training. Performance Lab replaces the chaos with one system at $280/month.",
  },
  {
    q: 'What if my child plays a different sport in-season?',
    a: "That's exactly who this is for. Our seasonal programming adjusts automatically. During their sport's season, we focus on movement quality, durability, and injury prevention. During the off-season, we build the strength and explosiveness that gives them an edge when their season starts.",
  },
  {
    q: 'What ages is this for?',
    a: 'Performance Lab is designed for athletes ages 8–14. Groups are organized by age and ability level to keep training effective and appropriately challenging for every athlete in the group. Our oldest members (13–14) also have the opportunity to earn leadership roles within The Academy.',
  },
  {
    q: 'What if we miss a session?',
    a: "Sunday is built into the schedule as a makeup and open skill session. Life happens — we've designed the program to accommodate that without falling behind.",
  },
];

// ─── FAQ Item Component ────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #E8E8E8' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: 'none', border: 'none', textAlign: 'left',
          padding: '1.25rem 0', fontSize: '1rem', fontWeight: 600, color: '#1B2A4A',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {q}
        <span style={{
          fontSize: '1.5rem', color: '#E8722A', flexShrink: 0, marginLeft: '1rem',
          transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s',
        }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? '300px' : '0', overflow: 'hidden', transition: 'max-height 0.4s ease',
      }}>
        <p style={{ paddingBottom: '1.25rem', fontSize: '0.95rem', color: '#666', lineHeight: 1.7 }}>
          {a}
        </p>
      </div>
    </div>
  );
}

// ─── Main Performance Lab Page ─────────────────────────────────────────
export default function PerformanceLabPage() {
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.target === heroRef.current) {
            setStickyVisible((prev) => (e.isIntersecting ? false : prev || !e.isIntersecting));
            if (e.isIntersecting) setStickyVisible(false);
            else setStickyVisible(true);
          }
          if (e.target === footerRef.current && e.isIntersecting) {
            setStickyVisible(false);
          }
        });
      },
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        .adm-page * { box-sizing: border-box; margin: 0; padding: 0; }
        .adm-page { font-family: 'DM Sans', sans-serif; color: #2A2A2A; line-height: 1.6; -webkit-font-smoothing: antialiased; }
        .adm-page a { text-decoration: none; }
        .adm-cta-btn {
          display: inline-block; background: #E8722A; color: #fff; padding: 16px 48px;
          border-radius: 8px; font-weight: 700; font-size: 1rem; letter-spacing: 0.5px;
          transition: all 0.3s; box-shadow: 0 4px 24px rgba(232,114,42,0.3);
        }
        .adm-cta-btn:hover { background: #D4601E; transform: translateY(-2px); box-shadow: 0 6px 32px rgba(232,114,42,0.4); }
        .display-font { font-family: 'Bebas Neue', sans-serif; }
        .section-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #E8722A; margin-bottom: 1rem; }
        .section-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(2rem, 4vw, 3rem); color: #1B2A4A; letter-spacing: 1px; line-height: 1.1; margin-bottom: 1.5rem; }
        .container { max-width: 960px; margin: 0 auto; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        
        @media (max-width: 768px) {
          .adm-grid-2 { grid-template-columns: 1fr !important; }
          .adm-grid-3 { grid-template-columns: 1fr !important; }
          .problem-grid-inner { grid-template-columns: 1fr !important; }
          .adm-mobile-sticky { display: block !important; }
          .adm-footer { padding-bottom: 80px !important; }
        }
      `}</style>

      <div className="adm-page">
        {/* ── HERO ── */}
        <section ref={heroRef} style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '6rem 2rem 4rem', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(165deg, #0F1A2E 0%, #1B2A4A 60%, #243B5E 100%)',
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 70% 20%, rgba(232,114,42,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(232,114,42,0.06) 0%, transparent 50%)',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, pointerEvents: 'none',
            background: 'linear-gradient(to top, #fff, transparent)',
          }} />
          <div style={{ maxWidth: 800, textAlign: 'center', position: 'relative', zIndex: 2, animation: 'fadeUp 0.8s ease-out' }}>
            <div style={{
              display: 'inline-block', background: 'rgba(232,114,42,0.15)', border: '1px solid rgba(232,114,42,0.3)',
              color: '#E8722A', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
              padding: '8px 20px', borderRadius: 100, marginBottom: '2rem',
            }}>Gallatin + Sumner County · Ages 8–14</div>

            <h1 className="display-font" style={{
              fontSize: 'clamp(3rem, 7vw, 5.5rem)', color: '#fff', lineHeight: 1, letterSpacing: 2, marginBottom: '1.5rem',
            }}>
              BUILD COMPLETE <span style={{ color: '#E8722A' }}>ATHLETES.</span><br />NOT JUST BETTER PLAYERS.
            </h1>

            <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
              Year-round strength, speed, skill, and confidence training — all in one membership, one schedule, and one coaching staff. So you don't have to piece it together yourself.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
              {[['2', 'Sessions / Week'], ['3', 'Training Environments'], ['6–8', 'Athletes / Group']].map(([num, label]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div className="display-font" style={{ fontSize: '2.5rem', color: '#E8722A', letterSpacing: 1 }}>{num}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            <Link to={APPLY_URL} className="adm-cta-btn">Apply for Performance Lab</Link>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '1rem' }}>Limited spots · Groups capped for coaching quality</p>
          </div>
        </section>

        {/* ── PROBLEM ── */}
        <section style={{ padding: '5rem 2rem', background: '#FAF8F5' }}>
          <div className="container">
            <div className="section-label">The Problem</div>
            <div className="section-title">MOST FAMILIES ARE DOING "RANDOM TRAINING."</div>
            <div className="problem-grid-inner" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '3rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {[
                  ['$340–$440+', 'What most parents spend monthly across fragmented programs'],
                  ['3–4', 'Separate locations, schedules, and coaching staffs to manage'],
                  ['0', 'System connecting any of it into real development'],
                ].map(([val, desc]) => (
                  <div key={val} style={{
                    background: '#fff', borderRadius: 12, padding: '1.5rem',
                    borderLeft: '4px solid #E8722A', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  }}>
                    <div className="display-font" style={{ fontSize: '2rem', color: '#1B2A4A', letterSpacing: 1 }}>{val}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: 4 }}>{desc}</div>
                  </div>
                ))}
              </div>
              <div>
                <p className="display-font" style={{ fontSize: '2rem', color: '#1B2A4A', lineHeight: 1.2, letterSpacing: 0.5 }}>
                  RANDOM TRAINING PRODUCES <span style={{ color: '#E8722A' }}>RANDOM RESULTS.</span>
                </p>
                <p style={{ color: '#666', fontSize: '0.95rem', marginTop: '1.5rem', lineHeight: 1.7 }}>
                  You're spending the money. You're making the drives. You're showing up. But without a system behind it, your child's development is left to chance. The Academy changes that with one integrated program that replaces the chaos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PROMISE ── */}
        <section style={{ background: '#1B2A4A', textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="container">
            <p className="display-font" style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', color: '#fff', maxWidth: 800,
              margin: '0 auto', lineHeight: 1.3, letterSpacing: 1,
            }}>
              IF YOUR CHILD TRAINS WITH THE ACADEMY, THEY WILL BE{' '}
              <span style={{ color: '#E8722A' }}>STRONGER, FASTER, MORE COORDINATED, AND MORE CONFIDENT</span>
              {' '}— REGARDLESS OF SPORT.
            </p>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem' }}>
              That's not a tagline. It's the only promise we make.
            </p>
          </div>
        </section>

        {/* ── WHAT'S INCLUDED ── */}
        <section style={{ padding: '5rem 2rem' }}>
          <div className="container">
            <div className="section-label">What You Get</div>
            <div className="section-title">EVERYTHING. NO ADD-ONS. NO MENUS.</div>
            <p style={{ fontSize: '1.05rem', color: '#666', maxWidth: 680, lineHeight: 1.7 }}>
              Every Performance Lab athlete receives the exact same comprehensive program. No tiers to compare. No upsells to dodge. Consistency is the product.
            </p>

            <div className="adm-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '3rem' }}>
              {[
                { icon: '⚡', title: 'WEEKLY PERFORMANCE TRAINING', desc: 'Strength, speed, agility, coordination, and injury prevention. The athletic base layer that makes every sport easier.', loc: 'Academy Performance Center or Outdoor Field · 1x/week' },
                { icon: '🏀', title: 'WEEKLY SKILL SESSION', desc: 'Shooting, ball handling, decision-making, and live reps. Game confidence built through structured, competitive drills.', loc: 'Indoor Gym (Tue / Thu / Sun) · 1x/week' },
                { icon: '📅', title: 'SEASONAL PROGRAMMING', desc: "Off-season: strength & speed. Pre-season: explosiveness. In-season: durability & movement quality. Your child's training adapts automatically.", loc: 'Year-round · Built into every session' },
                { icon: '🏠', title: 'AT-HOME PLAN + PARENT UPDATES', desc: "Monthly 15–20 min homework plan (no equipment needed) plus progress notes so you always know what's happening and why.", loc: 'Delivered monthly · Clear structure, zero guesswork' },
              ].map((card) => (
                <div key={card.title} style={{
                  background: '#F5F5F5', borderRadius: 12, padding: '2rem', border: '1px solid #E8E8E8',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem', marginBottom: '1rem', background: '#FFF3E8', color: '#E8722A', fontWeight: 700,
                  }}>{card.icon}</div>
                  <h3 className="display-font" style={{ fontSize: '1.3rem', color: '#1B2A4A', letterSpacing: 0.5, marginBottom: '0.5rem' }}>{card.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.6 }}>{card.desc}</p>
                  <div style={{ fontSize: '0.8rem', color: '#E8722A', fontWeight: 600, marginTop: '0.75rem' }}>{card.loc}</div>
                </div>
              ))}

              <div style={{
                gridColumn: '1 / -1', background: '#1B2A4A', borderRadius: 12, padding: '1.5rem 2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap',
              }}>
                {['No upsells', 'No add-ons', 'No drop-ins', 'No menus'].map((text) => (
                  <span key={text} style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
                    <span style={{ color: '#E8722A', fontWeight: 700 }}>✓</span> {text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── THREE SPACES ── */}
        <section style={{ padding: '5rem 2rem', background: '#FAF8F5' }}>
          <div className="container">
            <div className="section-label">Three Environments, One System</div>
            <div className="section-title">EVERY SPACE HAS A JOB.</div>
            <p style={{ fontSize: '1.05rem', color: '#666', maxWidth: 680, lineHeight: 1.7 }}>
              Most programs train kids in one gym and call it development. We use three purpose-built environments — each designed to develop a different layer of athleticism.
            </p>

            <div className="adm-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '3rem' }}>
              {[
                { tag: 'Performance HQ', tagColor: '#E8722A', name: 'ACADEMY PERFORMANCE CENTER', role: 'Where athletes are built.', items: ['Strength training & functional movement', 'Speed mechanics & acceleration', 'Agility & change of direction', 'Injury prevention & body awareness'], dotColor: '#E8722A' },
                { tag: 'Skill Expression', tagColor: '#2E7DB5', name: 'INDOOR GYMS', role: 'Where basketball skill meets game confidence.', items: ['Shooting form & high-rep shooting volume', 'Ball handling & decision-making', 'Live reps & competitive scenarios', 'Game IQ development'], dotColor: '#2E7DB5' },
                { tag: 'Athletic Translation', tagColor: '#3A8B4C', name: 'OUTDOOR FIELD', role: 'Where speed transfers to real sport.', items: ['Sprint & acceleration patterns', 'Change of direction & deceleration', 'Multi-sport movement transfer', 'Open-field spatial awareness'], dotColor: '#3A8B4C' },
              ].map((space) => (
                <div key={space.name} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #E8E8E8' }}>
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid #E8E8E8' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: '0.5rem', color: space.tagColor }}>{space.tag}</div>
                    <h3 className="display-font" style={{ fontSize: '1.4rem', color: '#1B2A4A', letterSpacing: 0.5 }}>{space.name}</h3>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.75rem' }}>{space.role}</div>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {space.items.map((item) => (
                        <li key={item} style={{
                          fontSize: '0.85rem', color: '#666', padding: '6px 0', borderBottom: '1px solid #F5F5F5',
                          paddingLeft: '1.2rem', position: 'relative',
                        }}>
                          <span style={{
                            position: 'absolute', left: 0, top: '50%', width: 6, height: 6, borderRadius: '50%',
                            transform: 'translateY(-50%)', background: space.dotColor,
                          }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section style={{ padding: '5rem 2rem', textAlign: 'center' }}>
          <div className="container">
            <div className="section-label">Membership Investment</div>
            <div className="section-title">ONE PRICE. EVERYTHING INCLUDED.</div>

            <div style={{ background: '#fff', border: '2px solid #1B2A4A', borderRadius: 16, maxWidth: 520, margin: '3rem auto 0', overflow: 'hidden' }}>
              <div style={{ background: '#1B2A4A', padding: '2rem' }}>
                <div className="display-font" style={{ fontSize: '4rem', color: '#E8722A', letterSpacing: 2, lineHeight: 1 }}>$280</div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>per athlete / month</div>
              </div>
              <div style={{ padding: '2rem' }}>
                <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left' }}>
                  {[
                    'Weekly Performance Training (strength, speed, agility)',
                    'Weekly Basketball Skill Session',
                    'Seasonal programming (auto-adapts year-round)',
                    'Monthly at-home development plan',
                    'Monthly parent progress updates',
                    'Sunday makeup / open session access',
                    'Leadership opportunities for older athletes (ages 13–14, by invitation)',
                  ].map((item) => (
                    <li key={item} style={{
                      padding: '10px 0', borderBottom: '1px solid #F5F5F5', fontSize: '0.95rem',
                      color: '#333', display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <span style={{ color: '#E8722A', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#FFF3E8', borderRadius: 10, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>
                    Most families spend <strong style={{ color: '#1B2A4A' }}>$340–$440+/month</strong> across 3–4 fragmented programs.<br />
                    Performance Lab replaces all of it — for <strong style={{ color: '#1B2A4A' }}>less money with better results</strong>.
                  </p>
                </div>

                <Link to={APPLY_URL} className="adm-cta-btn" style={{ marginTop: '1.5rem' }}>Apply for Performance Lab</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ padding: '5rem 2rem', background: '#FAF8F5' }}>
          <div className="container">
            <div className="section-label">Common Questions</div>
            <div className="section-title">PARENTS ASK. WE ANSWER.</div>
            <div style={{ maxWidth: 700, margin: '3rem auto 0' }}>
              {faqs.map((faq) => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{
          background: '#1B2A4A', textAlign: 'center', padding: '5rem 2rem', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(232,114,42,0.1) 0%, transparent 60%)',
          }} />
          <h2 className="display-font" style={{
            fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#fff', letterSpacing: 1,
            marginBottom: '1rem', position: 'relative',
          }}>READY TO BUILD A COMPLETE ATHLETE?</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', marginBottom: '0.75rem', position: 'relative' }}>
            Apply now. Coach Mac will follow up within 24 hours to confirm fit and placement.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '2rem', position: 'relative' }}>
            Groups are capped. We place athletes by age and ability after a quick call.
          </p>
          <Link to={APPLY_URL} className="adm-cta-btn" style={{ position: 'relative' }}>Apply for Performance Lab</Link>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginTop: '1.5rem', position: 'relative' }}>
            Limited spots · Groups capped at 6–8 athletes · Waitlist after capacity
          </p>
        </section>

        {/* ── FOOTER ── */}
        <footer ref={footerRef} className="adm-footer" style={{
          background: '#0F1A2E', padding: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
            © 2026 The Academy · Gallatin, TN ·{' '}
            <a href="tel:5712920833" style={{ color: '#E8722A' }}>(571) 292-0833</a> ·{' '}
            <a href="https://academytn.com" style={{ color: '#E8722A' }}>academytn.com</a>
          </p>
        </footer>

        {/* ── STICKY MOBILE CTA ── */}
        <div className="adm-mobile-sticky" style={{
          display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99,
          background: '#1B2A4A', padding: '12px 16px', borderTop: '2px solid #E8722A', textAlign: 'center',
          transform: stickyVisible ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.3s ease',
        }}>
          <Link to={APPLY_URL} style={{
            display: 'block', background: '#E8722A', color: '#fff', padding: 14, borderRadius: 8,
            fontWeight: 700, fontSize: '0.95rem', letterSpacing: 0.3,
          }}>Apply for Performance Lab — Limited Spots</Link>
        </div>
      </div>
    </>
  );
}
