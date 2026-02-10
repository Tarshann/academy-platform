import { useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const BLUE = "#2563EB";
const DARK = "#1A1A1A";

const SESSION_OPTIONS = [
  "Tuesday 6:00-6:50 PM",
  "Thursday 6:00-6:50 PM",
];

interface FormData {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  athleteName: string;
  athleteAge: string;
  selectedSessions: string[];
}

const initialForm: FormData = {
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  athleteName: "",
  athleteAge: "",
  selectedSessions: [],
};

export default function SkillsLabRegisterPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleSession = (session: string) => {
    setForm(prev => ({
      ...prev,
      selectedSessions: prev.selectedSessions.includes(session)
        ? prev.selectedSessions.filter(s => s !== session)
        : [...prev.selectedSessions, session],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.selectedSessions.length === 0) {
      setStatus("error");
      setErrorMessage("Please select at least one session.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/skills-lab-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          selectedSessions: form.selectedSessions.join(", "),
          submittedAt: new Date().toISOString(),
        }),
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
      <>
      <Navigation />
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
            background: "#EFF6FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: 28,
            color: BLUE,
          }}>
            <span aria-hidden="true">&#10003;</span>
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, marginBottom: 12 }}>
            You're Registered!
          </h2>
          <p style={{ fontSize: 16, color: "#555", lineHeight: 1.6, marginBottom: 16 }}>
            We've got {form.athleteName} down for Skills Lab. Just show up at the
            Academy Performance Center at your selected session time.
          </p>
          <p style={{ fontSize: 15, color: "#555", marginBottom: 8 }}>
            <strong>Sessions:</strong> {form.selectedSessions.join(", ")}
          </p>
          <p style={{ fontSize: 15, color: "#555", marginBottom: 24 }}>
            <strong>Cost:</strong> $10 per session
          </p>
          <p style={{ fontSize: 14, color: "#777", marginBottom: 32 }}>
            A confirmation has been sent to <strong>{form.parentEmail}</strong>.
          </p>
          <Link href="/skills-lab">
            <span style={{
              display: "inline-block",
              color: BLUE,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
            }}>
              &larr; Back to Skills Lab
            </span>
          </Link>
        </div>
      </div>
      <Footer />
      </>
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
    <>
    <Navigation />
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
          color: BLUE,
          marginBottom: 8,
          textTransform: "uppercase",
        }}>
          Skills Lab
        </p>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(32px, 6vw, 48px)",
          lineHeight: 1,
          margin: 0,
        }}>
          Register for a Session
        </h1>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px 64px" }}>
        <Link href="/skills-lab">
          <span style={{
            display: "inline-block",
            color: BLUE,
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 24,
            cursor: "pointer",
            textDecoration: "none",
          }}>
            &larr; Back to Skills Lab
          </span>
        </Link>

        <form onSubmit={handleSubmit} style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Select Your Sessions</h2>
          <p style={{ fontSize: 14, color: "#777", marginBottom: 20 }}>Choose one or both sessions. $10 per session.</p>

          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            {SESSION_OPTIONS.map(session => {
              const selected = form.selectedSessions.includes(session);
              return (
                <button
                  type="button"
                  key={session}
                  onClick={() => toggleSession(session)}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 8,
                    border: `2px solid ${selected ? BLUE : "#D1D5DB"}`,
                    background: selected ? "#EFF6FF" : "#fff",
                    color: selected ? BLUE : "#555",
                    fontWeight: selected ? 700 : 500,
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  {session}
                </button>
              );
            })}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "0 0 24px" }} />

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Parent / Guardian</h2>
          <p style={{ fontSize: 14, color: "#777", marginBottom: 20 }}>Contact information for session updates.</p>

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

          <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "28px 0 24px" }} />

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Athlete</h2>
          <p style={{ fontSize: 14, color: "#777", marginBottom: 20 }}>Who is coming to play?</p>

          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Athlete Name *</label>
                <input type="text" name="athleteName" value={form.athleteName} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Athlete Age *</label>
                <input type="number" name="athleteAge" value={form.athleteAge} onChange={handleChange} required min="4" max="18" style={inputStyle} />
              </div>
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
              background: status === "submitting" ? "#ccc" : BLUE,
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
            {status === "submitting" ? "Registering..." : "Register for Skills Lab"}
          </button>

          <p style={{ fontSize: 13, color: "#999", textAlign: "center", marginTop: 16 }}>
            Payment of $10 per session is collected at the door. Registration helps us
            plan for the right number of athletes.
          </p>
        </form>
      </div>
    </div>
    <Footer />
    </>
  );
}
