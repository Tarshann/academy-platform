import Link from "next/link";
import { ArrowRight, Clock, User, Calendar } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";
import { BreadcrumbJsonLd } from "@/lib/structured-data";
import { BLOG_POSTS } from "@/lib/blog-data";

export const metadata = generatePageMetadata({
  title: "Blog — Training Tips & Insights",
  description:
    "Training tips, insights, and articles from The Academy coaches. Youth athletic development resources for parents and athletes in Gallatin, TN.",
  path: "/blog",
});

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
        ]}
      />

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
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="bg-white rounded-xl border border-[var(--color-brand-gray-light)] overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-150 flex flex-col"
              >
                {/* Category Banner */}
                <div className="aspect-[16/9] bg-[var(--color-brand-gray-light)] relative flex items-center justify-center">
                  <span className="absolute top-4 left-4 inline-block px-3 py-1 bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold-dark)] text-xs font-semibold rounded-full border border-[var(--color-brand-gold)]/20">
                    {post.category}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-xl font-bold mb-3 leading-tight">
                    {post.title}
                  </h2>
                  <p className="text-[var(--color-brand-gray)] text-sm leading-relaxed mb-4 flex-grow">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--color-brand-gray-light)]">
                    <div className="flex items-center gap-3 text-xs text-[var(--color-brand-gray)]">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {post.author}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--color-brand-gold-dark)] font-semibold">
                      {formatDate(post.date)}
                    </span>
                  </div>
                </div>
              </Link>
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
