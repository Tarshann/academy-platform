"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ArrowLeft, CheckCircle, Phone } from "lucide-react";
import { SITE_CONFIG, PROGRAMS } from "@/lib/config";
import { trackEvent } from "@/components/seo/Analytics";

type Step = "age" | "sport" | "goal" | "result";

const AGE_OPTIONS = [
  { label: "7–9 years old", value: "7-9" },
  { label: "10–12 years old", value: "10-12" },
  { label: "13–15 years old", value: "13-15" },
  { label: "16–18 years old", value: "16-18" },
];

const SPORT_OPTIONS = [
  { label: "Basketball", value: "basketball" },
  { label: "Football", value: "football" },
  { label: "Flag Football", value: "flag-football" },
  { label: "Soccer", value: "soccer" },
  { label: "Multiple Sports", value: "multi" },
];

const GOAL_OPTIONS = [
  { label: "Get faster (speed & agility)", value: "speed" },
  { label: "Get stronger (power & strength)", value: "strength" },
  { label: "Improve overall athleticism", value: "general" },
  { label: "Prepare for tryouts / next season", value: "tryouts" },
];

function getRecommendation(age: string, goal: string): string {
  if (age === "7-9") return "skills-lab";
  if (goal === "tryouts") return "private-training";
  return "performance-lab";
}

export function GetStartedQuiz() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("program");

  const [step, setStep] = useState<Step>(preselected ? "result" : "age");
  const [age, setAge] = useState("");
  const [sport, setSport] = useState("");
  const [goal, setGoal] = useState("");

  const recommendedSlug = preselected || getRecommendation(age, goal);
  const recommended =
    PROGRAMS.find((p) => p.slug === recommendedSlug) || PROGRAMS[0];

  const selectAndAdvance = (
    setter: (v: string) => void,
    value: string,
    nextStep: Step
  ) => {
    setter(value);
    setStep(nextStep);
    if (nextStep === "result") {
      trackEvent("quiz_completed", {
        age,
        sport: sport || value,
        goal: goal || value,
      });
    }
  };

  return (
    <section className="section-dark flex min-h-screen items-center pt-20">
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        {/* Progress Bar */}
        {step !== "result" && (
          <div className="mb-12 flex gap-2">
            {(["age", "sport", "goal"] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  (["age", "sport", "goal"] as Step[]).indexOf(step) >= i
                    ? "bg-[var(--color-brand-gold)]"
                    : "bg-[var(--color-neutral-700)]"
                }`}
              />
            ))}
          </div>
        )}

        {/* Step: Age */}
        {step === "age" && (
          <div>
            <h1 className="font-display text-3xl font-bold text-[var(--color-brand-white)] sm:text-4xl">
              How old is your athlete?
            </h1>
            <p className="mt-3 text-[var(--color-text-on-dark-secondary)]">
              We tailor everything — coaching style, intensity, and programming —
              to age and development stage.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectAndAdvance(setAge, opt.value, "sport")}
                  className="flex items-center gap-3 rounded-xl border-2 border-[var(--color-neutral-700)] bg-[var(--color-surface-dark-elevated)] px-6 py-5 text-left text-[var(--color-brand-white)] transition-all hover:border-[var(--color-brand-gold)] focus:border-[var(--color-brand-gold)] focus:outline-none"
                >
                  <span className="text-lg font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Sport */}
        {step === "sport" && (
          <div>
            <button
              onClick={() => setStep("age")}
              className="mb-6 flex items-center gap-1 text-sm text-[var(--color-text-on-dark-secondary)] hover:text-[var(--color-brand-white)]"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <h1 className="font-display text-3xl font-bold text-[var(--color-brand-white)] sm:text-4xl">
              What sport does your athlete play?
            </h1>
            <p className="mt-3 text-[var(--color-text-on-dark-secondary)]">
              We build training around sport-specific movement patterns and
              demands.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {SPORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    selectAndAdvance(setSport, opt.value, "goal")
                  }
                  className="flex items-center gap-3 rounded-xl border-2 border-[var(--color-neutral-700)] bg-[var(--color-surface-dark-elevated)] px-6 py-5 text-left text-[var(--color-brand-white)] transition-all hover:border-[var(--color-brand-gold)] focus:border-[var(--color-brand-gold)] focus:outline-none"
                >
                  <span className="text-lg font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Goal */}
        {step === "goal" && (
          <div>
            <button
              onClick={() => setStep("sport")}
              className="mb-6 flex items-center gap-1 text-sm text-[var(--color-text-on-dark-secondary)] hover:text-[var(--color-brand-white)]"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <h1 className="font-display text-3xl font-bold text-[var(--color-brand-white)] sm:text-4xl">
              What&apos;s the primary goal?
            </h1>
            <p className="mt-3 text-[var(--color-text-on-dark-secondary)]">
              This helps us recommend the right program and starting point.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    selectAndAdvance(setGoal, opt.value, "result")
                  }
                  className="flex items-center gap-3 rounded-xl border-2 border-[var(--color-neutral-700)] bg-[var(--color-surface-dark-elevated)] px-6 py-5 text-left text-[var(--color-brand-white)] transition-all hover:border-[var(--color-brand-gold)] focus:border-[var(--color-brand-gold)] focus:outline-none"
                >
                  <span className="text-lg font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Result / Recommendation */}
        {step === "result" && (
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">
                We have a recommendation
              </span>
            </div>

            <h1 className="font-display text-3xl font-bold text-[var(--color-brand-white)] sm:text-4xl">
              We recommend{" "}
              <span className="text-[var(--color-brand-gold)]">
                {recommended.name}
              </span>
            </h1>
            <p className="mt-4 text-lg text-[var(--color-text-on-dark-secondary)]">
              {recommended.description}
            </p>

            <div className="mt-8 rounded-2xl border border-[var(--color-neutral-700)] bg-[var(--color-surface-dark-elevated)] p-8">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold text-[var(--color-brand-white)]">
                  {recommended.price}
                </span>
                <span className="text-[var(--color-text-on-dark-secondary)]">
                  /{recommended.priceNote}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-on-dark-secondary)]">
                {recommended.schedule} · {recommended.ages}
              </p>
              <ul className="mt-6 flex flex-col gap-2">
                {recommended.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-[var(--color-text-on-dark-secondary)]"
                  >
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand-gold)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={`mailto:${SITE_CONFIG.email}?subject=Free Assessment Request - ${recommended.name}&body=Hi, I'd like to schedule a free assessment for my athlete for the ${recommended.name} program.`}
                className="btn-primary text-center"
              >
                Book a Free Assessment
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={`tel:${SITE_CONFIG.phone.replace(/[^0-9+]/g, "")}`}
                className="btn-secondary text-center"
              >
                <Phone className="h-4 w-4" />
                Call Us: {SITE_CONFIG.phone}
              </a>
            </div>

            {!preselected && (
              <button
                onClick={() => {
                  setStep("age");
                  setAge("");
                  setSport("");
                  setGoal("");
                }}
                className="mt-6 text-sm text-[var(--color-text-muted)] underline hover:text-[var(--color-text-on-dark-secondary)]"
              >
                Retake assessment
              </button>
            )}

            <Link
              href={`/programs/${recommended.slug}`}
              className="mt-4 block text-sm text-[var(--color-brand-gold)] hover:underline"
            >
              View full program details →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
