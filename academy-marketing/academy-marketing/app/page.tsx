import Link from "next/link";
import {
  ArrowRight,
  Zap,
  Target,
  User,
  CheckCircle,
  Clock,
  Users,
  Trophy,
  Star,
  ChevronRight,
} from "lucide-react";
import { SITE_CONFIG, PROGRAMS, TESTIMONIALS } from "@/lib/config";
import { JsonLd, getOrganizationSchema } from "@/lib/structured-data";
import { generatePageMetadata } from "@/lib/metadata";
import { HomepageClient } from "./HomepageClient";

export const metadata = generatePageMetadata({
  title: SITE_CONFIG.name,
  description:
    "Elite youth multi-sport training in Gallatin, TN. Speed, agility, strength, and confidence for athletes ages 7–18. Book a free assessment today.",
  path: "/",
});

const ICON_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap className="h-6 w-6" />,
  Target: <Target className="h-6 w-6" />,
  User: <User className="h-6 w-6" />,
};

const STATS = [
  { value: "4", label: "Sports Supported", icon: <Trophy className="h-5 w-5" /> },
  { value: "7–18", label: "Ages Trained", icon: <Users className="h-5 w-5" /> },
  { value: "3x", label: "Sessions per Week", icon: <Clock className="h-5 w-5" /> },
  { value: "90", label: "Day Progress Cycle", icon: <Star className="h-5 w-5" /> },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={getOrganizationSchema()} />

      {/* ============================================
          HERO
          ============================================ */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-[var(--color-surface-dark)]">
        {/* Background layer — replace with real training video/image */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-brand-black)] via-[var(--color-brand-black)]/80 to-transparent z-10" />
          {/* 
            TODO: Replace with <video> or next/image of real training footage
            <video autoPlay muted loop playsInline className="h-full w-full object-cover">
              <source src="/videos/training-hero.mp4" type="video/mp4" />
            </video>
          */}
          <div className="h-full w-full bg-gradient-to-br from-[var(--color-neutral-950)] via-[var(--color-neutral-900)] to-[var(--color-neutral-800)]" />
        </div>

        <div className="relative z-20 mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-gold)]/30 bg-[var(--color-brand-gold)]/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-gold)]" />
              <span className="text-xs font-semibold tracking-wider text-[var(--color-brand-gold)] uppercase">
                Gallatin & Sumner County
              </span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up delay-1 font-display text-4xl font-bold leading-[1.1] tracking-tight text-[var(--color-brand-white)] sm:text-5xl lg:text-6xl"
              style={{ opacity: 0 }}
            >
              Your Athlete.{" "}
              <span className="text-[var(--color-brand-gold)]">
                Faster. Stronger.
              </span>{" "}
              More Confident.
            </h1>

            {/* Subhead */}
            <p className="animate-fade-up delay-2 mt-6 text-lg leading-relaxed text-[var(--color-text-on-dark-secondary)] sm:text-xl"
              style={{ opacity: 0 }}
            >
              Multi-sport athletic training for ages 7–18. We build speed, agility,
              power, and game-ready confidence — outdoors, where sports are actually
              played.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up delay-3 mt-10 flex flex-col gap-4 sm:flex-row"
              style={{ opacity: 0 }}
            >
              <Link href="/get-started" className="btn-primary text-center">
                Book a Free Assessment
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/programs" className="btn-secondary text-center">
                See Programs
              </Link>
            </div>
          </div>
        </div>

        {/* Diagonal bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 z-20 h-16 bg-[var(--color-surface)]" style={{
          clipPath: "polygon(0 100%, 100% 0, 100% 100%)",
        }} />
      </section>

      {/* ============================================
          TRUST BAR
          ============================================ */}
      <section className="relative z-10 -mt-1 bg-[var(--color-surface)] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold)]">
                  {stat.icon}
                </div>
                <span className="font-display text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
                  {stat.value}
                </span>
                <span className="mt-1 text-xs font-medium tracking-wider text-[var(--color-text-muted)] uppercase">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          PROGRAMS
          ============================================ */}
      <section id="programs" className="bg-[var(--color-surface)] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 max-w-2xl">
            <span className="font-display text-sm font-semibold tracking-wider text-[var(--color-brand-gold)] uppercase">
              Programs
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
              Three ways to train. One standard of coaching.
            </h2>
            <p className="mt-4 text-lg text-[var(--color-text-secondary)]">
              Whether your athlete is exploring training for the first time or
              committed to getting to the next level, there&apos;s a program built for
              where they are right now.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {PROGRAMS.map((program) => (
              <div
                key={program.slug}
                className="group relative flex flex-col rounded-2xl border border-[var(--color-neutral-200)] bg-[var(--color-surface)] p-8 transition-all duration-300 hover:border-[var(--color-brand-gold)]/40 hover:shadow-lg"
              >
                {/* Icon */}
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold)] transition-colors group-hover:bg-[var(--color-brand-gold)] group-hover:text-[var(--color-brand-black)]">
                  {ICON_MAP[program.icon]}
                </div>

                {/* Name + Price */}
                <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
                  {program.shortName}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
                    {program.price}
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    /{program.priceNote}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-4 flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {program.description}
                </p>

                {/* Schedule */}
                <div className="mt-6 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <Clock className="h-3.5 w-3.5" />
                  {program.schedule}
                </div>

                {/* Ages */}
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <Users className="h-3.5 w-3.5" />
                  {program.ages}
                </div>

                {/* CTA */}
                <Link
                  href={`/programs/${program.slug}`}
                  className="mt-8 flex items-center justify-center gap-2 rounded-lg border-2 border-[var(--color-neutral-200)] px-6 py-3 font-display text-sm font-semibold tracking-wide text-[var(--color-text-primary)] uppercase transition-all hover:border-[var(--color-brand-gold)] hover:text-[var(--color-brand-gold)]"
                >
                  Learn More
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          OUTDOOR DIFFERENTIATOR
          ============================================ */}
      <section className="section-dark clip-diagonal py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <span className="font-display text-sm font-semibold tracking-wider text-[var(--color-brand-gold)] uppercase">
                Our Difference
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold text-[var(--color-brand-white)] sm:text-4xl">
                We train where sports are played.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-on-dark-secondary)]">
                Most training facilities put athletes on rubberized gym floors. But
                your athlete doesn&apos;t compete indoors on a flat surface. They play on
                grass, turf, and uneven ground — in sun, wind, and changing conditions.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-[var(--color-text-on-dark-secondary)]">
                That&apos;s why we train outdoors. The speed, agility, and power your
                athlete builds here transfers directly to game situations. No
                translation needed.
              </p>
              <ul className="mt-8 flex flex-col gap-3">
                {[
                  "Real-surface training that transfers to game day",
                  "Exposure to changing conditions builds mental toughness",
                  "Open-field space for true sprint and agility development",
                  "No waiting for equipment — the field is the facility",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-brand-gold)]" />
                    <span className="text-[var(--color-text-on-dark-secondary)]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--color-neutral-800)]">
              {/* TODO: Replace with next/image of outdoor training field */}
              <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
                <p className="text-center text-sm">
                  [Training field photo]<br />
                  Replace with real image
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS
          ============================================ */}
      <section className="clip-diagonal-reverse bg-[var(--color-surface)] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="font-display text-sm font-semibold tracking-wider text-[var(--color-brand-gold)] uppercase">
              What Parents Say
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
              Results parents can see.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="flex flex-col rounded-2xl border border-[var(--color-neutral-200)] bg-[var(--color-surface)] p-8"
              >
                {/* Stars */}
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-[var(--color-brand-gold)] text-[var(--color-brand-gold)]"
                    />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-6 border-t border-[var(--color-neutral-100)] pt-4">
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {t.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {t.detail}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-[var(--color-brand-gold)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-brand-gold)]">
                    {t.program}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <section className="section-dark py-24 lg:py-32">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-[var(--color-brand-white)] sm:text-4xl lg:text-5xl">
            Ready to see what your athlete{" "}
            <span className="text-[var(--color-brand-gold)]">can become?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--color-text-on-dark-secondary)]">
            Start with a free assessment. We&apos;ll evaluate your athlete, recommend
            the right program, and show you exactly how we train.
          </p>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            Groups are capped. We place athletes by age and ability after a quick call.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/get-started" className="btn-primary text-center">
              Book a Free Assessment
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`tel:${SITE_CONFIG.phone.replace(/[^0-9+]/g, "")}`}
              className="btn-secondary text-center"
            >
              Call {SITE_CONFIG.phone}
            </Link>
          </div>
        </div>
      </section>

      {/* Client-side interactivity (scroll reveals, etc.) */}
      <HomepageClient />
    </>
  );
}
