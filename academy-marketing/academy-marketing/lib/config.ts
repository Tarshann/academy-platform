// ============================================
// THE ACADEMY — Site Configuration
// Single source of truth for all business data
// ============================================

export const SITE_CONFIG = {
  name: "The Academy",
  tagline: "Youth Athletic Training in Gallatin, TN",
  description:
    "Elite youth multi-sport training focused on speed, agility, quickness, and strength development. Serving athletes in Gallatin, TN and Sumner County.",
  url: "https://academytn.com",
  domain: "academytn.com",

  // Contact
  phone: "(615) 555-0100", // UPDATE with real phone
  email: "info@academytn.com", // UPDATE with real email

  // Location
  address: {
    street: "123 Academy Way", // UPDATE with real address
    city: "Gallatin",
    state: "TN",
    zip: "37066",
    country: "US",
  },
  geo: {
    latitude: 36.3886,
    longitude: -86.4467,
  },

  // Social
  social: {
    facebook: "https://facebook.com/academytn", // UPDATE
    instagram: "https://instagram.com/academytn", // UPDATE
  },

  // Business
  founded: 2020, // UPDATE with actual year
  sportsSupported: ["Basketball", "Flag Football", "Football", "Soccer"],
  ageRange: { min: 7, max: 18 },

  // Schedule
  schedule: {
    skillsLab: { days: "Tuesday & Thursday", time: "6:00 PM – 7:00 PM" },
    performanceLab: {
      weekday: { days: "Tuesday & Thursday", time: "7:15 PM – 8:15 PM" },
      weekend: { days: "Sunday", time: "11:00 AM – 12:00 PM" },
    },
    privateTraining: { days: "By Appointment", time: "Flexible" },
  },
} as const;

export type Program = {
  slug: string;
  name: string;
  shortName: string;
  price: string;
  priceNote: string;
  description: string;
  longDescription: string;
  outcomes: string[];
  includes: string[];
  schedule: string;
  ages: string;
  ctaText: string;
  ctaHref: string;
  icon: string;
};

export const PROGRAMS: Program[] = [
  {
    slug: "performance-lab",
    name: "Academy Performance Lab",
    shortName: "Performance Lab",
    price: "$280",
    priceNote: "per month",
    description:
      "Our flagship program. Comprehensive athletic development combining speed, agility, strength, and sport-specific training in a structured monthly format.",
    longDescription:
      "Academy Performance Lab is where serious young athletes transform their game. This isn't a drop-in workout — it's a structured development program with baseline testing, progressive training cycles, and measurable results. Athletes train 3 days per week with coaches who track their progress and adjust programming to their individual needs and sport demands.",
    outcomes: [
      "Measurable speed improvement (40-yard dash, pro agility) within 90 days",
      "Increased functional strength and power output",
      "Sport-specific movement patterns refined for game transfer",
      "Confidence built through visible, tracked progress",
    ],
    includes: [
      "3 coached sessions per week (Tue/Thu + Sun)",
      "Baseline performance assessment on entry",
      "90-day progress retesting",
      "Individualized coaching within group setting",
      "Access to parent progress dashboard",
    ],
    schedule: "Tue & Thu 7:15–8:15 PM + Sun 11:00 AM–12:00 PM",
    ages: "Ages 10–18",
    ctaText: "Book a Free Assessment",
    ctaHref: "/get-started?program=performance-lab",
    icon: "Zap",
  },
  {
    slug: "skills-lab",
    name: "Academy Skills Lab",
    shortName: "Skills Lab",
    price: "$10",
    priceNote: "per session",
    description:
      "Low-commitment, high-value sessions focused on foundational athletic skills. Perfect for athletes exploring training or supplementing their team practice.",
    longDescription:
      "Skills Lab is the entry point to The Academy. Drop in for focused sessions that build the athletic foundation every sport demands — footwork, coordination, body control, and movement literacy. No long-term commitment required. Many families start here before moving into Performance Lab.",
    outcomes: [
      "Improved coordination, balance, and body control",
      "Foundational speed and agility mechanics",
      "Better movement patterns that reduce injury risk",
      "Exposure to structured athletic training in a supportive environment",
    ],
    includes: [
      "Drop-in access — pay per session",
      "Coached group sessions (max 15 athletes)",
      "Age-appropriate skill progressions",
      "No commitment required",
    ],
    schedule: "Tue & Thu 6:00–7:00 PM",
    ages: "Ages 7–18",
    ctaText: "Register for a Session",
    ctaHref: "/get-started?program=skills-lab",
    icon: "Target",
  },
  {
    slug: "private-training",
    name: "Private Training",
    shortName: "Private Training",
    price: "$60",
    priceNote: "per session",
    description:
      "One-on-one coaching tailored entirely to your athlete's goals, sport, position, and development stage.",
    longDescription:
      "Private Training delivers fully individualized attention. Whether your athlete needs to sharpen a specific skill for tryouts, recover from injury with guided movement work, or accelerate development beyond what group training provides, private sessions are designed around their exact needs. Sessions are scheduled by appointment and can focus on any combination of speed, agility, strength, or sport-specific skills.",
    outcomes: [
      "Fully customized training plan for your athlete's goals",
      "Accelerated development on specific weaknesses",
      "Flexible scheduling that works around team and school commitments",
      "Direct coach attention and real-time feedback every rep",
    ],
    includes: [
      "1-on-1 coached session (60 minutes)",
      "Custom programming based on athlete goals",
      "Flexible scheduling by appointment",
      "Session notes shared with parents",
    ],
    schedule: "By Appointment",
    ages: "Ages 7–18",
    ctaText: "Schedule a Session",
    ctaHref: "/get-started?program=private-training",
    icon: "User",
  },
];

