import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Training Tips & Blog",
  description: `Training tips, athlete development insights, and youth sports resources from ${SITE_CONFIG.name} in Gallatin, TN.`,
  path: "/blog",
});

// TODO: Replace with dynamic data from CMS or MDX files
const BLOG_POSTS = [
  {
    slug: "improve-40-yard-dash",
    title: "5 Drills to Improve Your Athlete's 40-Yard Dash",
    excerpt:
      "Speed is trainable. Here are five drills we use at The Academy that translate directly to a faster 40 time — and they don't require any equipment.",
    date: "2026-02-01",
    readTime: "5 min",
    category: "Speed Training",
  },
  {
    slug: "best-age-start-training",
    title: "What's the Best Age to Start Athletic Training?",
    excerpt:
      "Parents ask us this every week. The answer isn't a single number — it depends on what kind of training you're talking about and what your goals are.",
    date: "2026-01-15",
    readTime: "4 min",
    category: "Parent Guide",
  },
  {
    slug: "outdoor-training-benefits",
    title: "Why We Train Outdoors (And Why It Matters for Your Athlete)",
    excerpt:
      "Indoor gyms are convenient. But sports happen on grass, turf, and uneven ground. Here's why outdoor training produces athletes who perform better on game day.",
    date: "2026-01-05",
    readTime: "6 min",
    category: "Training Philosophy",
  },
  {
    slug: "in-season-vs-offseason",
    title: "In-Season vs. Off-Season Training: What Parents Should Know",
    excerpt:
      "Should your athlete train during the season? The answer is yes — but the approach is completely different. Here's how we handle it.",
    date: "2025-12-20",
    readTime: "5 min",
    category: "Parent Guide",
  },
];

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="section-dark pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="font-display text-sm font-semibold tracking-wider text-[var(--color-brand-gold)] uppercase">
              Resources
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold text-[var(--color-brand-white)] sm:text-5xl">
              Training tips for parents and athletes.
            </h1>
            <p className="mt-6 text-lg text-[var(--color-text-on-dark-secondary)]">
              Practical insights on speed development, athletic training, and raising
              competitive young athletes.
            </p>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="bg-[var(--color-surface)] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {BLOG_POSTS.map((post) => (
              <article
                key={post.slug}
                className="group flex flex-col rounded-2xl border border-[var(--color-neutral-200)] p-8 transition-all hover:border-[var(--color-brand-gold)]/30 hover:shadow-md"
              >
                {/* Category */}
                <span className="inline-flex w-fit rounded-full bg-[var(--color-brand-gold)]/10 px-3 py-1 text-xs font-medium text-[var(--color-brand-gold)]">
                  {post.category}
                </span>

                {/* Title */}
                <h2 className="mt-4 font-display text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-gold-dark)]">
                  {/* TODO: Link to /blog/[slug] once individual post pages are built */}
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className="mt-6 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readTime} read
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Email Capture */}
      <section className="section-dark py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="font-display text-2xl font-bold text-[var(--color-brand-white)]">
            Get training tips in your inbox.
          </h2>
          <p className="mt-3 text-[var(--color-text-on-dark-secondary)]">
            Free drills, parent guides, and program updates. No spam — just useful
            content for families invested in their athlete&apos;s development.
          </p>
          {/* TODO: Wire to Resend email list */}
          <form className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-0">
            <input
              type="email"
              placeholder="parent@email.com"
              required
              className="flex-1 rounded-l-lg border-2 border-[var(--color-neutral-700)] bg-[var(--color-surface-dark-elevated)] px-4 py-3 text-[var(--color-brand-white)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand-gold)] focus:outline-none sm:rounded-r-none"
            />
            <button
              type="submit"
              className="btn-primary sm:rounded-l-none"
            >
              Subscribe
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Free download: &quot;5 Speed Drills Your Athlete Can Do at Home&quot; when you
            subscribe.
          </p>
        </div>
      </section>
    </>
  );
}
