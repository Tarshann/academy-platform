// ⚡ SINGLE SOURCE OF TRUTH — all business data lives here
// Update this file when business info changes; every page reads from here.

export const SITE = {
  name: "The Academy",
  tagline: "Build Complete Athletes. Not Just Better Players.",
  description:
    "Youth athletic training in Gallatin, TN. Basketball, flag football, and soccer development with SAQ, strength, and skill training.",
  url: "https://academytn.com",
  foundingYear: 2021,
  logo: "/images/logo.png",
  ogImage: "/images/og-default.jpg",
};

export const CONTACT = {
  phone: "(571) 292-0633",
  phoneRaw: "+15712920633",
  email: "omarphilmore@yahoo.com",
  smsBody: "Hi, I'm interested in The Academy programs",
};

export const ADDRESS = {
  locality: "Gallatin",
  region: "TN",
  country: "US",
  full: "Gallatin, Tennessee",
  geo: { lat: 36.3884, lng: -86.4467 },
};

export const SOCIAL = {
  facebook: "https://www.facebook.com/share/1DY8v2AEuN/?mibextid=wwXIfr",
  instagram: "https://www.instagram.com/the_academytn",
  tiktok: "https://www.tiktok.com/@academytn",
};

export const SOCIAL_URLS = [SOCIAL.facebook, SOCIAL.instagram, SOCIAL.tiktok];

