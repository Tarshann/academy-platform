import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";
import { PROGRAMS, CONTACT } from "@/lib/config";
import { ServiceJsonLd, BreadcrumbJsonLd } from "@/lib/structured-data";
import ProgramFAQ from "./ProgramFAQ";

export function generateStaticParams() {
  return PROGRAMS.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = PROGRAMS.find((p) => p.slug === slug);
  if (!program) return {};

  return generatePageMetadata({
    title: `${program.name} — ${program.price}/${program.unit === "per month" ? "mo" : "session"}`,
    description: program.longDescription,
    path: `/programs/${program.slug}`,
  });
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = PROGRAMS.find((p) => p.slug === slug);
  if (!program) notFound();

  return (
    <>
      <ServiceJsonLd
        name={program.name}
        description={program.longDescription}
        price={program.priceRaw}
        unit={program.unit}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Programs", href: "/programs" },
          { name: program.shortName, href: `/programs/${program.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container">
          <div className="max-w-3xl">
            <p
              className="text-[var(--color-brand-gold)] text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {program.label}
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              {program.shortName}
            </h1>
            <p className="text-xl text-white/70 leading-relaxed mb-8">
              {program.longDescription}
            </p>
            <div className="flex flex-wrap items-baseline gap-4 mb-8">
              <span className="text-4xl font-bold text-[var(--color-brand-gold)]">
                {program.price}
              </span>
              <span className="text-lg text-white/60">{program.unit}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/get-started"
                className="btn-primary text-lg px-10 py-4"
              >
                {program.cta}
                <ArrowRight size={20} />
              </Link>
              <a
                href={`tel:${CONTACT.phoneRaw}`}
                className="btn-secondary text-lg px-10 py-4"
              >
                Call {CONTACT.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Details Grid */}
      <section className="py-24 md:py-32 section-light">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 max-w-5xl mx-auto">
            {/* Schedule & Info */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Program Details</h2>

              <div className="space-y-6">
                <div className="bg-[var(--color-brand-gray-light)] rounded-xl p-6">
                  <p className="text-xs uppercase tracking-widest text-[var(--color-brand-gray)] font-semibold mb-2">
                    Schedule
                  </p>
                  <p className="text-lg font-semibold">{program.schedule}</p>
                </div>

                <div className="bg-[var(--color-brand-gray-light)] rounded-xl p-6">
                  <p className="text-xs uppercase tracking-widest text-[var(--color-brand-gray)] font-semibold mb-2">
                    Ages
                  </p>
                  <p className="text-lg font-semibold">{program.ages}</p>
                </div>

                {program.groupSize && (
                  <div className="bg-[var(--color-brand-gray-light)] rounded-xl p-6">
                    <p className="text-xs uppercase tracking-widest text-[var(--color-brand-gray)] font-semibold mb-2">
                      Group Size
                    </p>
                    <p className="text-lg font-semibold">{program.groupSize}</p>
                  </div>
                )}

                <div className="bg-[var(--color-brand-gray-light)] rounded-xl p-6">
                  <p className="text-xs uppercase tracking-widest text-[var(--color-brand-gray)] font-semibold mb-2">
                    Price
                  </p>
                  <p className="text-lg font-semibold">
                    {program.price}{" "}
                    <span className="text-[var(--color-brand-gray)] font-normal">
                      {program.unit}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h2 className="text-3xl font-bold mb-8">What&apos;s Included</h2>
              <ul className="space-y-4">
                {program.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--color-brand-gold)] shrink-0 mt-0.5" />
                    <span className="text-[var(--color-brand-gray-dark)]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-24 md:py-32 section-gray">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Your Athlete Will{" "}
              <span className="text-[var(--color-brand-gold-dark)]">Gain</span>
            </h2>
            <p className="text-lg text-[var(--color-brand-gray)]">
              Measurable results through structured, intentional training
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {program.outcomes.map((outcome, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[var(--color-brand-gray-light)] p-6 flex items-start gap-4"
              >
                <span className="w-8 h-8 rounded-full bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold-dark)] flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <p className="text-[var(--color-brand-gray-dark)] leading-relaxed">
                  {outcome}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaches Mention */}
      <section className="py-24 md:py-32 section-light">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Coached by{" "}
            <span className="text-[var(--color-brand-gold-dark)]">
              the Best
            </span>
          </h2>
          <p className="text-lg text-[var(--color-brand-gray)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Every session is led by experienced coaches who specialize in
            multi-sport athletic development. Our coaches build relationships
            with every athlete and tailor instruction to individual needs.
          </p>
          <Link href="/coaches" className="btn-secondary-dark px-8 py-3">
            Meet the Coaches
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      {program.faq.length > 0 && (
        <section className="py-24 md:py-32 section-gray">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
                Frequently Asked Questions
              </h2>
              <ProgramFAQ items={program.faq} />
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to{" "}
            <span className="text-[var(--color-brand-gold)]">Join?</span>
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Get started with a free assessment. We will evaluate your athlete
            and help you choose the right path.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/get-started"
              className="btn-primary text-lg px-10 py-4"
            >
              {program.cta}
              <ArrowRight size={20} />
            </Link>
            <a
              href={`tel:${CONTACT.phoneRaw}`}
              className="btn-secondary text-lg px-10 py-4"
            >
              Call {CONTACT.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
