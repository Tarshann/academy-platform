import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";
import { COACHES, FOUNDERS, CONTACT, CONTACTS } from "@/lib/config";

export const metadata = generatePageMetadata({
  title: "Coaches — Meet Your Trainers",
  description:
    "Meet the experienced coaches at The Academy. Dedicated to building complete athletes through multi-sport development in Gallatin, TN.",
  path: "/coaches",
});

export default function CoachesPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <p
            className="text-[var(--color-brand-gold)] text-sm font-semibold uppercase tracking-widest mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Our Team
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            Meet Your{" "}
            <span className="text-[var(--color-brand-gold)]">Coaches</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Experienced coaches dedicated to developing complete athletes, not
            just better players.
          </p>
        </div>
      </section>

      {/* Coach Cards */}
      <section className="py-24 md:py-32 section-light">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {COACHES.map((coach) => (
              <div
                key={coach.name}
                className="bg-white rounded-xl border border-[var(--color-brand-gray-light)] overflow-hidden hover:shadow-lg transition-shadow duration-150"
              >
                <div className="aspect-[4/3] bg-[var(--color-brand-gray-light)] relative overflow-hidden">
                  <img
                    src={coach.photo}
                    alt={`${coach.name} coaching athletes`}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand-black)]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <h2 className="text-3xl font-bold text-white">
                      {coach.name}
                    </h2>
                    <p className="text-white/80 text-lg">{coach.title}</p>
                  </div>
                </div>

                <div className="p-8">
                  {/* Quote */}
                  <div className="w-10 h-0.5 bg-[var(--color-brand-gold)] mb-5" />
                  <blockquote className="text-xl italic mb-6 leading-relaxed">
                    &ldquo;{coach.quote}&rdquo;
                  </blockquote>

                  {/* Bio */}
                  <p className="text-[var(--color-brand-gray)] leading-relaxed mb-6">
                    {coach.bio}
                  </p>

                  {/* Focus Areas */}
                  <div className="mb-6">
                    <p
                      className="text-[10px] uppercase tracking-widest text-[var(--color-brand-gray)]/70 font-medium mb-3"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Coaching Focus
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {coach.focus.map((f) => (
                        <span
                          key={f}
                          className="text-xs px-3 py-1.5 bg-[var(--color-brand-gold)]/5 text-[var(--color-brand-gray-dark)] rounded-lg border border-[var(--color-brand-gold)]/10 font-medium"
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
            ))}
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="py-24 md:py-32 section-gray">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Founded by Coaches Who{" "}
              <span className="text-[var(--color-brand-gold-dark)]">Care</span>
            </h2>
            <p className="text-lg text-[var(--color-brand-gray)] max-w-2xl mx-auto">
              The Academy was built from a shared belief: every young athlete
              deserves quality coaching, regardless of where they play.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {FOUNDERS.map((founder) => (
              <div
                key={founder.name}
                className="bg-white rounded-xl border border-[var(--color-brand-gray-light)] p-8"
              >
                <h3 className="text-2xl font-bold mb-1">{founder.name}</h3>
                <p className="text-[var(--color-brand-gold-dark)] font-semibold text-sm mb-4">
                  {founder.title}
                </p>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  {founder.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Train with{" "}
            <span className="text-[var(--color-brand-gold)]">Us</span>
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Book a private session or join one of our group training programs.
            Your athlete&apos;s development starts with the right coaching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/get-started"
              className="btn-primary text-lg px-10 py-4"
            >
              Book a Private Session
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