export const PROGRAMS = [
  {
    slug: "performance-lab",
    name: "Academy Performance Lab",
    label: "Membership",
    shortName: "Performance Lab",
    price: "$245",
    priceRaw: 245,
    unit: "per month",
    schedule: "Tue & Thu 7:00–8:00 PM • Sun 11:00 AM–12:00 PM",
    scheduleDays: ["Tuesday", "Thursday", "Sunday"],
    ages: "8–14",
    groupSize: "6–8 athletes per group",
    description:
      "Year-round structured development with SAQ training, strength conditioning, and sport-specific skills.",
    longDescription:
      "Our flagship program for committed athletes. Three sessions per week with baseline testing, 90-day progress cycles, and individualized coaching. We build speed, agility, quickness, and strength through a structured curriculum designed for long-term athletic development.",
    outcomes: [
      "Measurable speed and agility gains (tested every 90 days)",
      "Improved strength and conditioning baseline",
      "Sport-specific skill development across basketball, flag football, and soccer",
      "Mental toughness and competitive confidence",
      "Athletic foundation that transfers across all sports",
    ],
    features: [
      "3 sessions per week",
      "Baseline testing on entry",
      "90-day progress cycles with retesting",
      "Capped group sizes (6–8 athletes)",
      "Individualized coaching within group setting",
      "Multi-sport SAQ curriculum",
    ],
    faq: [
      {
        q: "What age range is Performance Lab for?",
        a: "Performance Lab is designed for athletes ages 8–14. We group athletes by age and ability level to ensure appropriate training intensity.",
      },
      {
        q: "Is there a contract?",
        a: "Performance Lab is a monthly membership at $245/month. There is no long-term contract, but this program is designed for athletes who are committed to consistent, year-round training.",
      },
      {
        q: "What about siblings?",
        a: "Sibling athletes receive a discount. Each athlete must be between ages 8–14.",
      },
      {
        q: "What sports do you train?",
        a: "We take a multi-sport approach: speed, agility, quickness, strength, coordination, and competitive games. We build complete athletes, not just sport-specific skills.",
      },
      {
        q: "How do I know if my child is improving?",
        a: "Every athlete is baseline tested on entry, then retested every 90 days. You'll see measurable progress in speed, agility, and strength benchmarks.",
      },
    ],
    cta: "Apply for Performance Lab",
    ctaHref: "/get-started",
  },
  {
    slug: "skills-lab",
    name: "Academy Skills Lab",
    label: "Drop-In",
    shortName: "Skills Lab",
    price: "$10",
    priceRaw: 10,
    unit: "per session",
    schedule: "Tue & Thu 6:00–6:50 PM",
    scheduleDays: ["Tuesday", "Thursday"],
    ages: "All ages",
    description:
      "Community drop-in sessions for fundamentals, movement, and positive competition. All skill levels welcome.",
    longDescription:
      "Skills Lab is our open-access program where athletes of any age and skill level can come work on fundamentals. Each session includes movement warmups, skill stations, and competitive games. No commitment required — just show up and train.",
    outcomes: [
      "Improved movement fundamentals and coordination",
      "Exposure to structured training environment",
      "Positive competition and teamwork skills",
      "Foundation for advancing to Performance Lab",
    ],
    features: [
      "Drop-in, no commitment",
      "All ages and skill levels welcome",
      "Movement fundamentals and skill stations",
      "Competitive games and drills",
      "Great introduction to The Academy coaching style",
    ],
    faq: [
      {
        q: "Do I need to register in advance?",
        a: "No registration needed. Just show up at the scheduled time, pay $10, and your athlete is ready to train.",
      },
      {
        q: "What age range is Skills Lab for?",
        a: "Skills Lab is open to all ages. We adjust activities to accommodate different skill levels within the session.",
      },
      {
        q: "What should my child wear/bring?",
        a: "Athletic clothes, basketball shoes or cleats depending on the surface, and a water bottle. We provide all training equipment.",
      },
    ],
    cta: "Drop In to Skills Lab",
    ctaHref: "/get-started",
  },
  {
    slug: "private-training",
    name: "Private Training",
    label: "1-on-1 Coaching",
    shortName: "Private Training",
    price: "$60",
    priceRaw: 60,
    unit: "per session",
    schedule: "By appointment",
    scheduleDays: [],
    ages: "All ages",
    description:
      "One-on-one sessions with Coach Mac or Coach O. Personalized plans for sport-specific goals and athletic development.",
    longDescription:
      "Private training sessions are tailored entirely to your athlete's specific goals. Whether it's tryout prep, position-specific work, or accelerated development, our coaches build a personalized plan and work 1-on-1 to execute it.",
    outcomes: [
      "Personalized development plan for your athlete's specific goals",
      "Accelerated skill development with undivided coaching attention",
      "Position-specific and sport-specific training",
      "Tryout preparation and competitive readiness",
    ],
    features: [
      "1-on-1 with Coach Mac or Coach O",
      "Fully personalized training plan",
      "Flexible scheduling by appointment",
      "Sport-specific and position-specific focus",
      "Great for tryout prep or accelerated development",
    ],
    faq: [
      {
        q: "How do I book a private session?",
        a: "Contact us to schedule. We'll discuss your athlete's goals and match them with the right coach.",
      },
      {
        q: "How long are private sessions?",
        a: "Private sessions are typically 60 minutes, focused entirely on your athlete's development goals.",
      },
    ],
    cta: "Book a Private Session",
    ctaHref: "/get-started",
  },
];

export const COACHES = [
  {
    name: "Coach Mac",
    title: "Lead Trainer",
    photo: "/images/coach-mac.jpg",
    quote:
      "Every athlete deserves a foundation that lasts beyond one sport.",
    bio: "With over a decade of experience in multi-sport athletic development, Coach Mac specializes in building complete athletes through SAQ training, strength conditioning, and sport-specific skill development.",
    focus: ["SAQ & Movement", "Strength Building", "Sport Transfer"],
  },
  {
    name: "Coach O",
    title: "Lead Trainer",
    photo: "/images/coach-o.jpg",
    quote:
      "We build confidence through competence. Master the fundamentals, and everything else follows.",
    bio: "Coach O brings expertise in basketball, flag football, and soccer development. His approach focuses on building athletic foundations that translate across all sports while developing mental toughness and game IQ.",
    focus: ["Confidence Building", "Game IQ", "Mental Toughness"],
  },
];

