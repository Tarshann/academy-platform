import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Performance Lab Application Form Page
 * Route: /performance-lab/apply
 * 
 * This is a standalone form page that collects application info
 * and submits to your tRPC backend or Resend email endpoint.
 * 
 * Integration options:
 *   A) tRPC mutation: wire handleSubmit to your tRPC router
 *   B) Resend API: POST to your /api/performance-lab-apply endpoint
 *   C) Simple mailto fallback (current implementation)
 * 
 * Swap the submit handler once your backend endpoint is ready.
 */

const SPORTS_OPTIONS = [
  'Basketball', 'Football', 'Flag Football', 'Soccer',
  'Baseball/Softball', 'Track & Field', 'Other',
];

const HEAR_OPTIONS = [
  'Current Academy family', 'Friend / word of mouth', 'Facebook / Instagram',
  'TikTok', 'School / rec league', 'Google search', 'Other',
];

const DAYS_OPTIONS = [
  { label: 'Mon/Tue', value: 'mon-tue' },
  { label: 'Wed/Thu', value: 'wed-thu' },
  { label: 'Sunday makeup', value: 'sunday' },
];

export default function PerformanceLabApplyPage() {
  const [form, setForm] = useState({
    parentName: '', parentPhone: '', parentEmail: '',
    athleteName: '', athleteAge: '', currentSports: [],
    trainingGoals: '', preferredDays: [], injuries: '', hearAbout: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toggleMulti = (field, value) => {
    const current = form[field];
    setForm({
      ...form,
      [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // ──────────────────────────────────────────────────
    // SWAP THIS with your actual tRPC mutation or API call:
    //
    // Option A (tRPC):
    //   await trpc.adm.submitApplication.mutate(form);
    //
    // Option B (API route):
    //   await fetch('/api/performance-lab-apply', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(form),
    //   });
    //
    // Option C (Resend via API route):
    //   POST to your Resend-powered endpoint that emails
    //   Coach Mac at theacademytn@gmail.com
    // ──────────────────────────────────────────────────

    try {
      // Temporary: send via API endpoint
      // Replace this URL with your actual endpoint
      const res = await fetch('/api/performance-lab-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          currentSports: form.currentSports.join(', '),
          preferredDays: form.preferredDays.join(', '),
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Submit failed');
      setSubmitted(true);
    } catch {
      // Fallback: open email client
      const body = encodeURIComponent(
        `Parent: ${form.parentName}\nPhone: ${form.parentPhone}\nEmail: ${form.parentEmail}\n` +
        `Athlete: ${form.athleteName}\nAge/Grade: ${form.athleteAge}\n` +
        `Sports: ${form.currentSports.join(', ')}\nGoals: ${form.trainingGoals}\n` +
        `Preferred Days: ${form.preferredDays.join(', ')}\nInjuries: ${form.injuries || 'None'}\n` +
        `Heard About Us: ${form.hearAbout}`
      );
      window.location.href = `mailto:theacademytn@gmail.com?subject=ADM%20Application%20-%20${encodeURIComponent(form.athleteName)}&body=${body}`;
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Thank You State ──
  if (submitted) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
          .adm-apply * { box-sizing: border-box; margin: 0; padding: 0; }
          .adm-apply { font-family: 'DM Sans', sans-serif; }
        `}</style>
        <div className="adm-apply" style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(165deg, #0F1A2E 0%, #1B2A4A 60%, #243B5E 100%)',
          padding: '2rem',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '3rem', maxWidth: 520,
            width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem',
              color: '#1B2A4A', letterSpacing: 1, marginBottom: '1rem',
            }}>APPLICATION RECEIVED</h1>
            <p style={{ fontSize: '1.05rem', color: '#666', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Coach Mac will follow up within <strong style={{ color: '#1B2A4A' }}>24 hours</strong> to confirm fit and placement.
              You'll have a quick 5–10 minute call to answer questions and lock in a start date.
            </p>
            <div style={{
              background: '#FFF3E8', borderRadius: 10, padding: '1.25rem', marginBottom: '2rem',
            }}>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Need to reach us sooner? Text Coach Mac directly:
              </p>
              <a href="tel:5712920833" style={{
                display: 'inline-block', marginTop: '0.5rem', fontWeight: 700,
                color: '#E8722A', fontSize: '1.1rem',
              }}>(571) 292-0833</a>
            </div>
            <Link to="/performance-lab" style={{
              display: 'inline-block', color: '#1B2A4A', fontWeight: 600,
              fontSize: '0.9rem', borderBottom: '2px solid #E8722A', paddingBottom: 2,
            }}>← Back to Performance Lab Info</Link>
          </div>
        </div>
      </>
    );
  }

  // ── Form State ──
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        .adm-apply * { box-sizing: border-box; margin: 0; padding: 0; }
        .adm-apply { font-family: 'DM Sans', sans-serif; color: #2A2A2A; }
        .adm-apply input, .adm-apply select, .adm-apply textarea {
          width: 100%; padding: 12px 16px; border: 1px solid #E8E8E8; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 0.95rem; color: #333;
          transition: border-color 0.2s; background: #fff;
        }
        .adm-apply input:focus, .adm-apply select:focus, .adm-apply textarea:focus {
          outline: none; border-color: #E8722A; box-shadow: 0 0 0 3px rgba(232,114,42,0.1);
        }
        .adm-apply textarea { resize: vertical; min-height: 80px; }
        .adm-apply label { display: block; font-weight: 600; font-size: 0.85rem; color: #1B2A4A; margin-bottom: 6px; }
        .field { margin-bottom: 1.25rem; }
        .chip {
          display: inline-block; padding: 8px 16px; border-radius: 100px; font-size: 0.85rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s; margin: 4px; border: 1px solid #E8E8E8;
          background: #F5F5F5; color: #666; user-select: none;
        }
        .chip.active { background: #FFF3E8; border-color: #E8722A; color: #E8722A; font-weight: 600; }
        .chip:hover { border-color: #E8722A; }
      `}</style>

      <div className="adm-apply" style={{
        minHeight: '100vh', background: '#FAF8F5', padding: '2rem',
      }}>
        {/* Top bar */}
        <div style={{
          maxWidth: 600, margin: '0 auto 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Link to="/performance-lab" style={{ color: '#1B2A4A', fontWeight: 600, fontSize: '0.9rem' }}>← Back to Performance Lab</Link>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', color: '#1B2A4A', letterSpacing: 2,
          }}>THE ACADEMY</span>
        </div>

        {/* Form card */}
        <div style={{
          maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 16,
          padding: '2.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          border: '1px solid #E8E8E8',
        }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#1B2A4A',
            letterSpacing: 1, marginBottom: '0.5rem',
          }}>ADM APPLICATION</h1>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '2rem', lineHeight: 1.6 }}>
            Fill this out and Coach Mac will call within 24 hours to discuss fit, answer questions, and get your athlete placed.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Parent Info */}
            <div style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
              color: '#E8722A', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E8E8E8',
            }}>Parent Info</div>

            <div className="field">
              <label>Parent Name *</label>
              <input type="text" required value={form.parentName} onChange={set('parentName')} placeholder="Your full name" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="field">
                <label>Phone *</label>
                <input type="tel" required value={form.parentPhone} onChange={set('parentPhone')} placeholder="(555) 555-5555" />
              </div>
              <div className="field">
                <label>Email *</label>
                <input type="email" required value={form.parentEmail} onChange={set('parentEmail')} placeholder="you@email.com" />
              </div>
            </div>

            {/* Athlete Info */}
            <div style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
              color: '#E8722A', marginBottom: '1rem', marginTop: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E8E8E8',
            }}>Athlete Info</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="field">
                <label>Athlete Name *</label>
                <input type="text" required value={form.athleteName} onChange={set('athleteName')} placeholder="Child's name" />
              </div>
              <div className="field">
                <label>Age / Grade *</label>
                <select required value={form.athleteAge} onChange={set('athleteAge')}>
                  <option value="">Select...</option>
                  <option>8 / 3rd Grade</option>
                  <option>9 / 4th Grade</option>
                  <option>10 / 5th Grade</option>
                  <option>11 / 6th Grade</option>
                  <option>12 / 7th Grade</option>
                  <option>13 / 8th Grade</option>
                  <option>14 / 9th Grade</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Current Sports (select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                {SPORTS_OPTIONS.map((sport) => (
                  <span
                    key={sport}
                    className={`chip ${form.currentSports.includes(sport) ? 'active' : ''}`}
                    onClick={() => toggleMulti('currentSports', sport)}
                  >{sport}</span>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Training Goals</label>
              <textarea
                value={form.trainingGoals}
                onChange={set('trainingGoals')}
                placeholder="What do you want your child to get out of this program?"
              />
            </div>

            <div className="field">
              <label>Preferred Training Days</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                {DAYS_OPTIONS.map((day) => (
                  <span
                    key={day.value}
                    className={`chip ${form.preferredDays.includes(day.value) ? 'active' : ''}`}
                    onClick={() => toggleMulti('preferredDays', day.value)}
                  >{day.label}</span>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Any injuries or limitations?</label>
              <input type="text" value={form.injuries} onChange={set('injuries')} placeholder="None, or describe briefly" />
            </div>

            <div className="field">
              <label>How did you hear about The Academy? *</label>
              <select required value={form.hearAbout} onChange={set('hearAbout')}>
                <option value="">Select...</option>
                {HEAR_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '16px', background: '#E8722A', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1rem',
                cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1,
                transition: 'all 0.3s', boxShadow: '0 4px 24px rgba(232,114,42,0.3)',
                fontFamily: "'DM Sans', sans-serif", marginTop: '0.5rem',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>

            <p style={{ fontSize: '0.8rem', color: '#999', textAlign: 'center', marginTop: '1rem' }}>
              Coach Mac will call within 24 hours to discuss placement.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
