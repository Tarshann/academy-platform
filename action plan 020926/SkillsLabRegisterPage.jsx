import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Skills Lab Registration Page
 * Route: /skills-lab/register
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │  GUARDRAIL: This is a LIGHTWEIGHT registration form.    │
 * │                                                         │
 * │  • No premium language                                  │
 * │  • No Performance Lab mentions                                      │
 * │  • No "training goals" or "preferred days" fields       │
 * │  • Minimum viable: who, when, waiver acknowledgment     │
 * │  • This is NOT an "application" — it's a registration   │
 * └─────────────────────────────────────────────────────────┘
 */

const SESSIONS = [
  { label: 'Tuesday 6:00–7:00 PM (Indoor Gym)', value: 'tuesday' },
  { label: 'Thursday 6:00–7:00 PM (Indoor Gym)', value: 'thursday' },
];

export default function SkillsLabRegisterPage() {
  const [form, setForm] = useState({
    parentName: '', parentPhone: '', parentEmail: '',
    athleteName: '', athleteAge: '', sessions: [],
    waiverAcknowledged: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toggleSession = (value) => {
    const current = form.sessions;
    setForm({
      ...form,
      sessions: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.waiverAcknowledged) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/skills-lab-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sessions: form.sessions.join(', '),
          submittedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Submit failed');
      setSubmitted(true);
    } catch {
      // Fallback: email
      const body = encodeURIComponent(
        `Skills Lab Registration\n\nParent: ${form.parentName}\nPhone: ${form.parentPhone}\n` +
        `Email: ${form.parentEmail}\nAthlete: ${form.athleteName}\nAge: ${form.athleteAge}\n` +
        `Sessions: ${form.sessions.join(', ')}`
      );
      window.location.href = `mailto:theacademytn@gmail.com?subject=Skills%20Lab%20Registration%20-%20${encodeURIComponent(form.athleteName)}&body=${body}`;
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Confirmation ──
  if (submitted) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
          .sl-reg * { box-sizing: border-box; margin: 0; padding: 0; }
          .sl-reg { font-family: 'DM Sans', sans-serif; }
        `}</style>
        <div className="sl-reg" style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F7FAF8', padding: '2rem',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '3rem', maxWidth: 480,
            width: '100%', textAlign: 'center', border: '1px solid #E0E8E2',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem',
              color: '#1B2A4A', letterSpacing: 1, marginBottom: '1rem',
            }}>YOU'RE REGISTERED</h1>
            <p style={{ fontSize: '1rem', color: '#666', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              <strong style={{ color: '#1B2A4A' }}>{form.athleteName}</strong> is registered for this week's Skills Lab session. Just show up on time with athletic shoes and a water bottle.
            </p>
            <div style={{
              background: '#F0F7F2', borderRadius: 10, padding: '1rem', marginBottom: '2rem',
              fontSize: '0.9rem', color: '#555',
            }}>
              Questions? Text Coach Mac at{' '}
              <a href="tel:5712920833" style={{ color: '#4AA460', fontWeight: 700 }}>(571) 292-0833</a>
            </div>
            <Link to="/skills-lab" style={{
              color: '#1B2A4A', fontWeight: 600, fontSize: '0.9rem',
              borderBottom: '2px solid #4AA460', paddingBottom: 2,
            }}>← Back to Skills Lab</Link>
          </div>
        </div>
      </>
    );
  }

  // ── Form ──
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        .sl-reg * { box-sizing: border-box; margin: 0; padding: 0; }
        .sl-reg { font-family: 'DM Sans', sans-serif; color: #2A2A2A; }
        .sl-reg input, .sl-reg select {
          width: 100%; padding: 12px 16px; border: 1px solid #E0E8E2; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 0.95rem; color: #333;
          transition: border-color 0.2s; background: #fff;
        }
        .sl-reg input:focus, .sl-reg select:focus {
          outline: none; border-color: #4AA460; box-shadow: 0 0 0 3px rgba(74,164,96,0.1);
        }
        .sl-reg label { display: block; font-weight: 600; font-size: 0.85rem; color: #1B2A4A; margin-bottom: 6px; }
        .sl-field { margin-bottom: 1.25rem; }
        .sl-chip {
          display: inline-block; padding: 10px 18px; border-radius: 100px; font-size: 0.85rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s; margin: 4px; border: 1px solid #E0E8E2;
          background: #F7FAF8; color: #666; user-select: none;
        }
        .sl-chip.active { background: #F0F7F2; border-color: #4AA460; color: #4AA460; font-weight: 600; }
        .sl-chip:hover { border-color: #4AA460; }
      `}</style>

      <div className="sl-reg" style={{ minHeight: '100vh', background: '#F7FAF8', padding: '2rem' }}>
        <div style={{
          maxWidth: 500, margin: '0 auto 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Link to="/skills-lab" style={{ color: '#1B2A4A', fontWeight: 600, fontSize: '0.9rem' }}>← Back</Link>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', color: '#1B2A4A', letterSpacing: 2,
          }}>THE ACADEMY</span>
        </div>

        <div style={{
          maxWidth: 500, margin: '0 auto', background: '#fff', borderRadius: 16,
          padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E0E8E2',
        }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', color: '#1B2A4A',
            letterSpacing: 1, marginBottom: '0.5rem',
          }}>SKILLS LAB <span style={{ color: '#4AA460' }}>REGISTRATION</span></h1>
          <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '2rem' }}>
            Register your athlete for this week's session. $10 per session at the door.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="sl-field">
              <label>Parent Name *</label>
              <input type="text" required value={form.parentName} onChange={set('parentName')} placeholder="Your full name" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="sl-field">
                <label>Phone *</label>
                <input type="tel" required value={form.parentPhone} onChange={set('parentPhone')} placeholder="(555) 555-5555" />
              </div>
              <div className="sl-field">
                <label>Email *</label>
                <input type="email" required value={form.parentEmail} onChange={set('parentEmail')} placeholder="you@email.com" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="sl-field">
                <label>Athlete Name *</label>
                <input type="text" required value={form.athleteName} onChange={set('athleteName')} placeholder="Child's name" />
              </div>
              <div className="sl-field">
                <label>Age *</label>
                <select required value={form.athleteAge} onChange={set('athleteAge')}>
                  <option value="">Select...</option>
                  {Array.from({ length: 11 }, (_, i) => i + 6).map((age) => (
                    <option key={age}>{age}</option>
                  ))}
                  <option>16+</option>
                </select>
              </div>
            </div>

            <div className="sl-field">
              <label>Which session(s)? *</label>
              <div>
                {SESSIONS.map((s) => (
                  <span
                    key={s.value}
                    className={`sl-chip ${form.sessions.includes(s.value) ? 'active' : ''}`}
                    onClick={() => toggleSession(s.value)}
                  >{s.label}</span>
                ))}
              </div>
            </div>

            <div className="sl-field" style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.5rem',
            }}>
              <input
                type="checkbox"
                id="waiver"
                checked={form.waiverAcknowledged}
                onChange={(e) => setForm({ ...form, waiverAcknowledged: e.target.checked })}
                style={{ width: 'auto', marginTop: 4, accentColor: '#4AA460' }}
              />
              <label htmlFor="waiver" style={{ fontWeight: 400, fontSize: '0.85rem', color: '#666', cursor: 'pointer' }}>
                I acknowledge that my child participates at their own risk and I agree to The Academy's liability waiver and photo/video release policy.
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !form.waiverAcknowledged || form.sessions.length === 0}
              style={{
                width: '100%', padding: '14px', background: '#4AA460', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem',
                cursor: (submitting || !form.waiverAcknowledged || form.sessions.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (submitting || !form.waiverAcknowledged || form.sessions.length === 0) ? 0.5 : 1,
                transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(74,164,96,0.3)',
                fontFamily: "'DM Sans', sans-serif", marginTop: '0.5rem',
              }}
            >
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
