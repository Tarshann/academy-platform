import Link from "next/link";
import { ArrowRight, Zap, Users, Target, Shield, Heart } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";
import { OrganizationJsonLd } from "@/lib/structured-data";
import {
  SITE,
  PROGRAMS,
  COACHES,
  TESTIMONIALS,
  TRUST_STATS,
  TRUSTED_SCHOOLS,
  CONTACT,
} from "@/lib/config";
import { RevealSection } from "./HomepageClient";
import StickyCTA from "@/components/ui/StickyCTA";

export const metadata = generatePageMetadata({
  title: `${SITE.name} — Youth Athletic Training in Gallatin, TN`,
  description: SITE.description,
  path: "/",
});

const ICONS = [Zap, Users, Target];

const VALUES = [
  {
    title: "Fundamentals First",
    description:
      "Proper technique and athletic IQ are the foundation of every great player.",
    icon: Target,
  },
  {
    title: "Building Confidence",
    description:
      "An environment where confidence grows through skill mastery and positive reinforcement.",
    icon: Shield,
  },
  {
    title: "Long-Term Growth",
    description:
      "Sustainable development over short-term wins. Skills and character that last forever.",
    icon: Heart,
  },
];

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center section-dark clip-diagonal">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/training-photo-1.jpeg"
            alt="Academy basketball training session"
            className="absolute w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-black)]/90 via-[var(--color-brand-black)]/80 to-[var(--color-brand-gold)]/10" />
        <div className="container relative z-10 text-center py-32">
          <p
            className="text-[var(--color-brand-gold)] text-sm font-semibold uppercase tracking-widest mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Gallatin, TN &bull; Multi-Sport Development
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.05]">
            Build Complete Athletes.
            <br />
            <span className="text-[var(--color-brand-gold)]">
              Not Just Better Players.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            Multi-sport development &bull; SAQ Training &bull; Strength &bull;
            Confidence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/programs" className="btn-primary text-lg px-10 py-4">
              View Programs
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/get-started"
              className="btn-secondary text-lg px-10 py-4"
            >
              Free Assessment
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 md:py-20 border-b border-[var(--color-brand-gray-light)]">
        <div className="container">
          <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-8 md:gap-0">
            {TRUST_STATS.map((stat, i) => (
              <RevealSection key={i} delay={i + 1}>
                <div className="text-center px-8 md:px-12">
                  <p className="text-4xl md:text-5xl font-black text-[var(--color-brand-black)] mb-1">
                    {stat.value}
                  </p>
                  <p className="text-[var(--color-brand-gray)] text-xs font-semibold uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-[var(--color-brand-gray)]/50 text-[11px] mt-1">
                    {stat.detail}
                  </p>
                </div>
                {i < TRUST_STATS.length - 1 && (
                  <div className="hidden md:block w-px h-12 bg-[var(--color-brand-gray-light)] mx-4" />
                )}
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-24 md:py-32 section-light">
        <div className="container">
          <RevealSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Our Programs
            </h2>
            <p className="text-lg text-[var(--color-brand-gray)] max-w-2xl mx-auto">
              Choose the training path that fits your goals
            </p>
          </RevealSection>

          <div className="grid gap-8 max-w-5xl mx-auto md:grid-cols-3">
            {PROGRAMS.map((program, i) => {
              const Icon = ICONS[i] || Zap;
              return (
                <RevealSection key={program.slug} delay={i + 1}>
                  <div
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
                    <p className="text-[10px] uppercase tracking-widest text-[var(--color-brand-gray)]/70 font-medium mb-2" style={{ fontFamily: "var(--font-display)" }}>
                      {program.label}
                    </p>
                    <h3 className="text-xl font-bold mb-2">{program.shortName}</h3>
                    <p className="text-[var(--color-brand-gray)] text-sm leading-relaxed flex-grow">
                      {program.description}
                    </p>
                    {program.groupSize && (
                      <p className="text-[11px] text-orange-600 font-semibold mt-3">
                        Limited to {program.groupSize}
                      </p>
                    )}
                    <p className="text-[11px] text-[var(--color-brand-gray)]/60 mt-1">
                      Best for: <span className="text-[var(--color-brand-gray)]">{program.ages}</span>
                    </p>
                    <p className="text-[11px] text-[var(--color-brand-gray)]/60 mt-1 mb-4">
                      {program.schedule}
                    </p>
                    <div className="border-t border-[var(--color-brand-gray-light)] pt-6 mt-auto">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-[var(--color-brand-gold-dark)]">
                          {program.price}
                        </span>
                        <span className="text-sm text-[var(--color-brand-gray)]">
                          {program.unit}
                        </span>
                      </div>
                      <Link
                        href={`/programs/${program.slug}`}
                        className="btn-primary w-full text-center mt-4 text-sm py-3"
                      >
                        {program.cta}
                      </Link>
                    </div>
                  </div>
                </RevealSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Differentiator — Outdoor Training */}
      <section className="relative py-24 md:py-32 section-dark clip-diagonal-reverse">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/training-photo-2.jpeg"
            alt="Athletes training outdoors"
            loading="lazy"
            className="absolute w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <RevealSection>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                We Train <span className="text-[var(--color-brand-gold)]">Outside</span>. On Purpose.
              </h2>
              <p className="text-lg text-white/70 leading-relaxed max-w-2xl mx-auto mb-8">
                Our athletes train on grass, turf, and real surfaces — because that&apos;s where
                sports are played. The speed and agility built on an indoor gym floor
                doesn&apos;t transfer the same way. Training outdoors builds athletes who perform
                in real conditions and develops mental toughness.
              </p>
              <Link href="/get-started" className="btn-primary text-lg px-8 py-4">
                Book a Free Assessment
                <ArrowRight size={20} />
              </Link>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* Coaches */}
      <section className="py-24 md:py-32 section-gray">
        <div className="container">
          <RevealSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Meet Your Coaches
            </h2>
            <p className="text-lg text-[var(--color-brand-gray)] max-w-2xl mx-auto">
              Experienced coaches dedicated to developing complete athletes
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {COACHES.map((coach, i) => (
              <RevealSection key={coach.name} delay={i + 1}>
                <div className="bg-white rounded-xl border border-[var(--color-brand-gray-light)] overflow-hidden h-full">
                  <div className="aspect-[4/3] bg-[var(--color-brand-gray-light)] relative overflow-hidden">
                    <img
                      src={coach.photo}
                      alt={`${coach.name} instructing athletes`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand-black)]/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-6">
                      <h3 className="text-2xl font-bold text-white">{coach.name}</h3>
                      <p className="text-white/80">{coach.title}</p>
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <div className="w-10 h-0.5 bg-[var(--color-brand-gold)] mb-5" />
                    <blockquote className="text-lg italic mb-4 leading-relaxed">
                      &ldquo;{coach.quote}&rdquo;
                    </blockquote>
                    <p className="text-[var(--color-brand-gray)] text-sm leading-relaxed mb-4">
                      {coach.bio}
                    </p>
                    <div className="mb-5">
                      <p className="text-[10px] uppercase tracking-widest text-[var(--color-brand-gray)]/70 font-medium mb-2">
                        Coaching Focus
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
                    <Link
                      href="/get-started"
                      className="btn-primary w-full text-center text-sm py-3"
                    >
                      Book Private Session
                    </Link>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — Dark background with gold accents */}
      <section className="py-24 md:py-32" style={{ background: "var(--color-brand-dark, #1A1A1A)" }}>
        <div className="container">
          <RevealSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              What Parents Are Saying
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Real feedback from Academy families
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <RevealSection key={i} delay={i + 1}>
                <div className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-6 md:p-8 h-full flex flex-col">
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
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* School Credibility */}
      <section className="py-16 border-y border-[var(--color-brand-gray-light)]">
        <div className="container text-center">
          <p className="text-xs text-[var(--color-brand-gray)]/70 leading-relaxed">
            Trusted by athletes from{" "}
            {TRUSTED_SCHOOLS.map((school, i) => (
              <span key={school}>
                <span className="text-[var(--color-brand-gray)]">{school}</span>
                {i < TRUSTED_SCHOOLS.length - 1 ? ", " : ""}
              </span>
            ))}
            , and more across Sumner &amp; Davidson County.
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24 md:py-32 section-light">
        <div className="container">
          <RevealSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Our Philosophy
            </h2>
            <p className="text-xl text-[var(--color-brand-gray)] max-w-3xl mx-auto">
              A place where your child will be{" "}
              <span className="text-[var(--color-brand-gold-dark)] font-semibold">
                seen, developed, and supported
              </span>
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {VALUES.map((value, i) => (
              <RevealSection key={value.title} delay={i + 1}>
                <div className="bg-white rounded-xl border border-[var(--color-brand-gray-light)] p-8 text-center h-full hover:shadow-md hover:-translate-y-1 transition-all duration-150">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand-gold)]/10 flex items-center justify-center mx-auto mb-6">
                    <value.icon className="w-7 h-7 text-[var(--color-brand-gold)]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                  <p className="text-[var(--color-brand-gray)] leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <RevealSection>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your
              <br />
              <span className="text-[var(--color-brand-gold)]">
                Athletic Journey?
              </span>
            </h2>
            <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join families across Gallatin and Middle Tennessee who trust The
              Academy for their athlete&apos;s development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-started" className="btn-primary text-lg px-10 py-4">
                Get Started
              </Link>
              <a
                href={`tel:${CONTACT.phoneRaw}`}
                className="btn-secondary text-lg px-10 py-4"
              >
                Call {CONTACT.phone}
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      <StickyCTA />
    </>
  );
}
