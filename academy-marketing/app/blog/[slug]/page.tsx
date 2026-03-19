import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, User, Calendar } from "lucide-react";
import { generatePageMetadata } from "@/lib/metadata";
import { BreadcrumbJsonLd } from "@/lib/structured-data";
import { BLOG_POSTS } from "@/lib/blog-data";
import { SITE } from "@/lib/config";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};

  return generatePageMetadata({
    title: `${post.title} — ${SITE.name} Blog`,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
  });
}

function ArticleJsonLd({ post }: { post: (typeof BLOG_POSTS)[number] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author,
      affiliation: { "@type": "Organization", name: SITE.name },
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: { "@type": "ImageObject", url: `${SITE.url}${SITE.logo}` },
    },
    mainEntityOfPage: `${SITE.url}/blog/${post.slug}`,
    articleSection: post.category,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Render markdown-like body content with ## headings and paragraphs */
function ArticleBody({ content }: { content: string }) {
  const blocks = content.split("\n\n").filter(Boolean);

  return (
    <div className="prose prose-lg max-w-none">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="text-2xl font-bold mt-10 mb-4 text-[var(--color-brand-black)]"
            >
              {trimmed.replace("## ", "")}
            </h2>
          );
        }
        return (
          <p
            key={i}
            className="text-[var(--color-brand-gray)] leading-relaxed mb-4"
          >
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <>
      <ArticleJsonLd post={post} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title, href: `/blog/${post.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="py-24 md:py-32 section-dark">
        <div className="container">
          <div className="max-w-3xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-white/60 hover:text-[var(--color-brand-gold)] transition-colors text-sm mb-8"
            >
              <ArrowLeft size={16} />
              Back to Blog
            </Link>
            <span className="inline-block px-3 py-1 bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold)] text-xs font-semibold rounded-full border border-[var(--color-brand-gold)]/20 mb-6">
              {post.category}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-white/60 text-sm">
              <span className="flex items-center gap-2">
                <User size={14} />
                {post.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={14} />
                {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={14} />
                {post.readTime}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Article Body */}
      <section className="py-16 md:py-24 section-light">
        <div className="container">
          <article className="max-w-3xl mx-auto">
            <ArticleBody content={post.body} />
          </article>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 md:py-24 section-gray">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">
              More from the Blog
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="bg-white rounded-xl border border-[var(--color-brand-gray-light)] p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-150"
                >
                  <span className="inline-block px-3 py-1 bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold-dark)] text-xs font-semibold rounded-full border border-[var(--color-brand-gold)]/20 mb-4">
                    {related.category}
                  </span>
                  <h3 className="text-lg font-bold mb-2 leading-tight">
                    {related.title}
                  </h3>
                  <p className="text-[var(--color-brand-gray)] text-sm leading-relaxed mb-3">
                    {related.excerpt}
                  </p>
                  <span className="text-xs text-[var(--color-brand-gray)]">
                    {related.readTime} &bull; {related.author}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 md:py-24 section-dark">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Put These{" "}
            <span className="text-[var(--color-brand-gold)]">Tips</span> Into
            Action?
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join The Academy and train with coaches who develop complete
            athletes every day.
          </p>
          <Link href="/get-started" className="btn-primary text-lg px-10 py-4">
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
