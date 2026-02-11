import Link from "next/link";
import { ArrowRight, Zap, Users, Target } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";
import { PROGRAMS } from "@/lib/config";

export const metadata = generatePageMetadata({
  title: "Programs — Youth Athletic Training",
  description:
    "Explore our youth athletic training programs: Performance Lab membership, Skills Lab drop-in sessions, and Private Training in Gallatin, TN.",
  path: "/programs",
});

const ICONS = [Zap, Users, Target];

export default function ProgramsPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <p
            className="text-[var(--color-brand-gold)] text-sm font-semibold uppercase tracking-widest mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Training Programs
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            Find the Right
            <br />
            <span className="text-[var(--color-brand-gold)]">Training Path</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            From drop-in sessions to structured year-round development, we have
            a program for every athlete and every goal.
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-24 md:py-32 section-light">
        <div className="container">
          <div className="grid gap-10 max-w-5xl mx-auto md:grid-cols-3">
            {PROGRAMS.map((program, i) => {
              const Icon = ICONS[i] || Zap;
              return (
                <div
                  key={program.slug}
                  className={`relative bg-white rounded-xl border-2 p-8 h-full flex flex-col transition-all duration-150 hover:shadow-lg hover:-translate-y-1 ${
                    i === 0
                      ? "border-[var(--color-brand-gold)] shadow-md"
                      : "border-[var(--color-brand-gray-light)] hover:border-[var(--color-brand-gold)]/40"
                  }`}
                >
                  {i === 0 && (
                    <div className="absolute -top-3 right-4">
                      <span className="inline-block px-3 py-1 bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold-dark)] text-xs font-semibold rounded-full border border-[var(--color-brand-gold)]/20">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="w-11 h-11 rounded-xl bg-[var(--color-brand-gold)]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[var(--color-brand-gold)]" />
                  </div>

                  <p
                    className="text-[10px] uppercase tracking-widest text-[var(--color-brand-gray)]/70 font-medium mb-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {program.label}
                  </p>

                  <h2 className="text-xl font-bold mb-2">{program.shortName}</h2>

                  <p className="text-[var(--color-brand-gray)] text-sm leading-relaxed mb-4">
                    {program.description}
                  </p>

                  {/* Schedule */}
                  <p className="text-xs text-[var(--color-brand-gray)]/70 mb-1">
                    {program.schedule}
                  </p>

                  {/* Ages */}
                  <p className="text-xs text-[var(--color-brand-gray)]/70 mb-1">
                    Ages: {program.ages}
                  </p>

                  {/* Group Size */}
                  {program.groupSize && (
                    <p className="text-[11px] text-orange-600 font-semibold mb-1">
                      Limited to {program.groupSize}
                    </p>
                  )}

                  {/* Features */}
                  <ul className="mt-4 mb-6 space-y-2 flex-grow">
                    {program.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-[var(--color-brand-gray)]"
                      >
                        <span className="text-[var(--color-brand-gold)] mt-0.5 shrink-0">
                          &#10003;
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Price + CTA */}
                  <div className="border-t border-[var(--color-brand-gray-light)] pt-6 mt-auto">
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold text-[var(--color-brand-gold-dark)]">
                        {program.price}
                      </span>
                      <span className="text-sm text-[var(--color-brand-gray)]">
                        {program.unit}
                      </span>
                    </div>
                    <Link
                      href={`/programs/${program.slug}`}
                      className="btn-primary w-full text-center text-sm py-3"
                    >
                      Learn More
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Not Sure Where to
            <br />
            <span className="text-[var(--color-brand-gold)]">Start?</span>
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Take our quick assessment quiz and we will recommend the best
            program for your athlete.
          </p>
          <Link href="/get-started" className="btn-primary text-lg px-10 py-4">
            Take the Quiz
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
