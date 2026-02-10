import Link from "next/link";
import { ArrowRight, Award } from "lucide-react";
import { COACHES, SITE_CONFIG } from "@/lib/config";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Meet the Coaches",
  description: `Meet the coaching staff at ${SITE_CONFIG.name}. Certified, experienced coaches dedicated to developing youth athletes in Gallatin, TN.`,
  path: "/coaches",
});

export default function CoachesPage() {
  return (
    <>
      {/* Hero */}
      <section className="section-dark pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="font-display text-sm font-semibold tracking-wider text-[var(--color-brand-gold)] uppercase">
              Our Team
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold text-[var(--color-brand-white)] sm:text-5xl">
              The coaches behind every athlete.
            </h1>
            <p className="mt-6 text-lg text-[var(--color-text-on-dark-secondary)]">
              You&apos;re trusting us with your child. We take that seriously. Every
              coach at The Academy is credentialed, experienced, and committed to
              building athletes who are confident on and off the field.
            </p>
          </div>
        </div>
      </section>

      {/* Coach Cards */}
      <section className="bg-[var(--color-surface)] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {COACHES.map((coach, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-[var(--color-neutral-200)]"
              >
                {/* Photo */}
                <div className="aspect-[4/3] bg-[var(--color-neutral-100)]">
                  {/* TODO: Replace with next/image using coach.image */}
                  <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
                    <p className="text-sm">[Coach photo]</p>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6">
                  <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
                    {coach.name}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-[var(--color-brand-gold)]">
                    {coach.title}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {coach.bio}
                  </p>

                  {/* Certifications */}
                  <div className="mt-6">
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
                      <Award className="h-3.5 w-3.5" />
                      Certifications
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {coach.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="rounded-full bg-[var(--color-surface-elevated)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sports */}
                  <div className="mt-4">
                    <div className="text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
                      Sport Focus
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      {coach.sports.join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Placeholder for future coaches */}
          <div className="mt-12 rounded-2xl border-2 border-dashed border-[var(--color-neutral-200)] p-12 text-center">
            <p className="text-[var(--color-text-muted)]">
              Additional coach profiles coming soon.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-dark py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-[var(--color-brand-white)]">
            Train with coaches who invest in your athlete.
          </h2>
          <p className="mt-4 text-[var(--color-text-on-dark-secondary)]">
            Book a free assessment and meet the team in person.
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
