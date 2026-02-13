"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { CONTACT } from "@/lib/config";
import { trackEvent } from "@/components/seo/Analytics";

type AgeRange = "under-8" | "8-10" | "11-14" | "15+";
type Sport = "basketball" | "flag-football" | "soccer" | "multiple";
type Goal = "try-it-out" | "commit" | "tryout-prep" | "not-sure";

interface Recommendation {
  program: string;
  slug: string;
  price: string;
  unit: string;
  description: string;
  cta: string;
  productId: string;
  checkoutCta: string;
}

const RECOMMENDATIONS: Record<string, Recommendation> = {
  "skills-lab": {
    program: "Skills Lab",
    slug: "skills-lab",
    price: "$10",
    unit: "per session",
    description:
      "A great starting point. Drop in to a Skills Lab session to experience our coaching style, work on fundamentals, and see if structured training is the right fit.",
    cta: "Drop In to Skills Lab",
    productId: "skills-lab-dropin",
    checkoutCta: "Buy Drop-In — $10",
  },
  "performance-lab": {
    program: "Performance Lab",
    slug: "performance-lab",
    price: "$245",
    unit: "per month",
    description:
      "Our flagship program for committed athletes. Three sessions per week with baseline testing, 90-day progress cycles, and individualized coaching to build speed, agility, and strength.",
    cta: "Apply for Performance Lab",
    productId: "performance-lab",
    checkoutCta: "Apply for Performance Lab — 8 Athletes Per Cohort · $245/mo",
  },
  "private-training": {
    program: "Private Training",
    slug: "private-training",
    price: "$60",
    unit: "per session",
    description:
      "One-on-one sessions tailored to your athlete's specific goals. Ideal for tryout prep, position-specific work, or accelerated development with undivided coaching attention.",
    cta: "Book a Private Session",
    productId: "individual-training",
    checkoutCta: "Book Now — $60",
  },
};

const AGE_OPTIONS = [
  { value: "under-8" as AgeRange, label: "Under 8" },
  { value: "8-10" as AgeRange, label: "8-10" },
  { value: "11-14" as AgeRange, label: "11-14" },
  { value: "15+" as AgeRange, label: "15+" },
];

const SPORT_OPTIONS = [
  { value: "basketball" as Sport, label: "Basketball" },
  { value: "flag-football" as Sport, label: "Flag Football" },
  { value: "soccer" as Sport, label: "Soccer" },
  { value: "multiple" as Sport, label: "Multiple Sports" },
];

const GOAL_OPTIONS = [
  { value: "try-it-out" as Goal, label: "Try it out" },
  { value: "commit" as Goal, label: "Commit to improvement" },
  { value: "tryout-prep" as Goal, label: "Tryout prep" },
  { value: "not-sure" as Goal, label: "Not sure yet" },
];

function getRecommendation(
  age: AgeRange,
  _sport: Sport,
  goal: Goal
): Recommendation {
  // Under 8 or "try it out" or "not sure" --> Skills Lab
  if (age === "under-8" || goal === "try-it-out" || goal === "not-sure") {
    return RECOMMENDATIONS["skills-lab"];
  }

  // Tryout prep at any age --> Private Training
  if (goal === "tryout-prep") {
    return RECOMMENDATIONS["private-training"];
  }

  // Ages 8-14 + commit --> Performance Lab
  if ((age === "8-10" || age === "11-14") && goal === "commit") {
    return RECOMMENDATIONS["performance-lab"];
  }

  // 15+ committed --> Private Training (best fit for older athletes)
  if (age === "15+" && goal === "commit") {
    return RECOMMENDATIONS["private-training"];
  }

  // Default fallback
  return RECOMMENDATIONS["skills-lab"];
}

