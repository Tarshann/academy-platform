import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, Trophy, ArrowRight, Phone, ChevronRight } from 'lucide-react';
import { CONTACTS } from "@/lib/config";

export const metadata: Metadata = {
  title: 'Summer Camps 2026 — Basketball & Speed/Agility | The Academy',
  description: 'Academy Summer Camps at Sumner Academy. Basketball camp (June 1–5 & June 29–July 3) and Speed & Agility camp (June 8–12). Grades 2–12. Register now.',
  keywords: 'summer camp Gallatin TN, basketball camp Sumner County, speed agility camp youth, summer sports camp Tennessee, Academy basketball camp 2026',
  openGraph: {
    title: 'Summer Camps 2026 — Basketball & Speed/Agility',
    description: 'Academy Summer Camps at Sumner Academy. Basketball camp and Speed & Agility camp for grades 2–12. Register now.',
    url: 'https://academytn.com/events',
    siteName: 'The Academy',
    locale: 'en_US',
    images: [{
      url: 'https://academytn.com/images/training-photo-1.jpeg',
      width: 1200,
      height: 630,
      alt: 'Academy Summer Camps 2026',
    }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Summer Camps 2026 — Basketball & Speed/Agility',
    description: 'Academy Summer Camps at Sumner Academy. Basketball camp and Speed & Agility camp for grades 2–12. Register now.',
    images: ['https://academytn.com/images/training-photo-1.jpeg'],
  },
  alternates: {
    canonical: 'https://academytn.com/events',
  },
  robots: { index: true, follow: true },
};

const camps = [
  {
    id: 'basketball-week2',
    title: 'Academy Basketball Camp',
    subtitle: 'Week 2',
    dates: 'June 1–5, 2026',
    startDate: '2026-06-01',
    endDate: '2026-06-05',
    sessions: [
      { label: 'Morning Session', time: '8:00–11:00 AM', ages: 'High School' },
      { label: 'Afternoon Session', time: '12:00–3:00 PM', ages: 'Grades 2–9' },
    ],
    price: 185,
    location: 'Sumner Academy',
    icon: Trophy,
    color: 'var(--color-brand-gold)',
    description: 'Athletes work on the core skills every great player needs — ball handling, shooting, footwork, passing, spacing, and decision-making. Our coaches guide them in a structured, age-appropriate way.',
    includes: [
      'Dynamic warm-ups and basketball-specific movement',
      'Ball-handling and footwork drills',
      'Shooting fundamentals and game-speed reps',
      'Offensive and defensive skill development',
      'Small-sided games and competitive play',
    ],
    idealFor: 'Elementary through high school players at any level — beginners learning the game, intermediate players sharpening fundamentals, and athletes preparing for upcoming basketball seasons.',
  },
  {
    id: 'speed-agility-week3',
    title: 'Academy Speed & Agility Camp',
    subtitle: 'Week 3',
    dates: 'June 8–12, 2026',
    startDate: '2026-06-08',
    endDate: '2026-06-12',
    sessions: [
      { label: 'Afternoon Session', time: '12:00–3:00 PM', ages: 'Grades 2–9' },
    ],
    price: 185,
    location: 'Sumner Academy',
    icon: Trophy,
    color: 'var(--color-brand-gold)',
    description: 'Athletes learn how to accelerate, stop, change direction, and move efficiently while improving overall athletic performance — skills that transfer to every sport.',
    includes: [
      'Dynamic warm-ups and movement prep',
      'Speed and agility drills',
      'Footwork, balance, and coordination work',
      'Reaction and change-of-direction training',
      'Competitive games that reinforce skills',
    ],
    idealFor: 'Kids of all experience levels. Whether your child is new to sports or preparing for upcoming seasons, this camp builds confidence, improves movement, and develops faster, more prepared athletes.',
  },
  {
    id: 'basketball-week6',
    title: 'Academy Basketball Camp',
    subtitle: 'Week 6',
    dates: 'June 29–July 3, 2026',
    startDate: '2026-06-29',
    endDate: '2026-07-03',
    sessions: [
      { label: 'Morning Session', time: '8:00–11:00 AM', ages: 'High School' },
      { label: 'Afternoon Session', time: '12:00–3:00 PM', ages: 'Grades 2–9' },
    ],
    price: 185,
    location: 'Sumner Academy',
    icon: Trophy,
    color: 'var(--color-brand-gold)',
    description: 'Same structured basketball development as Week 2 — a second opportunity for families with different summer schedules. Players leave with better skills, higher basketball IQ, and greater confidence.',
    includes: [
      'Dynamic warm-ups and basketball-specific movement',
      'Ball-handling and footwork drills',
      'Shooting fundamentals and game-speed reps',
      'Offensive and defensive skill development',
      'Small-sided games and competitive play',
    ],
    idealFor: 'Athletes who missed Week 2 or want a second week of intensive development. Great for players preparing for school or fall basketball seasons.',
  },
];

// JSON-LD Event structured data
function generateEventJsonLd() {
  return camps.map((camp) => ({
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${camp.title} — ${camp.subtitle}`,
    description: camp.description,
    startDate: camp.startDate,
    endDate: camp.endDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: 'Sumner Academy',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Gallatin',
        addressRegion: 'TN',
        addressCountry: 'US',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'The Academy',
      url: 'https://academytn.com',
    },
    offers: {
      '@type': 'Offer',
      price: camp.price.toString(),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: '2026-02-01',
      url: 'https://www.sumneracademy.org/form/~form-uuid/a8523700-e262-4c18-b1fa-e3897161a4ec',
    },
    performer: {
      '@type': 'Organization',
      name: 'The Academy',
    },
  }));
}

export default function EventsPage() {
  const events = generateEventJsonLd();

  return (
    <>
      {/* Event JSON-LD */}
      {events.map((event, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(event) }}
        />
      ))}

      {/* Hero */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--color-brand-gold)]/10 border border-[var(--color-brand-gold)]/30 rounded-full px-5 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[var(--color-brand-gold)] text-sm font-semibold uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
              Registration Open
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            Summer Camps{' '}
            <span className="text-[var(--color-brand-gold)]">2026</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-4">
            Three weeks of structured athletic development at Sumner Academy.
            Basketball and Speed &amp; Agility camps for grades 2–12.
          </p>
          <p className="text-white/50 text-sm">
            Registration closes May 15, 2026 &bull; Spots are limited
          </p>
        </div>
      </section>

      {/* Quick Overview Bar */}
      <section className="bg-[var(--color-brand-gold)] py-5">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-[var(--color-brand-black)]">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}>
                3 CAMP WEEKS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}>
                SUMNER ACADEMY, GALLATIN
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}>
                GRADES 2–12
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                $185
              </span>
              <span className="text-sm font-medium opacity-80">per week</span>
            </div>
          </div>
        </div>
      </section>

      {/* Camp Cards */}
      <section className="py-24 md:py-32 section-light">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Camp Schedule</h2>
            <p className="text-lg text-[var(--color-brand-gray)] max-w-2xl mx-auto leading-relaxed">
              Each camp runs Monday through Friday with age-grouped sessions.
              Players are coached by Academy trainers Coach Mac and Coach O.
            </p>
          </div>

          <div className="space-y-12 max-w-4xl mx-auto">
            {camps.map((camp) => {
              const Icon = camp.icon;
              return (
                <div
                  key={camp.id}
                  id={camp.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  {/* Camp Header */}
                  <div className="bg-[var(--color-brand-black)] px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `color-mix(in srgb, ${camp.color} 20%, transparent)` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: camp.color }} />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-[var(--color-brand-white)]" style={{ fontFamily: 'var(--font-display)' }}>
                          {camp.title}
                        </h3>
                        <p className="text-white/60 text-sm" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                          {camp.subtitle} &bull; {camp.dates}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[var(--color-brand-gold)]" style={{ fontFamily: 'var(--font-display)' }}>
                        ${camp.price}
                      </span>
                      <span className="text-white/50 text-sm">per week</span>
                    </div>
                  </div>

                  {/* Camp Body */}
                  <div className="px-8 py-8">
                    <p className="text-[var(--color-brand-gray)] leading-relaxed mb-8">
                      {camp.description}
                    </p>

                    {/* Sessions */}
                    <div className="mb-8">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-brand-black)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                        Sessions
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {camp.sessions.map((session, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 bg-gray-50 rounded-xl px-5 py-4"
                          >
                            <Clock className="w-5 h-5 text-[var(--color-brand-gold)] mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-[var(--color-brand-black)] text-sm">
                                {session.label}
                              </p>
                              <p className="text-[var(--color-brand-gray)] text-sm">
                                {session.time} &bull; {session.ages}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* What's Included */}
                    <div className="mb-8">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-brand-black)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                        Each Day Includes
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {camp.includes.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: camp.color }} />
                            <span className="text-[var(--color-brand-gray)] text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ideal For */}
                    <div className="bg-gray-50 rounded-xl px-6 py-5 mb-6">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-brand-black)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        Ideal For
                      </h4>
                      <p className="text-[var(--color-brand-gray)] text-sm leading-relaxed">
                        {camp.idealFor}
                      </p>
                    </div>

                    {/* Register CTA */}
                    <a
                      href="https://www.sumneracademy.org/form/~form-uuid/a8523700-e262-4c18-b1fa-e3897161a4ec"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full text-center py-3.5 inline-flex items-center justify-center gap-2"
                    >
                      Register for {camp.subtitle}
                      <ArrowRight className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to Register */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How to{' '}
              <span className="text-[var(--color-brand-gold)]">Register</span>
            </h2>
            <p className="text-lg text-white/70 mb-12 leading-relaxed">
              Summer camps are hosted at Sumner Academy. Registration is handled
              through the school — contact us and we&#39;ll walk you through the process.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-brand-gold)]/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-[var(--color-brand-gold)] font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>1</span>
                </div>
                <h3 className="text-[var(--color-brand-white)] font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Contact Us
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Call or text to confirm which camp week and session fits your schedule.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-brand-gold)]/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-[var(--color-brand-gold)] font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>2</span>
                </div>
                <h3 className="text-[var(--color-brand-white)] font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Register Online
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Complete registration through{' '}
                  <a href="https://www.sumneracademy.org/form/~form-uuid/a8523700-e262-4c18-b1fa-e3897161a4ec" target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand-gold)] underline hover:no-underline">Sumner Academy&#39;s website</a>.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-brand-gold)]/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-[var(--color-brand-gold)] font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>3</span>
                </div>
                <h3 className="text-[var(--color-brand-white)] font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Show Up Ready
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Bring water, athletic shoes, and a positive attitude. We handle the rest.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://www.sumneracademy.org/form/~form-uuid/a8523700-e262-4c18-b1fa-e3897161a4ec"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-lg px-10 py-4 inline-flex items-center justify-center gap-2"
              >
                Register Now
                <ArrowRight className="w-5 h-5" />
              </a>
              <div className="flex flex-col sm:flex-row gap-3">
                {CONTACTS.map((c) => (
                  <a
                    key={c.name}
                    href={`tel:${c.phoneRaw}`}
                    className="btn-secondary text-base px-8 py-3 inline-flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    {c.name}: {c.phone}
                  </a>
                ))}
              </div>
            </div>
            <p className="text-white/40 text-sm mt-6">
              Registration closes May 15, 2026. Camp pricing is $185 per week
              ($20 facility/registration fee included).
            </p>
          </div>
        </div>
      </section>

      {/* Year-round CTA */}
      <section className="py-20 md:py-24 section-light">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Can&#39;t Wait Until Summer?
          </h2>
          <p className="text-lg text-[var(--color-brand-gray)] mb-8 max-w-2xl mx-auto leading-relaxed">
            Our year-round programs run every week. Drop in to Skills Lab
            or join Performance Lab and start building your athlete today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2" href="/programs">
              View Programs
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link className="btn-secondary text-lg px-10 py-4" href="/get-started">
              Free Assessment
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
