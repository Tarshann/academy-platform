import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Blog — Training Tips & Insights",
  description:
    "Training tips, insights, and articles from The Academy coaches. Youth athletic development resources for parents and athletes in Gallatin, TN.",
  path: "/blog",
});

const ARTICLES = [
  {
    slug: "5-speed-drills-at-home",
    title: "5 Speed Drills Your Athlete Can Do at Home",
    excerpt:
      "No equipment needed. These five drills build foot speed, coordination, and explosiveness that translate directly to game-day performance.",
    category: "Training Tips",
    readTime: "4 min read",
    date: "Coming Soon",
  },
  {
    slug: "why-we-train-outside",
    title: "Why We Train Outside (On Purpose)",
    excerpt:
      "Indoor gyms are comfortable. But comfort does not build athletes. Here is why outdoor training produces better results and tougher competitors.",
    category: "Philosophy",
    readTime: "5 min read",
    date: "Coming Soon",
  },
  {
    slug: "is-your-child-ready-for-structured-training",
    title: "How to Know if Your Child is Ready for Structured Training",
    excerpt:
      "Not every kid is ready at the same time. Here are the signs that your young athlete is ready to move beyond recreational play into real development.",
    category: "Parent Guide",
    readTime: "6 min read",
    date: "Coming Soon",
  },
];

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <p
            className="text-[var(--color-brand-gold)] text-sm font-semibold uppercase tracking-widest mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            From the Coaches
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            Training{" "}
            <span className="text-[var(--color-brand-gold)]">Blog</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Tips, insights, and resources from our coaches to help your athlete
            develop on and off the field.
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="py-24 md:py-32 section-light">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {ARTICLES.map((article) => (
              <div
                key={article.slug}
                className="bg-white rounded-xl border border-[var(--color-brand-gray-light)] overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-150 flex flex-col"
              >
                {/* Image Placeholder */}
                <div className="aspect-[16/9] bg-[var(--color-brand-gray-light)] relative">
                  <div className="absolute top-4 left-4">
                    <span className="inline-block px-3 py-1 bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold-dark)] text-xs font-semibold rounded-full border border-[var(--color-brand-gold)]/20">
                      {article.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-xl font-bold mb-3 leading-tight">
                    {article.title}
                  </h2>
                  <p className="text-[var(--color-brand-gray)] text-sm leading-relaxed mb-4 flex-grow">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--color-brand-gray-light)]">
                    <div className="flex items-center gap-1 text-xs text-[var(--color-brand-gray)]">
                      <Clock size={12} />
                      {article.readTime}
                    </div>
                    <span className="text-xs text-[var(--color-brand-gold-dark)] font-semibold">
                      {article.date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Want Training{" "}
            <span className="text-[var(--color-brand-gold)]">Tips?</span>
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Follow us on social media for weekly drills, coaching insights, and
            updates from The Academy.
          </p>
          <Link href="/get-started" className="btn-primary text-lg px-10 py-4">
            Get Started
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
