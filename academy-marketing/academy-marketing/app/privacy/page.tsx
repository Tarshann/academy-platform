import { SITE_CONFIG } from "@/lib/config";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Privacy Policy",
  description: `Privacy policy for ${SITE_CONFIG.name}.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <section className="pt-32 pb-20 lg:pt-40">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="mt-8 space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            {SITE_CONFIG.name} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the {SITE_CONFIG.domain} website.
            This page informs you of our policies regarding the collection, use, and
            disclosure of personal information when you use our service.
          </p>

          <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] pt-4">
            Information We Collect
          </h2>
          <p>
            We collect information you provide directly when you register for programs,
            book assessments, or contact us. This may include your name, email address,
            phone number, and your athlete&apos;s name and age.
          </p>

          <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] pt-4">
            How We Use Your Information
          </h2>
          <p>
            We use collected information to provide and improve our training programs,
            communicate with you about scheduling and billing, and send relevant
            training resources if you opt in to our email list.
          </p>

          <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] pt-4">
            Analytics
          </h2>
          <p>
            We use Google Analytics and similar tools to understand how visitors use our
            website. These tools collect anonymous usage data to help us improve the
            site experience.
          </p>

          <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] pt-4">
            Contact Us
          </h2>
          <p>
            If you have questions about this privacy policy, contact us at{" "}
            <a href={`mailto:${SITE_CONFIG.email}`} className="text-[var(--color-brand-gold)] hover:underline">
              {SITE_CONFIG.email}
            </a>.
          </p>

          {/* TODO: Expand with full legal privacy policy before launch */}
          <p className="rounded-lg bg-[var(--color-surface-elevated)] p-4 text-sm text-[var(--color-text-muted)]">
            Note: This is a placeholder privacy policy. Have a legal professional
            review and expand this before launch, especially regarding COPPA compliance
            for youth athlete data.
          </p>
        </div>
      </div>
    </section>
  );
}