export const FOUNDERS = [
  {
    name: "Omar Philmore",
    title: "Co-Founder & Director",
    bio: "Boys Basketball Coach at Sumner Academy. Dedicated to developing young athletes through structured training and mentorship.",
    email: "omarphilmore@yahoo.com",
    phone: "(571) 292-0633",
  },
  {
    name: "Tarshann Washington",
    title: "Co-Founder & Director",
    bio: "Committed to creating opportunities for youth development through sport.",
    email: "Tarshann@gmail.com",
    phone: "(315) 542-6222",
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "We've seen more growth in our child's confidence and skill in a few months at The Academy than we did in years of other programs. The coaches truly teach the game\u2014footwork, decision-making, and fundamentals\u2014not just running plays. My child walks into the gym excited and leaves feeling accomplished every time.",
    author: "Academy Parent",
    rating: 5,
  },
  {
    quote:
      "What sets The Academy apart is the structure and intention behind every session. The coaches meet kids where they are, push them to improve, and genuinely care about their development on and off the court. It\u2019s not about wins\u2014it\u2019s about building confident, disciplined athletes. We couldn\u2019t ask for a better environment.",
    author: "Academy Parent",
    rating: 5,
  },
  {
    quote:
      "As a parent, I appreciate how organized and professional The Academy is\u2014from communication to training quality. My child has learned how to practice with purpose, compete the right way, and believe in themselves. You can tell this program is about long-term growth, not shortcuts.",
    author: "Academy Parent",
    rating: 5,
  },
];

export const TRUST_STATS = [
  { value: "10+", label: "Years Coaching", detail: "Development experience" },
  { value: "200+", label: "Athletes & Counting", detail: "Across Middle TN" },
  {
    value: "4",
    label: "Sports Supported",
    detail: "Basketball, flag football, football, soccer",
  },
];

export const SERVICE_AREAS = [
  "Gallatin",
  "Hendersonville",
  "Sumner County",
  "Portland",
  "White House",
  "Goodlettsville",
  "Madison",
];

export const TRUSTED_SCHOOLS = [
  "Sumner Academy",
  "Shafer Middle School",
  "Rucker Middle School",
  "Gallatin High School",
  "Liberty Creek Middle School",
  "Station Camp",
  "Stratford High School",
];

export const FAQ = [
  {
    q: "What ages do you serve?",
    a: "Performance Lab is for athletes ages 8\u201314. Skills Lab and Private Training are open to all ages.",
  },
  {
    q: "Where are you located?",
    a: "We train in Gallatin, Tennessee, serving families across Sumner County and Middle TN.",
  },
  {
    q: "What sports do you train for?",
    a: "We take a multi-sport approach covering basketball, flag football, football, and soccer. Our SAQ and strength training builds athletic foundations that transfer across all sports.",
  },
  {
    q: "How much does it cost?",
    a: "Skills Lab is $10 per drop-in session. Performance Lab is $245/month for 3 sessions per week. Private Training is $60 per session.",
  },
  {
    q: "Do you offer free trials or assessments?",
    a: "Yes! We offer free assessments where we evaluate your athlete\u2019s current speed, agility, and movement quality and recommend a starting point.",
  },
  {
    q: "Is there a contract for Performance Lab?",
    a: "No long-term contract. Performance Lab is a month-to-month membership at $245/month.",
  },
  {
    q: "What should my child wear to a session?",
    a: "Athletic clothes, appropriate footwear (basketball shoes or cleats depending on the session), and a water bottle. We provide all training equipment.",
  },
  {
    q: "How do I get started?",
    a: "The easiest way is to take our quick assessment quiz or drop in to a Skills Lab session. You can also call us at (571) 292-0633.",
  },
];

export const OPENING_HOURS = [
  { day: "Tuesday", open: "18:00", close: "20:00" },
  { day: "Thursday", open: "18:00", close: "20:00" },
  { day: "Sunday", open: "11:00", close: "12:00" },
];
