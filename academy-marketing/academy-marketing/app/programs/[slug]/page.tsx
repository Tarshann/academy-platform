import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { PROGRAMS, COACHES, FAQ_ITEMS, type Program } from "@/lib/config";
import { JsonLd, getServiceSchema } from "@/lib/structured-data";
import { generatePageMetadata } from "@/lib/metadata";

type Params = { slug: string };

export async function generateStaticParams() {
  return PROGRAMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const program = PROGRAMS.find((p) => p.slug === slug);
  if (!program) return {};
  return generatePageMetadata({
    title: program.name,
    description: program.description,
    path: `/programs/${program.slug}`,
  });
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const program = PROGRAMS.find((p) => p.slug === slug);
  if (!program) notFound();

  // Filter FAQ items relevant to this program
  const relevantFAQ = FAQ_ITEMS.filter(
    (faq) =>
      faq.answer.toLowerCase().includes(program.shortName.toLowerCase()) ||
      faq.question.toLowerCase().includes("session") ||
      faq.question.toLowerCase().includes("trial") ||
      faq.question.toLowerCase().includes("age")
  ).slice(0, 5);

  return (
    <>
      <JsonLd data={getServiceSchema(program)} />

      {/* Hero */}
      <section className="section-dark pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            {/* Left: Info */}
            <div>
              <Link
                href="/programs"
                className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--color-text-on-dark-secondary)] transition-colors hover:text-[var(--color-brand-white)]"
              >
                ← All Programs
              </Link>
              <h1 className="font-display text-4xl font-bold text-[var(--color-brand-white)] sm:text-5xl">
                {program.name}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-on-dark-secondary)]">
                {program.longDescription}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href={program.ctaHref} className="btn-primary">
                  {program.ctaText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right: Quick Facts Card */}
            <div className="rounded-2xl border border-[var(--color-neutral-700)] bg-[var(--color-surface-dark-elevated)] p-8">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-[var(--color-brand-white)]">
                  {program.price}
                </span>
                <span className="text-[var(--color-text-on-dark-secondary)]">
                  /{program.priceNote}
                </span>
              </div>

              <div className="mt-8 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-[var(--color-brand-gold)]" />
                  <div>
                    <p className="font-semibold text-[var(--color-brand-white)]">
                      Schedule
                    </p>
                    <p className="text-sm text-[var(--color-text-on-dark-secondary)]">
                      {program.schedule}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[var(--color-brand-gold)]" />
                  <div>
                    <p className="font-semibold text-[var(--color-brand-white)]">
                      Ages
                    </p>
                    <p className="text-sm text-[var(--color-text-on-dark-secondary)]">
                      {program.ages}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-[var(--color-brand-gold)]" />
                  <div>
                    <p className="font-semibold text-[var(--color-brand-white)]">
                      Progress Tracking
                    </p>
                    <p className="text-sm text-[var(--color-text-on-dark-secondary)]">
                      Baseline test → 90-day retest cycle
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-[var(--color-neutral-700)] pt-6">
                <Link href={program.ctaHref} className="btn-primary w-full text-center">
                  {program.ctaText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="bg-[var(--color-surface)] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <span className="font-display text-sm font-semibold tracking-wider text-[var(--color-brand-gold)] uppercase">
              Results
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-[var(--color-text-primary)]">
              What your athlete will be able to do.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {program.outcomes.map((outcome, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border border-[var(--color-neutral-200)] p-6"
              >
                <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-[var(--color-brand-gold)]" />
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {outcome}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="section-elevated py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <span className="font-display text-sm font-semibold tracking-wider text-[var(--color-brand-gold)] uppercase">
                What&apos;s Included
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold text-[var(--color-text-primary)]">
                Everything in {program.shortName}.
              </h2>
              <ul className="mt-8 flex flex-col gap-4">
                {program.includes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-brand-gold)]" />
                    <span className="text-lg text-[var(--color-text-secondary)]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-display text-sm font-semibold tracking-wider text-[var(--color-brand-gold)] uppercase">
                Weekly Rhythm
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold text-[var(--color-text-primary)]">
                How we measure progress.
              </h2>
              <div className="mt-8 space-y-6">
                <div className="rounded-xl border border-[var(--color-neutral-200)] bg-[var(--color-surface)] p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-gold)] font-display text-sm font-bold text-[var(--color-brand-black)]">
                      1
                    </div>
                    <h3 className="font-display text-lg font-bold">Baseline Assessment</h3>
                  </div>
                  <p className="mt-3 pl-11 text-sm text-[var(--color-text-secondary)]">
                    On entry, we test speed (40-yard dash, pro agility), vertical
                    jump, and sport-specific movement quality. This is your
                    athlete&apos;s starting point.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-neutral-200)] bg-[var(--color-surface)] p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-gold)] font-display text-sm font-bold text-[var(--color-brand-black)]">
                      2
                    </div>
                    <h3 className="font-display text-lg font-bold">Structured Training Cycle</h3>
                  </div>
                  <p className="mt-3 pl-11 text-sm text-[var(--color-text-secondary)]">
                    Progressive programming across speed, agility, strength,
                    and power — adjusted based on your athlete&apos;s sport, position,
                    and development stage.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-neutral-200)] bg-[var(--color-surface)] p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-gold)] font-display text-sm font-bold text-[var(--color-brand-black)]">
                      3
                    </div>
                    <h3 className="font-display text-lg font-bold">90-Day Retest</h3>
                  </div>
                  <p className="mt-3 pl-11 text-sm text-[var(--color-text-secondary)]">
                    Every 90 days, we retest. You see the numbers. Your athlete
                    sees the progress. The next cycle builds on what we learned.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ for this program */}
      {relevantFAQ.length > 0 && (
        <section className="bg-[var(--color-surface)] py-20 lg:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
              Common Questions About {program.shortName}
            </h2>
            <div className="mt-8 flex flex-col divide-y divide-[var(--color-neutral-200)]">
              {relevantFAQ.map((faq, i) => (
                <div key={i} className="py-6">
                  <h3 className="font-semibold text-[var(--color-text-primary)]">
                    {faq.question}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/faq"
              className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand-gold)] hover:underline"
            >
              See all FAQs <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="section-dark py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-[var(--color-brand-white)]">
            Ready to start {program.shortName}?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--color-text-on-dark-secondary)]">
            Groups are capped. We place athletes by age and ability after a quick
            assessment.
          </p>
          <Link href={program.ctaHref} className="btn-primary mt-8 inline-flex">
            {program.ctaText}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
