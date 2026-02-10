import Link from "next/link";
import { ArrowRight, Zap, Target, User, Clock, Users, ChevronRight } from "lucide-react";
import { PROGRAMS } from "@/lib/config";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Programs",
  description:
    "Youth athletic training programs in Gallatin, TN. Performance Lab, Skills Lab, and Private Training for athletes ages 7–18.",
  path: "/programs",
});

const ICON_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap className="h-7 w-7" />,
  Target: <Target className="h-7 w-7" />,
  User: <User className="h-7 w-7" />,
};

export default function ProgramsPage() {
  return (
    <>
      {/* Hero */}
      <section className="section-dark pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="font-display text-sm font-semibold tracking-wider text-[var(--color-brand-gold)] uppercase">
              Programs
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold text-[var(--color-brand-white)] sm:text-5xl">
              Find the right program for your athlete.
            </h1>
            <p className="mt-6 text-lg text-[var(--color-text-on-dark-secondary)]">
              Every program is built around the same coaching standard. The difference
              is commitment level, frequency, and how deep we go. Start anywhere — many
              families begin with Skills Lab and move into Performance Lab.
            </p>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="bg-[var(--color-surface)] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-12">
            {PROGRAMS.map((program, i) => (
              <div
                key={program.slug}
                className="grid items-start gap-8 rounded-2xl border border-[var(--color-neutral-200)] p-8 md:grid-cols-3 lg:p-12"
              >
                {/* Left: Name + Price */}
                <div>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold)]">
                    {ICON_MAP[program.icon]}
                  </div>
                  <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
                    {program.name}
                  </h2>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold">
                      {program.price}
                    </span>
                    <span className="text-[var(--color-text-muted)]">
                      /{program.priceNote}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 text-sm text-[var(--color-text-muted)]">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {program.schedule}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {program.ages}
                    </div>
                  </div>
                </div>

                {/* Middle: Description + Outcomes */}
                <div>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {program.longDescription}
                  </p>
                </div>

                {/* Right: Includes + CTA */}
                <div>
                  <h3 className="font-display text-sm font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
                    What&apos;s Included
                  </h3>
                  <ul className="mt-3 flex flex-col gap-2">
                    {program.includes.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"
                      >
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-brand-gold)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-col gap-3">
                    <Link
                      href={`/programs/${program.slug}`}
                      className="btn-dark text-center"
                    >
                      Full Details
                    </Link>
                    <Link
                      href={program.ctaHref}
                      className="btn-primary text-center"
                    >
                      {program.ctaText}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Not Sure CTA */}
      <section className="section-elevated py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
            Not sure which program is right?
          </h2>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            Take our 30-second assessment. We&apos;ll recommend the best starting point
            based on your athlete&apos;s age, sport, and goals.
          </p>
          <Link href="/get-started" className="btn-primary mt-8 inline-flex">
            Take the Assessment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
