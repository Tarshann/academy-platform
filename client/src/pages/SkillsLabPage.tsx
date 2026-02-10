import { useEffect } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const BLUE = "#2563EB";
const DARK = "#1A1A1A";

export default function SkillsLabPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
    <Navigation />
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: DARK, background: "#FAFAFA" }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${DARK} 0%, #2D2D2D 100%)`,
        color: "#fff",
        padding: "80px 20px 60px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 14,
            letterSpacing: 3,
            color: BLUE,
            marginBottom: 12,
            textTransform: "uppercase",
          }}>
            Community Drop-In Sessions
          </p>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(40px, 8vw, 72px)",
            lineHeight: 1,
            margin: "0 0 20px",
          }}>
            Academy Skills Lab
          </h1>
          <p style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: "#ccc",
            maxWidth: 600,
            margin: "0 auto 32px",
          }}>
            Fundamentals, movement, and positive competition. Open to all ages.
            No membership required. Just show up and play.
          </p>
          <Link href="/skills-lab/register">
            <span style={{
              display: "inline-block",
              background: BLUE,
              color: "#fff",
              padding: "16px 40px",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "none",
            }}>
              Register for a Session
            </span>
          </Link>
        </div>
      </div>

      {/* What Is Skills Lab */}
      <section style={{ padding: "64px 20px", maxWidth: 800, margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 36,
          textAlign: "center",
          marginBottom: 16,
        }}>
          What Is the Skills Lab?
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.7, textAlign: "center", color: "#444", maxWidth: 650, margin: "0 auto 16px" }}>
          The Academy Skills Lab is a community drop-in session focused on fundamentals,
          movement, and positive competition. It is open to all ages and designed to be
          a fun, active environment where young athletes can move, compete, and build
          confidence.
        </p>
        <p style={{
          fontSize: 15,
          lineHeight: 1.7,
          textAlign: "center",
          color: "#777",
          fontStyle: "italic",
          maxWidth: 600,
          margin: "0 auto",
        }}>
          Skills Lab is not a long-term training program or membership. It is a
          pay-per-session experience for families who want their kids active and
          having fun.
        </p>
      </section>

      {/* Schedule + Pricing */}
      <section style={{ background: "#fff", padding: "64px 20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 36,
            marginBottom: 32,
          }}>
            Schedule & Pricing
          </h2>
          <div style={{
            display: "grid",
            gap: 16,
            marginBottom: 24,
          }}>
            {[
              { day: "Tuesday", time: "6:00 - 6:50 PM" },
              { day: "Thursday", time: "6:00 - 6:50 PM" },
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                background: "#F9F9F9",
                borderRadius: 8,
                borderLeft: `4px solid ${BLUE}`,
              }}>
                <span style={{ fontWeight: 600, fontSize: 16 }}>{s.day}</span>
                <span style={{ fontSize: 16, color: "#555" }}>{s.time}</span>
              </div>
            ))}
          </div>
          <div style={{
            background: "#EFF6FF",
            borderRadius: 12,
            padding: 24,
            display: "inline-block",
          }}>
            <span style={{ fontSize: 40, fontWeight: 800 }}>$10</span>
            <span style={{ fontSize: 16, color: "#555" }}> per session</span>
          </div>
          <p style={{ marginTop: 16, fontSize: 14, color: "#777" }}>
            No membership. No commitment. Pay at the door or register online.
          </p>
        </div>
      </section>

      {/* What to Expect */}
      <section style={{ padding: "64px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 36,
            textAlign: "center",
            marginBottom: 32,
          }}>
            What to Expect
          </h2>
          <div style={{ display: "grid", gap: 20 }}>
            {[
              { num: "1", title: "Movement Prep", desc: "Movement prep to get loose and ready to go." },
              { num: "2", title: "Skill Stations", desc: "Rotating stations focused on fundamentals: dribbling, passing, footwork, coordination." },
              { num: "3", title: "Competitive Games", desc: "Structured games that keep energy high and let athletes compete in a positive environment." },
              { num: "4", title: "Wrap-Up", desc: "Wrap-up and a high note to end on." },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex",
                gap: 20,
                alignItems: "flex-start",
                background: "#fff",
                borderRadius: 12,
                padding: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: BLUE,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                }}>
                  {item.num}
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{item.title}</h3>
                  <p style={{ fontSize: 15, color: "#555", lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is This For */}
      <section style={{ background: "#fff", padding: "64px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 36,
            textAlign: "center",
            marginBottom: 32,
          }}>
            Who Is This For?
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 24,
          }}>
            {[
              "Kids who want to stay active and have fun",
              "Families looking for a flexible, no-commitment option",
              "Athletes of all ages who enjoy positive competition",
              "Kids trying organized sports for the first time",
              "Anyone who wants to move, play, and compete",
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}>
                <span style={{ color: BLUE, fontWeight: 700, fontSize: 18, flexShrink: 0 }}>+</span>
                <p style={{ fontSize: 15, lineHeight: 1.5, color: "#444", margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: `linear-gradient(135deg, ${DARK} 0%, #2D2D2D 100%)`,
        color: "#fff",
        padding: "64px 20px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 36,
            marginBottom: 16,
          }}>
            Come Play
          </h2>
          <p style={{ fontSize: 17, color: "#ccc", marginBottom: 32 }}>
            No tryouts. No commitments. Just show up and see what The Academy is all about.
          </p>
          <Link href="/skills-lab/register">
            <span style={{
              display: "inline-block",
              background: BLUE,
              color: "#fff",
              padding: "16px 40px",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "none",
            }}>
              Register for a Session
            </span>
          </Link>
        </div>
      </section>

      {/* Performance Lab Signpost - exactly one mention */}
      <section style={{ padding: "40px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#999", maxWidth: 500, margin: "0 auto" }}>
          Families looking for year-round, structured weekly training can learn about the{" "}
          <Link href="/performance-lab">
            <span style={{ color: "#E8722A", fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
              Academy Performance Lab
            </span>
          </Link>
          .
        </p>
      </section>
    </div>
    <Footer />
    </>
  );
}
