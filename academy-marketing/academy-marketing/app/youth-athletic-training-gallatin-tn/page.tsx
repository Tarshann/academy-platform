import Link from "next/link";
import { ArrowRight, CheckCircle, MapPin } from "lucide-react";
import { SITE_CONFIG, PROGRAMS, FAQ_ITEMS, TESTIMONIALS } from "@/lib/config";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Youth Athletic Training in Gallatin, TN",
  description:
    "The Academy offers elite youth athletic training in Gallatin, TN and Sumner County. Speed, agility, strength, and confidence for athletes ages 7–18. Free assessments available.",
  path: "/youth-athletic-training-gallatin-tn",
});

export default function GallatinLocalPage() {
  return (
    <>
      {/* Hero */}
      <section className="section-dark pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-gold)]/30 bg-[var(--color-brand-gold)]/10 px-4 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-[var(--color-brand-gold)]" />
              <span className="text-xs font-semibold tracking-wider text-[var(--color-brand-gold)] uppercase">
                Gallatin & Sumner County, TN
              </span>
            </div>
            <h1 className="font-display text-4xl font-bold text-[var(--color-brand-white)] sm:text-5xl">
              Youth Athletic Training in Gallatin, Tennessee
            </h1>
            <p className="mt-6 text-lg text-[var(--color-text-on-dark-secondary)]">
              The Academy is Gallatin&apos;s dedicated youth athletic training program.
              We develop speed, agility, strength, and game-ready confidence for
              athletes ages 7–18 across basketball, football, flag football, and soccer.
            </p>
            <p className="mt-4 text-[var(--color-text-on-dark-secondary)]">
              Unlike general fitness gyms or seasonal camps, our training is structured,
              progressive, and measured. Athletes are tested on entry, coached through
              individualized programming, and retested every 90 days so families can see
              real results.
            </p>
            <Link href="/get-started" className="btn-primary mt-8 inline-flex">
              Book a Free Assessment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="bg-[var(--color-surface)] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
            Programs Available in Gallatin
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--color-text-secondary)]">
            We run three programs out of our outdoor training facility. Each one is
            built around the same coaching standard — the difference is commitment
            level and how deep we go.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {PROGRAMS.map((p) => (
              <div
                key={p.slug}
                className="rounded-2xl border border-[var(--color-neutral-200)] p-6"
              >
                <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)]">
                  {p.name}
                </h3>
                <p className="mt-1 font-display text-2xl font-bold text-[var(--color-brand-gold)]">
                  {p.price}
                  <span className="text-sm font-normal text-[var(--color-text-muted)]">
                    /{p.priceNote}
                  </span>
                </p>
                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                  {p.description}
                </p>
                <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                  {p.schedule} · {p.ages}
                </p>
                <Link
                  href={`/programs/${p.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand-gold)] hover:underline"
                >
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Gallatin Families Choose Us */}
      <section className="section-elevated py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
                Why Gallatin families choose The Academy
              </h2>
              <ul className="mt-8 flex flex-col gap-4">
                {[
                  "Outdoor training that transfers directly to game performance — no rubberized gym floors",
                  "Structured 90-day development cycles with measurable progress tracking",
                  "Coaching staff with real credentials, not just enthusiasm",
                  "Multi-sport approach: we build athletes first, then sharpen sport-specific skills",
                  "Low entry barrier: Skills Lab at $10/session means no risk to try",
                  "Convenient Gallatin location serving Hendersonville, Portland, and greater Sumner County",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-brand-gold)]" />
                    <span className="text-[var(--color-text-secondary)]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonial */}
            <div className="flex flex-col justify-center">
              {TESTIMONIALS[0] && (
                <blockquote className="rounded-2xl border border-[var(--color-neutral-200)] bg-[var(--color-surface)] p-8">
                  <p className="text-lg italic leading-relaxed text-[var(--color-text-secondary)]">
                    &ldquo;{TESTIMONIALS[0].quote}&rdquo;
                  </p>
                  <footer className="mt-4">
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {TESTIMONIALS[0].name}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {TESTIMONIALS[0].detail}
                    </p>
                  </footer>
                </blockquote>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[var(--color-surface)] py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
            Common Questions from Gallatin Parents
          </h2>
          <div className="mt-8 flex flex-col divide-y divide-[var(--color-neutral-200)]">
            {FAQ_ITEMS.slice(0, 5).map((faq, i) => (
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
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand-gold)] hover:underline"
          >
            See all FAQs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="section-dark py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-[var(--color-brand-white)]">
            Your athlete&apos;s next level starts in Gallatin.
          </h2>
          <p className="mt-4 text-[var(--color-text-on-dark-secondary)]">
            Book a free assessment. We&apos;ll evaluate your athlete and recommend the
            right starting point.
          </p>
          <Link href="/get-started" className="btn-primary mt-8 inline-flex">
            Book a Free Assessment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
