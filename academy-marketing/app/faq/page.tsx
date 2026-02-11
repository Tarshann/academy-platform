import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";
import { FAQ, CONTACT } from "@/lib/config";
import FAQAccordion from "./FAQAccordion";

export const metadata = generatePageMetadata({
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about The Academy youth athletic training programs, pricing, schedules, and more in Gallatin, TN.",
  path: "/faq",
});

export default function FAQPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <p
            className="text-[var(--color-brand-gold)] text-sm font-semibold uppercase tracking-widest mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Have Questions?
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            Frequently Asked{" "}
            <span className="text-[var(--color-brand-gold)]">Questions</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about our programs, pricing, and how to
            get started.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-24 md:py-32 section-light">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <FAQAccordion items={FAQ} />
          </div>
        </div>
      </section>

      {/* Still Have Questions CTA */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Still Have{" "}
            <span className="text-[var(--color-brand-gold)]">Questions?</span>
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            We are happy to answer anything. Reach out directly or take our
            quick assessment quiz to find the right program for your athlete.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/get-started"
              className="btn-primary text-lg px-10 py-4"
            >
              Get Started
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
