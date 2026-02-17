import Link from "next/link";
import { ArrowRight, CheckCircle, MapPin } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";
import {
  SITE,
  PROGRAMS,
  COACHES,
  TESTIMONIALS,
  TRUSTED_SCHOOLS,
  SERVICE_AREAS,
  CONTACT,
  CONTACTS,
} from "@/lib/config";

export const metadata = generatePageMetadata({
  title:
    "Youth Athletic Training in Gallatin, TN — Sumner County & Middle Tennessee",
  description:
    "Youth athletic training in Gallatin, TN serving Sumner County and Middle Tennessee. Basketball, flag football, soccer, SAQ, and strength training for ages 8-14.",
  path: "/youth-athletic-training-gallatin-tn",
});

export default function LocalSEOPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-[var(--color-brand-gold)]" />
              <p
                className="text-[var(--color-brand-gold)] text-sm font-semibold uppercase tracking-widest"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Gallatin, Tennessee
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.05]">
              Youth Athletic Training in{" "}
              <span className="text-[var(--color-brand-gold)]">
                Gallatin, TN
              </span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed mb-10">
              The Academy is Gallatin and Sumner County&apos;s premier youth
              athletic development program. We build complete athletes through
              multi-sport training, SAQ development, and strength conditioning
              for young athletes across Middle Tennessee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/get-started"
                className="btn-primary text-lg px-10 py-4"
              >
                Free Assessment
                <ArrowRight size={20} />
              </Link>
              {CONTACTS.map((c) => (
                <a
                  key={c.name}
                  href={`tel:${c.phoneRaw}`}
                  className="btn-secondary text-lg px-8 py-4"
                >
                  {c.name}: {c.phone}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Programs Overview */}
      <section className="py-24 md:py-32 section-light">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Training Programs in{" "}
              <span className="text-[var(--color-brand-gold-dark)]">
                Gallatin
              </span>
            </h2>
            <p className="text-lg text-[var(--color-brand-gray)] max-w-2xl mx-auto">
              Youth basketball training, flag football development, soccer
              skills, and multi-sport SAQ conditioning for athletes in Sumner
              County and the greater Nashville area.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PROGRAMS.map((program) => (
              <div
                key={program.slug}
                className="bg-white rounded-xl border border-[var(--color-brand-gray-light)] p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-150"
              >
                <h3 className="text-xl font-bold mb-2">
                  {program.shortName}
                </h3>
                <p className="text-[var(--color-brand-gray)] text-sm leading-relaxed mb-4">
                  {program.description}
                </p>
                <p className="text-xs text-[var(--color-brand-gray)]/70 mb-1">
                  {program.schedule}
                </p>
                <p className="text-xs text-[var(--color-brand-gray)]/70 mb-4">
                  Ages: {program.ages}
                </p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-bold text-[var(--color-brand-gold-dark)]">
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
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Local Families Choose Us */}
      <section className="py-24 md:py-32 section-gray">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Gallatin Families Choose{" "}
              <span className="text-[var(--color-brand-gold-dark)]">
                The Academy
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              "Structured, elite athletic development — not just seasonal rec leagues",
              "Multi-sport approach that builds complete athletes, not just sport-specific players",
              "Experienced coaches who know Sumner County youth athletics",
              "Small group sizes (6-8 athletes) for individualized attention",
              "Baseline and post-performance testing with measurable results",
              "Outdoor training on real surfaces where sports are actually played",
              "Affordable drop-in option at $10/session for Skills Lab",
              "Convenient Gallatin location serving families across Middle Tennessee",
            ].map((reason, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white rounded-xl border border-[var(--color-brand-gray-light)] p-6"
              >
                <CheckCircle className="w-5 h-5 text-[var(--color-brand-gold)] shrink-0 mt-0.5" />
                <p className="text-[var(--color-brand-gray-dark)] leading-relaxed">
                  {reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — Dark background with gold accents */}
      <section className="py-24 md:py-32" style={{ background: "var(--color-brand-dark, #1A1A1A)" }}>
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              What Gallatin Parents{" "}
              <span className="text-[var(--color-brand-gold-dark)]">Say</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-6 md:p-8 flex flex-col"
              >
                <span className="text-4xl font-serif leading-none mb-3 select-none" style={{ color: "var(--color-brand-orange, #E8722A)" }}>&ldquo;</span>
                <blockquote className="text-white/80 text-sm leading-relaxed flex-grow">
                  {t.quote}
                </blockquote>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="font-semibold text-sm text-white">
                    {t.author}
                  </p>
                  {"detail" in t && (
                    <p className="text-white/50 text-xs mt-0.5">
                      {(t as any).detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaches */}
      <section className="py-24 md:py-32 section-gray">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your{" "}
              <span className="text-[var(--color-brand-gold-dark)]">
                Coaches
              </span>
            </h2>
            <p className="text-lg text-[var(--color-brand-gray)] max-w-2xl mx-auto">
              Experienced coaches who are invested in Gallatin and Sumner County
              youth athletics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {COACHES.map((coach) => (
              <div
                key={coach.name}
                className="bg-white rounded-xl border border-[var(--color-brand-gray-light)] p-8"
              >
                <h3 className="text-2xl font-bold mb-1">{coach.name}</h3>
                <p className="text-[var(--color-brand-gold-dark)] font-semibold text-sm mb-4">
                  {coach.title}
                </p>
                <blockquote className="text-lg italic mb-4 leading-relaxed">
                  &ldquo;{coach.quote}&rdquo;
                </blockquote>
                <p className="text-[var(--color-brand-gray)] text-sm leading-relaxed mb-4">
                  {coach.bio}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {coach.focus.map((f) => (
                    <span
                      key={f}
                      className="text-xs px-2.5 py-1 bg-[var(--color-brand-gold)]/5 text-[var(--color-brand-gray)] rounded-md border border-[var(--color-brand-gold)]/10"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Areas & Schools */}
      <section className="py-24 md:py-32 section-light">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16">
              {/* Service Areas */}
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  Areas We{" "}
                  <span className="text-[var(--color-brand-gold-dark)]">
                    Serve
                  </span>
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed mb-6">
                  Based in Gallatin, Tennessee, we train athletes from across
                  Sumner County, Hendersonville, and the greater Middle
                  Tennessee region.
                </p>
                <ul className="space-y-3">
                  {SERVICE_AREAS.map((area) => (
                    <li key={area} className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-[var(--color-brand-gold)] shrink-0" />
                      <span className="text-[var(--color-brand-gray-dark)] font-medium">
                        {area}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trusted Schools */}
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  Trusted by Athletes{" "}
                  <span className="text-[var(--color-brand-gold-dark)]">
                    From
                  </span>
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed mb-6">
                  Athletes from these Sumner County and Middle Tennessee schools
                  train with us.
                </p>
                <ul className="space-y-3">
                  {TRUSTED_SCHOOLS.map((school) => (
                    <li key={school} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-[var(--color-brand-gold)] shrink-0" />
                      <span className="text-[var(--color-brand-gray-dark)] font-medium">
                        {school}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start Training in{" "}
            <span className="text-[var(--color-brand-gold)]">
              Gallatin Today
            </span>
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join families across Gallatin, Hendersonville, and Sumner County who
            trust The Academy for youth athletic development. Get started with a
            free assessment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/get-started"
              className="btn-primary text-lg px-10 py-4"
            >
              Free Assessment
              <ArrowRight size={20} />
            </Link>
            {CONTACTS.map((c) => (
              <a
                key={c.name}
                href={`tel:${c.phoneRaw}`}
                className="btn-secondary text-lg px-8 py-4"
              >
                {c.name}: {c.phone}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
