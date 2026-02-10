import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";
import { CONTACT } from "@/lib/config";

export const metadata = generatePageMetadata({
  title: "Events — Camps, Clinics & Combines",
  description:
    "Upcoming camps, clinics, and combine events from The Academy. Youth athletic training events in Gallatin, TN and Sumner County.",
  path: "/events",
});

export default function EventsPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <p
            className="text-[var(--color-brand-gold)] text-sm font-semibold uppercase tracking-widest mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Upcoming Events
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            Camps, Clinics &{" "}
            <span className="text-[var(--color-brand-gold)]">Combines</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Special events for athletes looking to level up their game.
          </p>
        </div>
      </section>

      {/* Events Placeholder */}
      <section className="py-24 md:py-32 section-light">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-[var(--color-brand-gold)]/10 flex items-center justify-center mx-auto mb-8">
              <Calendar className="w-10 h-10 text-[var(--color-brand-gold)]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Events Coming Soon
            </h2>
            <p className="text-lg text-[var(--color-brand-gray)] leading-relaxed mb-4">
              Check back for upcoming camps, clinics, and combine events. We
              host seasonal events throughout the year for athletes of all ages
              and skill levels.
            </p>
            <p className="text-[var(--color-brand-gray)] mb-10">
              Want to be the first to know?{" "}
              <a
                href={`tel:${CONTACT.phoneRaw}`}
                className="text-[var(--color-brand-gold-dark)] font-semibold hover:underline"
              >
                Contact us
              </a>{" "}
              to get on our notification list.
            </p>
          </div>
        </div>
      </section>

      {/* Meanwhile CTA */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            In the{" "}
            <span className="text-[var(--color-brand-gold)]">Meantime</span>
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Our weekly training programs run year-round. Drop in to Skills Lab
            or join Performance Lab and start building your athlete today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/programs"
              className="btn-primary text-lg px-10 py-4"
            >
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
    </>
  );
}
