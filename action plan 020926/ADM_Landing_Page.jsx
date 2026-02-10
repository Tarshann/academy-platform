import { useState, useEffect, useRef } from "react";

const SPOTS_TOTAL = 28;
const SPOTS_TAKEN = 3; // Update this as enrollment grows

const schools = [
  "Sumner Academy",
  "Shafer Middle School",
  "Rucker Middle School",
  "Gallatin High School",
  "Liberty Creek Middle School",
  "Station Camp",
  "Stratford High School",
];

const faqs = [
  {
    q: "Is this just basketball training?",
    a: "Basketball is our primary sport vehicle, but we're building athletes first. Your child gets strength, speed, agility, and coordination training that transfers to every sport they play. Soccer players, football players, multi-sport kids — they all benefit equally.",
  },
  {
    q: "My kid already does basketball training. Why would I switch?",
    a: "Most basketball programs only work on basketball skills. They skip the athletic foundation — the strength, speed, and agility work that actually makes skill development stick. We combine both, so your child progresses faster and is less likely to get injured.",
  },
  {
    q: "$280/month seems expensive. Can we just do one session a week?",
    a: "Most families are spending $340–$440/month across 2–3 separate programs already. Our membership replaces all of that with a better system for less money. We don't offer single-session options because consistency is the product — three sessions per week is the effective dose for real development.",
  },
  {
    q: "What if my child plays a different sport in-season?",
    a: "That's exactly who this is for. Our seasonal programming adjusts automatically. During their sport's season, we focus on movement quality, durability, and injury prevention. During the off-season, we build the strength and explosiveness that gives them an edge.",
  },
  {
    q: "What if we need to miss a week?",
    a: "Sunday is built into the schedule as a makeup/open session day. Life happens — we've designed for it.",
  },
  {
    q: "What ages is this for?",
    a: "Performance Lab is designed for athletes ages 8–14. Groups are organized by age and ability level, with sessions capped at 6–8 athletes to maintain coaching quality.",
  },
];

const includedItems = [
  {
    icon: "⚡",
    title: "Weekly Performance Training",
    desc: "Strength, speed, agility, coordination, and injury prevention at the Academy Performance Center or Outdoor Field.",
    freq: "1x per week",
  },
  {
    icon: "🏀",
    title: "Weekly Basketball Skill Session",
    desc: "Shooting, ball handling, decision-making, and live reps at our indoor gym facilities.",
    freq: "1x per week",
  },
  {
    icon: "📅",
    title: "Seasonal Programming",
    desc: "Training shifts with your child's sport calendar — off-season strength, pre-season explosiveness, in-season durability.",
    freq: "Year-round",
  },
  {
    icon: "🏠",
    title: "At-Home Development Plan",
    desc: "Simple 15–20 minute daily plan. No equipment required. Reinforces what happens in sessions.",
    freq: "Monthly",
  },
  {
    icon: "📊",
    title: "Parent Progress Updates",
    desc: "Clear schedule, expectations, and monthly notes on your child's development. No guessing.",
    freq: "Monthly",
  },
];

function FAQItem({ q, a, isOpen, onClick }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(27,42,74,0.1)",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 0",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "17px",
            fontWeight: 600,
            color: "#1B2A4A",
            paddingRight: "16px",
          }}
        >
          {q}
        </span>
        <span
          style={{
            fontSize: "22px",
            color: "#E8722A",
            fontWeight: 300,
            transition: "transform 0.3s ease",
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        >
          +
        </span>
      </div>
      <div
        style={{
          height: `${height}px`,
          overflow: "hidden",
          transition: "height 0.3s ease",
        }}
      >
        <div ref={contentRef} style={{ paddingBottom: "20px" }}>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "15px",
              lineHeight: 1.7,
              color: "#555",
              margin: 0,
            }}
          >
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

