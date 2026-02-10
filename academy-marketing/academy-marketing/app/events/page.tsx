import Link from "next/link";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Events",
  description: `Upcoming events, combine preps, and speed testing days at ${SITE_CONFIG.name} in Gallatin, TN.`,
  path: "/events",
});

// TODO: Replace with dynamic data from CMS or database
// Each event MUST have its own unique URL for Event schema to work
const UPCOMING_EVENTS = [
  {
    slug: "spring-speed-testing-march-2026",
    title: "Spring Speed Testing Day",
    date: "2026-03-15",
    time: "9:00 AM – 12:00 PM",
    description:
      "Free community speed testing event. All athletes ages 7–18 welcome. Get your 40-yard dash, pro agility, and vertical jump tested by Academy coaches. Results provided on-site.",
    category: "Testing",
    isFree: true,
  },
  {
    slug: "summer-combine-prep-june-2026",
    title: "Summer Combine Prep Camp",
    date: "2026-06-07",
    time: "8:00 AM – 11:00 AM (3 days: June 7–9)",
    description:
      "Three-day intensive camp focused on combine performance: 40-yard dash technique, shuttle drills, vertical jump mechanics, and position-specific agility. Limited to 20 athletes.",
    category: "Camp",
    isFree: false,
  },
  {
    slug: "fall-kickoff-august-2026",
    title: "Fall Kickoff — Free Trial Week",
    date: "2026-08-18",
    time: "All regular session times",
    description:
      "Try any program free for one week. Skills Lab and Performance Lab sessions are open to new athletes at no cost. No registration required — just show up.",
    category: "Open House",
    isFree: true,
  },
];

export default function EventsPage() {
  return (
    <>
      {/* Hero */}
      <section className="section-dark pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="font-display text-sm font-semibold tracking-wider text-[var(--color-brand-gold)] uppercase">
              Events
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold text-[var(--color-brand-white)] sm:text-5xl">
              Upcoming events and testing days.
            </h1>
            <p className="mt-6 text-lg text-[var(--color-text-on-dark-secondary)]">
              Speed testing events, combine prep camps, and open house sessions. Many
              are free — a great way to experience Academy coaching before committing.
            </p>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="bg-[var(--color-surface)] py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8">
            {UPCOMING_EVENTS.map((event) => (
              <Link
                key={event.slug}
                href={`/events/${event.slug}`}
                className="group rounded-2xl border border-[var(--color-neutral-200)] p-8 transition-all hover:border-[var(--color-brand-gold)]/40 hover:shadow-md"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  {/* Date Badge */}
                  <div className="flex shrink-0 flex-col items-center rounded-xl bg-[var(--color-surface-dark)] p-4 text-center md:w-24">
                    <span className="font-display text-sm font-semibold text-[var(--color-brand-gold)]">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </span>
                    <span className="font-display text-3xl font-bold text-[var(--color-brand-white)]">
                      {new Date(event.date).getDate()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-gold-dark)]">
                        {event.title}
                      </h2>
                      {event.isFree && (
                        <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">
                          Free
                        </span>
                      )}
                      <span className="rounded-full bg-[var(--color-neutral-100)] px-3 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                        {event.category}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {event.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(event.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {SITE_CONFIG.address.city}, {SITE_CONFIG.address.state}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="hidden h-5 w-5 shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-brand-gold)] md:block" />
                </div>
              </Link>
            ))}
          </div>

          {/* No more events */}
          <div className="mt-12 rounded-xl border-2 border-dashed border-[var(--color-neutral-200)] p-8 text-center">
            <p className="text-[var(--color-text-muted)]">
              More events will be announced throughout the year. Follow us on{" "}
              <a
                href={SITE_CONFIG.social.instagram}
                className="text-[var(--color-brand-gold)] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>{" "}
              for updates.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-dark py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-2xl font-bold text-[var(--color-brand-white)]">
            Don&apos;t want to wait for an event?
          </h2>
          <p className="mt-3 text-[var(--color-text-on-dark-secondary)]">
            Book a free assessment anytime and get your athlete started this week.
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
