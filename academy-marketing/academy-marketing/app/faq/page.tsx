import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FAQ_ITEMS, SITE_CONFIG } from "@/lib/config";
import { generatePageMetadata } from "@/lib/metadata";
import { FAQAccordion } from "./FAQAccordion";

export const metadata = generatePageMetadata({
  title: "Frequently Asked Questions",
  description: `Common questions about youth athletic training at ${SITE_CONFIG.name} in Gallatin, TN. Programs, pricing, schedule, and what to expect.`,
  path: "/faq",
});

export default function FAQPage() {
  return (
    <>
      {/* Hero */}
      <section className="section-dark pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold text-[var(--color-brand-white)] sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-6 text-lg text-[var(--color-text-on-dark-secondary)]">
              Everything parents ask before getting started. If you don&apos;t see your
              question here, call us at{" "}
              <a
                href={`tel:${SITE_CONFIG.phone.replace(/[^0-9+]/g, "")}`}
                className="text-[var(--color-brand-gold)] hover:underline"
              >
                {SITE_CONFIG.phone}
              </a>{" "}
              or book a free assessment — we&apos;ll answer everything in person.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="bg-[var(--color-surface)] py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FAQAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* CTA */}
      <section className="section-elevated py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
            Still have questions?
          </h2>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            The best way to get answers is to come see us. Book a free assessment and
            we&apos;ll walk you through everything.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/get-started" className="btn-primary">
              Book a Free Assessment
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={`tel:${SITE_CONFIG.phone.replace(/[^0-9+]/g, "")}`}
              className="btn-dark"
            >
              Call {SITE_CONFIG.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