function SpotsCounter({ taken, total }) {
  const remaining = total - taken;
  const pct = (taken / total) * 100;
  return (
    <div
      style={{
        background: "rgba(232,114,42,0.08)",
        border: "1px solid rgba(232,114,42,0.2)",
        borderRadius: "12px",
        padding: "16px 24px",
        display: "inline-flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div style={{ flex: 1, minWidth: "120px" }}>
        <div
          style={{
            height: "6px",
            background: "rgba(232,114,42,0.15)",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "#E8722A",
              borderRadius: "3px",
              transition: "width 1s ease",
            }}
          />
        </div>
      </div>
      <span
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          color: "#E8722A",
          whiteSpace: "nowrap",
        }}
      >
        {remaining} of {total} spots remaining
      </span>
    </div>
  );
}

export default function ADMLandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    athleteName: "",
    athleteGrade: "",
    currentSports: [],
    trainingGoals: "",
    injuries: "no",
    injuryNotes: "",
    referralSource: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const sportsOptions = [
    "Basketball",
    "Football",
    "Flag Football",
    "Soccer",
    "Baseball/Softball",
    "Track & Field",
    "Other",
  ];

  const handleSportToggle = (sport) => {
    setFormData((prev) => ({
      ...prev,
      currentSports: prev.currentSports.includes(sport)
        ? prev.currentSports.filter((s) => s !== sport)
        : [...prev.currentSports, sport],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  const scrollToForm = () => {
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("apply-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sectionStyle = {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "0 24px",
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#FAFAF8",
        color: "#1B2A4A",
        minHeight: "100vh",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display&display=swap"
        rel="stylesheet"
      />

      {/* NAV */}
      <nav
        style={{
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "2px",
            color: "#1B2A4A",
            textTransform: "uppercase",
          }}
        >
          The Academy
        </span>
        <span
          style={{
            fontSize: "12px",
            color: "#999",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Gallatin, TN
        </span>
      </nav>

      {/* HERO */}
      <section style={{ ...sectionStyle, paddingTop: "60px", paddingBottom: "60px" }}>
        <p
          style={{
            fontSize: "12px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#E8722A",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          Academy Performance Lab
        </p>
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "clamp(36px, 6vw, 56px)",
            lineHeight: 1.1,
            fontWeight: 400,
            color: "#1B2A4A",
            marginBottom: "24px",
            maxWidth: "600px",
          }}
        >
          Build Complete Athletes.{" "}
          <span style={{ color: "#E8722A" }}>Not Just Better Players.</span>
        </h1>
        <p
          style={{
            fontSize: "18px",
            lineHeight: 1.6,
            color: "#555",
            maxWidth: "560px",
            marginBottom: "32px",
          }}
        >
          Year-round strength, speed, skill, and confidence training — all in one
          program, with one schedule, and one monthly membership. So parents don't
          have to juggle three different programs to get results.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "32px" }}>
          <button
            onClick={scrollToForm}
            style={{
              background: "#E8722A",
              color: "#fff",
              border: "none",
              padding: "14px 32px",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#d4631f")}
            onMouseOut={(e) => (e.target.style.background = "#E8722A")}
          >
            Apply for Performance Lab
          </button>
          <SpotsCounter taken={SPOTS_TAKEN} total={SPOTS_TOTAL} />
        </div>

        <p style={{ fontSize: "13px", color: "#999" }}>
          Ages 8–14 · Gallatin & Sumner County · Groups capped at 6–8 athletes
        </p>
      </section>

      {/* DIVIDER */}
      <div style={{ ...sectionStyle }}>
        <div style={{ height: "1px", background: "rgba(27,42,74,0.08)" }} />
      </div>

      {/* THE PROBLEM */}
      <section style={{ ...sectionStyle, paddingTop: "56px", paddingBottom: "56px" }}>
        <p
          style={{
            fontSize: "12px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#999",
            fontWeight: 500,
            marginBottom: "16px",
          }}
        >
          The Problem
        </p>
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "28px",
            color: "#1B2A4A",
            marginBottom: "16px",
            fontWeight: 400,
          }}
        >
          Most families are paying for random training.
        </h2>
        <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#555", marginBottom: "16px" }}>
          Basketball training twice a week. A speed clinic across town. An occasional
          private lesson. A summer camp. You're driving everywhere, managing three
          schedules, and spending $340–$440 a month.
        </p>
        <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#555", marginBottom: "24px" }}>
          And you're still not sure it's all adding up to anything.
        </p>
        <div
          style={{
            background: "#1B2A4A",
            color: "#fff",
            padding: "20px 24px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 500,
            lineHeight: 1.5,
          }}
        >
          Random training produces random results.{" "}
          <span style={{ color: "#E8722A" }}>Performance Lab replaces the chaos with one system.</span>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section style={{ ...sectionStyle, paddingTop: "56px", paddingBottom: "56px" }}>
        <p
          style={{
            fontSize: "12px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#999",
            fontWeight: 500,
            marginBottom: "16px",
          }}
        >
          What's Included
        </p>
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "28px",
            color: "#1B2A4A",
            marginBottom: "8px",
            fontWeight: 400,
          }}
        >
          One Membership. Everything Your Athlete Needs.
        </h2>
        <p style={{ fontSize: "16px", color: "#555", marginBottom: "32px", lineHeight: 1.6 }}>
          Three sessions per week across three purpose-built training environments.
          No tiers. No add-ons. No menus.{" "}
          <strong style={{ color: "#1B2A4A" }}>Consistency is the product.</strong>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {includedItems.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "16px",
                padding: "20px",
                background: "#fff",
                borderRadius: "10px",
                border: "1px solid rgba(27,42,74,0.06)",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "28px", lineHeight: 1 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "15px", color: "#1B2A4A" }}>
                    {item.title}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#E8722A",
                      fontWeight: 500,
                      background: "rgba(232,114,42,0.08)",
                      padding: "2px 10px",
                      borderRadius: "20px",
                    }}
                  >
                    {item.freq}
                  </span>
                </div>
                <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#777", margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <section
        style={{
          background: "#1B2A4A",
          padding: "40px 24px",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <p
            style={{
              fontSize: "12px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              fontWeight: 500,
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            Trusted By Families From
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "8px 16px",
            }}
          >
            {schools.map((school, i) => (
              <span
                key={i}
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.7)",
                  padding: "6px 14px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "20px",
                  fontWeight: 400,
                }}
              >
                {school}
              </span>
            ))}
          </div>
          <p
            style={{
              textAlign: "center",
              marginTop: "20px",
              fontSize: "13px",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            10+ years coaching experience · 200+ athletes developed across Middle TN
          </p>
        </div>
      </section>

      {/* PROMISE */}
      <section style={{ ...sectionStyle, paddingTop: "56px", paddingBottom: "56px" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(27,42,74,0.06)",
            borderRadius: "12px",
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#E8722A",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            Our Promise
          </p>
          <p
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(20px, 3.5vw, 26px)",
              lineHeight: 1.4,
              color: "#1B2A4A",
              maxWidth: "580px",
              margin: "0 auto 20px",
              fontWeight: 400,
            }}
          >
            If your child trains with The Academy, they will be stronger, faster,
            more coordinated, and more confident —{" "}
            <span style={{ color: "#E8722A" }}>regardless of sport.</span>
          </p>
          <p style={{ fontSize: "14px", color: "#999", fontStyle: "italic" }}>
            The Academy isn't a basketball program. It's where kids become better
            athletes — basketball just happens to be the main sport we use.
          </p>
        </div>
      </section>

      {/* FAQ + PRICING (combined) */}
      <section style={{ ...sectionStyle, paddingTop: "56px", paddingBottom: "56px" }}>
        <p
          style={{
            fontSize: "12px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#999",
            fontWeight: 500,
            marginBottom: "16px",
          }}
        >
          Common Questions
        </p>
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "28px",
            color: "#1B2A4A",
            marginBottom: "24px",
            fontWeight: 400,
          }}
        >
          Before you apply
        </h2>

        <div style={{ marginBottom: "48px" }}>
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              q={faq.q}
              a={faq.a}
              isOpen={openFaq === i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>

        {/* PRICING INSIDE FAQ SECTION */}
        <div
          style={{
            background: "#fff",
            border: "2px solid #E8722A",
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#E8722A",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Membership Investment
          </p>
          <div
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "48px",
              color: "#1B2A4A",
              marginBottom: "4px",
            }}
          >
            $280
            <span style={{ fontSize: "20px", color: "#999", fontFamily: "'DM Sans', sans-serif" }}>
              /month
            </span>
          </div>
          <p style={{ fontSize: "14px", color: "#777", marginBottom: "20px" }}>
            Includes all sessions + at-home plan + monthly progress updates
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "#1B2A4A",
              background: "rgba(27,42,74,0.04)",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            Most families spend <strong>$340–$440/month</strong> across multiple
            programs. Performance Lab replaces all of it — for less.
          </p>
          <button
            onClick={scrollToForm}
            style={{
              background: "#E8722A",
              color: "#fff",
              border: "none",
              padding: "14px 40px",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#d4631f")}
            onMouseOut={(e) => (e.target.style.background = "#E8722A")}
          >
            Apply for Performance Lab
          </button>
          <p style={{ fontSize: "12px", color: "#bbb", marginTop: "12px" }}>
            Sibling & annual commitment options available after enrollment
          </p>
        </div>
      </section>

      {/* APPLICATION FORM */}
      <section
        id="apply-section"
        style={{
          ...sectionStyle,
          paddingTop: "56px",
          paddingBottom: "80px",
        }}
      >
        {!showForm ? (
          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "28px",
                color: "#1B2A4A",
                marginBottom: "12px",
                fontWeight: 400,
              }}
            >
              Ready to build a complete athlete?
            </h2>
            <p style={{ fontSize: "15px", color: "#777", marginBottom: "24px" }}>
              Limited spots. Groups are capped to protect coaching quality.
            </p>
            <button
              onClick={scrollToForm}
              style={{
                background: "#E8722A",
                color: "#fff",
                border: "none",
                padding: "16px 48px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.background = "#d4631f")}
              onMouseOut={(e) => (e.target.style.background = "#E8722A")}
            >
              Apply for Performance Lab
            </button>
          </div>
        ) : formSubmitted ? (
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "48px 32px",
              textAlign: "center",
              border: "1px solid rgba(27,42,74,0.06)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "28px",
                color: "#1B2A4A",
                marginBottom: "12px",
                fontWeight: 400,
              }}
            >
              Application Received
            </h2>
            <p style={{ fontSize: "16px", color: "#555", lineHeight: 1.6, marginBottom: "24px" }}>
              You'll hear from Coach Mac within <strong>24 hours</strong> to confirm
              fit, answer questions, and lock in your start date.
            </p>
            <a
              href="sms:5712920833"
              style={{
                display: "inline-block",
                background: "#1B2A4A",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Text Coach Mac Now
            </a>
          </div>
        ) : (
          <div>
            <p
              style={{
                fontSize: "12px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "#E8722A",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              Performance Lab Application
            </p>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "28px",
                color: "#1B2A4A",
                marginBottom: "8px",
                fontWeight: 400,
              }}
            >
              Apply for a Spot
            </h2>
            <p style={{ fontSize: "14px", color: "#777", marginBottom: "32px" }}>
              We'll follow up within 24 hours to confirm fit and placement.
            </p>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "32px",
                  border: "1px solid rgba(27,42,74,0.06)",
                }}
              >
                {/* Parent Info */}
                <p
                  style={{
                    fontSize: "11px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "#999",
                    fontWeight: 600,
                    marginBottom: "16px",
                  }}
                >
                  Parent / Guardian
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "28px" }}>
                  <input
                    type="text"
                    placeholder="Full Name *"
                    required
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    style={inputStyle}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <input
                      type="tel"
                      placeholder="Phone *"
                      required
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      style={inputStyle}
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      required
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Athlete Info */}
                <p
                  style={{
                    fontSize: "11px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "#999",
                    fontWeight: 600,
                    marginBottom: "16px",
                  }}
                >
                  Athlete
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <input
                      type="text"
                      placeholder="Athlete Name *"
                      required
                      value={formData.athleteName}
                      onChange={(e) => setFormData({ ...formData, athleteName: e.target.value })}
                      style={inputStyle}
                    />
                    <select
                      required
                      value={formData.athleteGrade}
                      onChange={(e) => setFormData({ ...formData, athleteGrade: e.target.value })}
                      style={{ ...inputStyle, color: formData.athleteGrade ? "#1B2A4A" : "#999" }}
                    >
                      <option value="" disabled>
                        Grade *
                      </option>
                      <option>3rd Grade</option>
                      <option>4th Grade</option>
                      <option>5th Grade</option>
                      <option>6th Grade</option>
                      <option>7th Grade</option>
                      <option>8th Grade</option>
                      <option>9th Grade</option>
                    </select>
                  </div>
                </div>

                {/* Sports */}
                <p
                  style={{
                    fontSize: "13px",
                    color: "#777",
                    marginBottom: "10px",
                  }}
                >
                  Current sports (select all that apply)
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                >
                  {sportsOptions.map((sport) => {
                    const selected = formData.currentSports.includes(sport);
                    return (
                      <button
                        key={sport}
                        type="button"
                        onClick={() => handleSportToggle(sport)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "20px",
                          border: selected
                            ? "1.5px solid #E8722A"
                            : "1.5px solid rgba(27,42,74,0.12)",
                          background: selected ? "rgba(232,114,42,0.08)" : "transparent",
                          color: selected ? "#E8722A" : "#777",
                          fontSize: "13px",
                          fontWeight: selected ? 600 : 400,
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {sport}
                      </button>
                    );
                  })}
                </div>

                {/* Goals */}
                <textarea
                  placeholder="Training goals or anything we should know..."
                  rows={3}
                  value={formData.trainingGoals}
                  onChange={(e) => setFormData({ ...formData, trainingGoals: e.target.value })}
                  style={{ ...inputStyle, resize: "vertical", marginBottom: "20px" }}
                />

                {/* Injuries */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: formData.injuries === "yes" ? "12px" : "20px" }}>
                  <span style={{ fontSize: "13px", color: "#777" }}>Any injuries or limitations?</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {["no", "yes"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData({ ...formData, injuries: val })}
                        style={{
                          padding: "6px 16px",
                          borderRadius: "20px",
                          border:
                            formData.injuries === val
                              ? "1.5px solid #E8722A"
                              : "1.5px solid rgba(27,42,74,0.12)",
                          background: formData.injuries === val ? "rgba(232,114,42,0.08)" : "transparent",
                          color: formData.injuries === val ? "#E8722A" : "#777",
                          fontSize: "13px",
                          fontWeight: formData.injuries === val ? 600 : 400,
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          textTransform: "capitalize",
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
                {formData.injuries === "yes" && (
                  <input
                    type="text"
                    placeholder="Please describe..."
                    value={formData.injuryNotes}
                    onChange={(e) => setFormData({ ...formData, injuryNotes: e.target.value })}
                    style={{ ...inputStyle, marginBottom: "20px" }}
                  />
                )}

                {/* Referral */}
                <select
                  value={formData.referralSource}
                  onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                  style={{ ...inputStyle, color: formData.referralSource ? "#1B2A4A" : "#999", marginBottom: "28px" }}
                >
                  <option value="" disabled>
                    How did you hear about us?
                  </option>
                  <option>Facebook / Instagram</option>
                  <option>Friend / Family Referral</option>
                  <option>School / Recreation Program</option>
                  <option>Saw us training / At a game</option>
                  <option>Google Search</option>
                  <option>Other</option>
                </select>

                {/* Submit */}
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    background: "#E8722A",
                    color: "#fff",
                    border: "none",
                    padding: "16px",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "#d4631f")}
                  onMouseOut={(e) => (e.target.style.background = "#E8722A")}
                >
                  Apply for Performance Lab
                </button>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#bbb",
                    textAlign: "center",
                    marginTop: "12px",
                  }}
                >
                  We'll text or call within 24 hours. No spam, no pressure.
                </p>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "1px solid rgba(27,42,74,0.08)",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "13px", color: "#999", marginBottom: "4px" }}>
          The Academy · Gallatin, Tennessee · (571) 292-0833
        </p>
        <p style={{ fontSize: "12px", color: "#ccc" }}>
          © 2026 The Academy. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1.5px solid rgba(27,42,74,0.12)",
  fontSize: "14px",
  fontFamily: "'DM Sans', sans-serif",
  color: "#1B2A4A",
  background: "#FAFAF8",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};
