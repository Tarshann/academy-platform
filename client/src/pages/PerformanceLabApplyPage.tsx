import { useState } from "react";
import { Link, useLocation } from "wouter";

const ORANGE = "#E8722A";
const DARK = "#1A1A1A";

interface FormData {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  athleteName: string;
  athleteAge: string;
  currentSports: string;
  trainingGoals: string;
  preferredDays: string;
  injuries: string;
  hearAbout: string;
}

const initialForm: FormData = {
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  athleteName: "",
  athleteAge: "",
  currentSports: "",
  trainingGoals: "",
  preferredDays: "",
  injuries: "",
  hearAbout: "",
};

export default function PerformanceLabApplyPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [, navigate] = useLocation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/performance-lab-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, submittedAt: new Date().toISOString() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "#FAFAFA",
      }}>
        <div style={{
          maxWidth: 500,
          textAlign: "center",
          background: "#fff",
          borderRadius: 16,
          padding: 48,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#ECFDF5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: 28,
          }}>
            <span aria-hidden="true">&#10003;</span>
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, marginBottom: 12 }}>
            Application Received
          </h2>
          <p style={{ fontSize: 16, color: "#555", lineHeight: 1.6, marginBottom: 24 }}>
            Thank you for applying to the Academy Performance Lab. Coach Mac will review
            your application and reach out within 48 hours to discuss next steps and
            schedule your athlete's first session.
          </p>
          <p style={{ fontSize: 14, color: "#777", marginBottom: 32 }}>
            A confirmation has been sent to <strong>{form.parentEmail}</strong>.
          </p>
          <Link href="/performance-lab">
            <span style={{
              display: "inline-block",
              color: ORANGE,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
            }}>
              &larr; Back to Performance Lab
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    fontSize: 15,
    border: "1px solid #D1D5DB",
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: DARK, background: "#FAFAFA" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${DARK} 0%, #2D2D2D 100%)`,
        color: "#fff",
        padding: "48px 20px 40px",
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 14,
          letterSpacing: 3,
          color: ORANGE,
          marginBottom: 8,
          textTransform: "uppercase",
        }}>
          Performance Lab
        </p>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(32px, 6vw, 48px)",
          lineHeight: 1,
          margin: 0,
        }}>
          Apply Now
        </h1>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px 64px" }}>
        <Link href="/performance-lab">
          <span style={{
            display: "inline-block",
            color: ORANGE,
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 24,
            cursor: "pointer",
            textDecoration: "none",
          }}>
            &larr; Back to Performance Lab
          </span>
        </Link>

        <form onSubmit={handleSubmit} style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Parent / Guardian Information</h2>
          <p style={{ fontSize: 14, color: "#777", marginBottom: 24 }}>We will use this to contact you about your application.</p>

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input type="text" name="parentName" value={form.parentName} onChange={handleChange} required style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input type="tel" name="parentPhone" value={form.parentPhone} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required style={inputStyle} />
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "28px 0" }} />

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Athlete Information</h2>
          <p style={{ fontSize: 14, color: "#777", marginBottom: 24 }}>Tell us about your young athlete.</p>

          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Athlete Name *</label>
                <input type="text" name="athleteName" value={form.athleteName} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Athlete Age *</label>
                <select name="athleteAge" value={form.athleteAge} onChange={handleChange} required style={inputStyle}>
                  <option value="">Select age</option>
                  {[8, 9, 10, 11, 12, 13, 14].map(age => (
                    <option key={age} value={String(age)}>{age}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Current Sports</label>
              <input type="text" name="currentSports" value={form.currentSports} onChange={handleChange} placeholder="e.g., Basketball, Soccer, Flag Football" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Training Goals</label>
              <textarea name="trainingGoals" value={form.trainingGoals} onChange={handleChange} rows={3} placeholder="What does your athlete want to improve?" style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={labelStyle}>Preferred Training Days</label>
              <input type="text" name="preferredDays" value={form.preferredDays} onChange={handleChange} placeholder="e.g., All three days, Tue/Thu only" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Any Injuries or Limitations?</label>
              <textarea name="injuries" value={form.injuries} onChange={handleChange} rows={2} placeholder="Anything Coach should know about" style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={labelStyle}>How Did You Hear About Us?</label>
              <select name="hearAbout" value={form.hearAbout} onChange={handleChange} style={inputStyle}>
                <option value="">Select one</option>
                <option value="social_media">Social Media</option>
                <option value="word_of_mouth">Word of Mouth</option>
                <option value="google">Google Search</option>
                <option value="skills_lab">Skills Lab Session</option>
                <option value="community_event">Community Event</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {status === "error" && (
            <div style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 8,
              padding: 16,
              marginTop: 20,
              color: "#991B1B",
              fontSize: 14,
            }}>
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            style={{
              width: "100%",
              padding: 16,
              background: status === "submitting" ? "#ccc" : ORANGE,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: status === "submitting" ? "not-allowed" : "pointer",
              marginTop: 24,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {status === "submitting" ? "Submitting..." : "Submit Application"}
          </button>

          <p style={{ fontSize: 13, color: "#999", textAlign: "center", marginTop: 16 }}>
            By submitting, you agree to be contacted regarding this application.
            No payment is required to apply.
          </p>
        </form>
      </div>
    </div>
  );
}