export const COACHES = [
  {
    name: "Coach Name", // UPDATE
    title: "Head Performance Coach",
    bio: "With over a decade of experience developing youth athletes across multiple sports, Coach brings a science-backed approach to speed and agility training. Former collegiate athlete with certifications in youth strength and conditioning.",
    certifications: ["CSCS", "USAW Level 1", "CPR/AED"], // UPDATE
    sports: ["Basketball", "Football", "Soccer"],
    image: "/images/coach-1.jpg", // UPDATE with real photo
  },
  // Add more coaches as needed
];

export const FAQ_ITEMS = [
  {
    question: "What ages do you train?",
    answer:
      "We train athletes ages 7–18 across all programs. Skills Lab is open to all ages in that range. Performance Lab is best suited for athletes 10 and up who are ready for structured, progressive training.",
  },
  {
    question: "What should my athlete wear and bring?",
    answer:
      "Athletic clothing and clean athletic shoes (cleats for outdoor sessions if preferred). Bring a water bottle — we train hard and hydration matters. No special equipment is required.",
  },
  {
    question: "What if we need to miss a session?",
    answer:
      "Skills Lab is drop-in, so there's no penalty for missing a session. For Performance Lab members, we understand life happens — contact us if you'll be absent and we'll work with you on makeup opportunities.",
  },
  {
    question: "How is Performance Lab different from Skills Lab?",
    answer:
      "Skills Lab is drop-in focused on foundational athletic skills at $10/session. Performance Lab is our flagship monthly program ($280/mo) with 3 sessions per week, baseline testing, progress tracking, and individualized coaching. Most serious athletes are in Performance Lab; many start with Skills Lab to experience our coaching first.",
  },
  {
    question: "Is there a trial session or free assessment?",
    answer:
      "Yes. We offer a free assessment for any athlete interested in Performance Lab. This gives us a chance to evaluate your athlete's current level and gives your family a chance to experience our coaching firsthand. For Skills Lab, your first session is the trial — it's only $10 with no commitment.",
  },
  {
    question: "Do you train for specific sports or general athleticism?",
    answer:
      "Both. Our core programming builds the athletic qualities every sport demands — speed, agility, power, coordination. Within that framework, coaches tailor drills and movement patterns to each athlete's primary sport. We currently support basketball, flag football, football, and soccer.",
  },
  {
    question: "What does a typical session look like?",
    answer:
      "Every session follows a structured flow: dynamic warmup and activation, speed and agility work, strength and power development, and a cooldown. Sessions are coached the entire time — athletes are never left to figure it out on their own.",
  },
  {
    question: "What's your cancellation and refund policy?",
    answer:
      "Performance Lab memberships can be paused or cancelled with 30 days notice. Skills Lab and Private Training sessions are non-refundable but can be rescheduled with 24 hours notice. Contact us for details.",
  },
  {
    question: "Why do you train outdoors?",
    answer:
      "Because sports are played outdoors. Training on real surfaces — grass, turf, uneven terrain — builds athleticism that transfers directly to game situations. Your athlete won't perform on a rubberized gym floor during a game, so we don't train on one.",
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "My son's 40-yard dash dropped from 5.8 to 5.2 in his first 10 weeks. But more than the numbers, his confidence on the field is completely different.",
    name: "Parent Name", // UPDATE
    detail: "Parent of a 14-year-old football player",
    program: "Performance Lab",
  },
  {
    quote:
      "We started with Skills Lab just to try it out. Three weeks later my daughter asked to move to Performance Lab on her own. The coaches make it challenging but fun.",
    name: "Parent Name", // UPDATE
    detail: "Parent of an 11-year-old soccer player",
    program: "Skills Lab → Performance Lab",
  },
  {
    quote:
      "The private sessions gave my son exactly what he needed before basketball tryouts. Coach worked on his lateral quickness and it showed immediately in games.",
    name: "Parent Name", // UPDATE
    detail: "Parent of a 13-year-old basketball player",
    program: "Private Training",
  },
];
