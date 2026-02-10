import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const ORANGE = "#E8722A";
const DARK = "#1A1A1A";
const GOLD = "#CFB87C";

export default function PerformanceLabPage() {
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      const footerTop = footerRef.current?.getBoundingClientRect().top ?? Infinity;
      const windowHeight = window.innerHeight;
      setShowStickyCTA(heroBottom < 0 && footerTop > windowHeight + 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
    <Navigation />
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: DARK, background: "#FAFAFA" }}>
      {/* Hero */}
      <div ref={heroRef} style={{
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
            color: ORANGE,
            marginBottom: 12,
            textTransform: "uppercase",
          }}>
            Year-Round Athletic Development
          </p>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(40px, 8vw, 72px)",
            lineHeight: 1,
            margin: "0 0 20px",
          }}>
            Academy Performance Lab
          </h1>
          <p style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: "#ccc",
            maxWidth: 600,
            margin: "0 auto 32px",
          }}>
            Structured, year-round training for serious young athletes ages 8-14.
            Three sessions per week. Small groups. Real development.
          </p>
          <Link href="/performance-lab/apply">
            <span style={{
              display: "inline-block",
              background: ORANGE,
              color: "#fff",
              padding: "16px 40px",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "none",
            }}>
              Apply for Performance Lab
            </span>
          </Link>
        </div>
      </div>

      {/* What Is Performance Lab */}
      <section style={{ padding: "64px 20px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 36,
          textAlign: "center",
          marginBottom: 16,
        }}>
          What Is the Performance Lab?
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.7, textAlign: "center", color: "#444", maxWidth: 700, margin: "0 auto 40px" }}>
          The Academy Performance Lab is a premium membership program designed for athletes
          who are ready to commit to consistent, structured development. This is not a drop-in
          class. It is a year-round training environment where athletes build strength, speed,
          coordination, and competitive confidence across three weekly sessions.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 24,
        }}>
          {[
            { title: "Three Sessions Per Week", desc: "Tuesday and Thursday evenings (7:00-8:00 PM) plus Sunday (11:00 AM-12:00 PM). Consistent structure builds consistent athletes." },
            { title: "Small Group Training", desc: "Capped at 6-8 athletes per group. Every athlete gets coaching attention, every session." },
            { title: "Multi-Sport Approach", desc: "Speed, agility, strength, coordination, and competitive games. We develop athletes, not just sport-specific skills." },
          ].map((item, i) => (
            <div key={i} style={{
              background: "#fff",
              borderRadius: 12,
              padding: 28,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "#555" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Schedule */}
      <section style={{ background: "#fff", padding: "64px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 36,
            marginBottom: 32,
          }}>
            Weekly Schedule
          </h2>
          <div style={{ display: "grid", gap: 16 }}>
            {[
              { day: "Tuesday", time: "7:00 - 8:00 PM" },
              { day: "Thursday", time: "7:00 - 8:00 PM" },
              { day: "Sunday", time: "11:00 AM - 12:00 PM" },
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                background: "#F9F9F9",
                borderRadius: 8,
                borderLeft: `4px solid ${ORANGE}`,
              }}>
                <span style={{ fontWeight: 600, fontSize: 16 }}>{s.day}</span>
                <span style={{ fontSize: 16, color: "#555" }}>{s.time}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16, fontSize: 14, color: "#777" }}>
            Sunday sessions serve as makeup days and open training for Performance Lab members.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section style={{ padding: "64px 20px" }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            border: `2px solid ${ORANGE}`,
          }}>
            <div style={{
              background: ORANGE,
              color: "#fff",
              padding: "24px 28px",
              textAlign: "center",
            }}>
              <h3 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 28,
                margin: 0,
              }}>
                Performance Lab Membership
              </h3>
            </div>
            <div style={{ padding: 32 }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <span style={{ fontSize: 48, fontWeight: 800 }}>$245</span>
                <span style={{ fontSize: 18, color: "#777" }}>/month</span>
              </div>
              <ul style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 24px",
                fontSize: 15,
                lineHeight: 2.2,
              }}>
                {[
                  "Three training sessions per week (Tue/Thu/Sun)",
                  "Small groups capped at 6-8 athletes",
                  "Ages 8-14",
                  "Speed, agility, strength, and competitive games",
                  "Sunday makeup / open session access",
                  "Leadership opportunities for older athletes (ages 13-14, by invitation)",
                  "Sibling discount: $230/month ($50 off)",
                  "Referral discount: $230 first month ($50 off)",
                ].map((item, i) => (
                  <li key={i} style={{ paddingLeft: 24, position: "relative" }}>
                    <span style={{
                      position: "absolute",
                      left: 0,
                      color: ORANGE,
                      fontWeight: 700,
                    }}>
                      +
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/performance-lab/apply">
                <span style={{
                  display: "block",
                  background: ORANGE,
                  color: "#fff",
                  padding: "14px",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 700,
                  textAlign: "center",
                  cursor: "pointer",
                  textDecoration: "none",
                }}>
                  Apply for Performance Lab
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is This For */}
      <section style={{ background: "#fff", padding: "64px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
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
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
          }}>
            <div style={{
              background: "#F0FAF0",
              borderRadius: 12,
              padding: 28,
              borderLeft: `4px solid #22C55E`,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#166534" }}>
                Great Fit
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.8, color: "#444" }}>
                <li>Athletes ages 8-14 who want to compete at a higher level</li>
                <li>Families ready to commit to a consistent weekly schedule</li>
                <li>Kids who love sports and want structured development</li>
                <li>Athletes looking for multi-sport training, not just one sport</li>
              </ul>
            </div>
            <div style={{
              background: "#FFF7ED",
              borderRadius: 12,
              padding: 28,
              borderLeft: `4px solid ${ORANGE}`,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#9A3412" }}>
                Might Not Be Right Yet
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.8, color: "#444" }}>
                <li>Looking for a once-a-week drop-in class</li>
                <li>Not ready to commit to a monthly membership</li>
                <li>Wants sport-specific coaching only (single sport focus)</li>
                <li>Outside the 8-14 age range</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "64px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 36,
            textAlign: "center",
            marginBottom: 32,
          }}>
            Frequently Asked Questions
          </h2>
          {[
            {
              q: "How many sessions per week?",
              a: "Three sessions per week: Tuesday and Thursday evenings (7:00-8:00 PM) and Sunday (11:00 AM-12:00 PM).",
            },
            {
              q: "What ages are accepted?",
              a: "Performance Lab is designed for athletes ages 8-14. Athletes are grouped by age and ability within that range.",
            },
            {
              q: "How big are the groups?",
              a: "Each group is capped at 6-8 athletes, ensuring every athlete gets real coaching attention in every session.",
            },
            {
              q: "What sports do you train?",
              a: "We take a multi-sport approach: speed, agility, quickness, strength, coordination, and competitive games. We build complete athletes, not just sport-specific skills.",
            },
            {
              q: "Is there a contract?",
              a: "Performance Lab is a monthly membership at $245/month. There is no long-term contract, but this program is designed for athletes who are committed to consistent, year-round training.",
            },
            {
              q: "What about siblings?",
              a: "Sibling athletes receive a $50 discount ($230/month per sibling). Each athlete must be between ages 8-14.",
            },
            {
              q: "What is the Leadership Demo Program?",
              a: "Selected Performance Lab athletes ages 13-14 are invited to help coach younger athletes during community sessions. It develops leadership skills, builds confidence, and reinforces what they have learned. Participation is by invitation and rotates among 3-4 athletes.",
            },
            {
              q: "What if my athlete misses a session?",
              a: "Sunday sessions double as makeup days. If an athlete misses a Tuesday or Thursday session, they can make it up on Sunday.",
            },
          ].map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section ref={footerRef} style={{
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
            Ready to Start?
          </h2>
          <p style={{ fontSize: 17, color: "#ccc", marginBottom: 32 }}>
            Spots are limited. Apply now to reserve your athlete's place in the next Performance Lab cohort.
          </p>
          <Link href="/performance-lab/apply">
            <span style={{
              display: "inline-block",
              background: ORANGE,
              color: "#fff",
              padding: "16px 40px",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "none",
            }}>
              Apply for Performance Lab
            </span>
          </Link>
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      {showStickyCTA && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: "1px solid #eee",
          padding: "12px 20px",
          zIndex: 999,
          display: "flex",
          justifyContent: "center",
        }}
          className="md:hidden"
        >
          <Link href="/performance-lab/apply">
            <span style={{
              display: "block",
              background: ORANGE,
              color: "#fff",
              padding: "14px 32px",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              textAlign: "center",
              cursor: "pointer",
              textDecoration: "none",
              width: "100%",
              maxWidth: 360,
            }}>
              Apply for Performance Lab
            </span>
          </Link>
        </div>
      )}
    </div>
    <Footer />
    </>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: "1px solid #E5E7EB",
      padding: "20px 0",
    }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 0,
          fontSize: 16,
          fontWeight: 600,
          color: DARK,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {question}
        <span style={{
          fontSize: 20,
          fontWeight: 300,
          transform: open ? "rotate(45deg)" : "none",
          transition: "transform 0.2s",
          marginLeft: 16,
          flexShrink: 0,
        }}>+</span>
      </button>
      {open && (
        <p style={{
          marginTop: 12,
          fontSize: 15,
          lineHeight: 1.6,
          color: "#555",
        }}>
          {answer}
        </p>
      )}
    </div>
  );
}