export default function GetStartedQuiz() {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState<AgeRange | null>(null);
  const [sport, setSport] = useState<Sport | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null
  );
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  function handleAgeSelect(value: AgeRange) {
    setAge(value);
    setStep(2);
    trackEvent("quiz_step_1", { age: value });
  }

  function handleSportSelect(value: Sport) {
    setSport(value);
    setStep(3);
    trackEvent("quiz_step_2", { sport: value });
  }

  function handleGoalSelect(value: Goal) {
    setGoal(value);
    const rec = getRecommendation(age!, sport!, value);
    setRecommendation(rec);
    setStep(4); // Contact capture step
    trackEvent("quiz_step_3", { goal: value });
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parentName || undefined,
          email,
          phone: phone || undefined,
          source: "quiz",
          athleteAge: age,
          sport,
          goal,
          recommendedProgram: recommendation?.program,
        }),
      });
    } catch {
      // Don't block the user if the API fails
    }

    trackEvent("quiz_complete", {
      age: age!,
      sport: sport!,
      goal: goal!,
      recommendation: recommendation?.program || "",
    });

    setSubmitting(false);
    setStep(5); // Show recommendation
  }

  function handleSkipContact() {
    trackEvent("quiz_complete", {
      age: age!,
      sport: sport!,
      goal: goal!,
      recommendation: recommendation?.program || "",
    });
    setStep(5);
  }

  function handleBack() {
    if (step === 2) {
      setStep(1);
      setSport(null);
    } else if (step === 3) {
      setStep(2);
      setGoal(null);
    } else if (step === 4) {
      setStep(3);
      setRecommendation(null);
      setGoal(null);
    } else if (step === 5) {
      setStep(4);
    }
  }

  function handleRestart() {
    setStep(1);
    setAge(null);
    setSport(null);
    setGoal(null);
    setRecommendation(null);
    setParentName("");
    setEmail("");
    setPhone("");
  }

  async function handleCheckout() {
    if (!recommendation) return;
    setCheckingOut(true);
    setCheckoutError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: recommendation.productId,
          ...(email && { email }),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setCheckoutError(
          data.error || "Unable to start checkout. Please try again."
        );
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Something went wrong. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <p
            className="text-[var(--color-brand-gold)] text-sm font-semibold uppercase tracking-widest mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Free Assessment
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            Find the Right{" "}
            <span className="text-[var(--color-brand-gold)]">Program</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Answer 3 quick questions and we will recommend the best starting
            point for your athlete.
          </p>
        </div>
      </section>

      {/* Quiz */}
      <section className="py-24 md:py-32 section-light">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="flex items-center gap-2 mb-12">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--color-brand-gray-light)]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: step >= s ? "100%" : step === s ? "50%" : "0%",
                      backgroundColor:
                        step >= s
                          ? "var(--color-brand-gold)"
                          : "var(--color-brand-gray-light)",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Step 1: Age */}
            {step === 1 && (
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">
                  How Old Is Your Athlete?
                </h2>
                <p className="text-[var(--color-brand-gray)] mb-8">
                  This helps us recommend the right age-appropriate program.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {AGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAgeSelect(option.value)}
                      className="p-6 rounded-xl border-2 border-[var(--color-brand-gray-light)] text-center hover:border-[var(--color-brand-gold)] hover:bg-[var(--color-brand-gold)]/5 transition-all duration-150 cursor-pointer"
                    >
                      <span
                        className="text-xl font-bold block"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Sport */}
            {step === 2 && (
              <div>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-[var(--color-brand-gray)] mb-6 hover:text-[var(--color-brand-black)] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">
                  Primary Sport?
                </h2>
                <p className="text-[var(--color-brand-gray)] mb-8">
                  We train across multiple sports, but knowing the primary focus
                  helps us tailor the recommendation.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {SPORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSportSelect(option.value)}
                      className="p-6 rounded-xl border-2 border-[var(--color-brand-gray-light)] text-center hover:border-[var(--color-brand-gold)] hover:bg-[var(--color-brand-gold)]/5 transition-all duration-150 cursor-pointer"
                    >
                      <span
                        className="text-xl font-bold block"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Goal */}
            {step === 3 && (
              <div>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-[var(--color-brand-gray)] mb-6 hover:text-[var(--color-brand-black)] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">
                  What&apos;s the Goal?
                </h2>
                <p className="text-[var(--color-brand-gray)] mb-8">
                  Every athlete is different. Tell us what you are looking for.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {GOAL_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleGoalSelect(option.value)}
                      className="p-6 rounded-xl border-2 border-[var(--color-brand-gray-light)] text-center hover:border-[var(--color-brand-gold)] hover:bg-[var(--color-brand-gold)]/5 transition-all duration-150 cursor-pointer"
                    >
                      <span
                        className="text-xl font-bold block"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Contact Capture */}
            {step === 4 && recommendation && (
              <div>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-[var(--color-brand-gray)] mb-6 hover:text-[var(--color-brand-black)] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">
                  Where Should We Send Your Recommendation?
                </h2>
                <p className="text-[var(--color-brand-gray)] mb-8">
                  Enter your info and we&apos;ll send program details, pricing,
                  and next steps straight to your inbox.
                </p>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="parentName" className="block text-sm font-medium mb-1">
                      Your Name
                    </label>
                    <input
                      id="parentName"
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="First and last name"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-brand-gray-light)] focus:border-[var(--color-brand-gold)] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-brand-gray-light)] focus:border-[var(--color-brand-gold)] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1">
                      Phone <span className="text-[var(--color-brand-gray)] text-xs">(optional)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(615) 555-0123"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-brand-gray-light)] focus:border-[var(--color-brand-gold)] focus:outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !email}
                    className="btn-primary w-full text-center py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        See My Recommendation
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
                <button
                  onClick={handleSkipContact}
                  className="mt-4 text-sm text-[var(--color-brand-gray)] underline hover:text-[var(--color-brand-black)] transition-colors cursor-pointer"
                >
                  Skip for now
                </button>
              </div>
            )}

            {/* Step 5: Recommendation */}
            {step === 5 && recommendation && (
              <div>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-[var(--color-brand-gray)] mb-6 hover:text-[var(--color-brand-black)] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-8 h-8 text-[var(--color-brand-gold)]" />
                  <h2 className="text-3xl md:text-4xl font-bold">
                    We Recommend
                  </h2>
                </div>

                <div className="bg-white rounded-xl border-2 border-[var(--color-brand-gold)] p-8 shadow-lg">
                  <p
                    className="text-[10px] uppercase tracking-widest text-[var(--color-brand-gold-dark)] font-medium mb-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Recommended Program
                  </p>
                  <h3 className="text-3xl font-bold mb-2">
                    {recommendation.program}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-[var(--color-brand-gold-dark)]">
                      {recommendation.price}
                    </span>
                    <span className="text-[var(--color-brand-gray)]">
                      {recommendation.unit}
                    </span>
                  </div>
                  <p className="text-[var(--color-brand-gray)] leading-relaxed mb-8">
                    {recommendation.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleCheckout}
                      disabled={checkingOut}
                      className="btn-primary flex-1 text-center py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {checkingOut ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          {recommendation.checkoutCta}
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                    <a
                      href={`tel:${CONTACT.phoneRaw}`}
                      className="btn-secondary-dark flex-1 text-center py-3"
                    >
                      Call {CONTACT.phone}
                    </a>
                  </div>
                  {checkoutError && (
                    <p className="text-red-500 text-sm mt-2">{checkoutError}</p>
                  )}
                  <p className="text-sm text-[var(--color-brand-gray)] mt-4">
                    Want to learn more first?{" "}
                    <Link
                      href={`/programs/${recommendation.slug}`}
                      className="text-[var(--color-brand-gold-dark)] underline hover:no-underline"
                    >
                      View program details
                    </Link>
                  </p>
                </div>

                <button
                  onClick={handleRestart}
                  className="mt-6 text-sm text-[var(--color-brand-gray)] underline hover:text-[var(--color-brand-black)] transition-colors cursor-pointer"
                >
                  Start over
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
