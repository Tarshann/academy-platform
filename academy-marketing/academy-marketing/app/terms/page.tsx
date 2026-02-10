import { SITE_CONFIG } from "@/lib/config";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Terms of Service",
  description: `Terms of service for ${SITE_CONFIG.name}.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <section className="pt-32 pb-20 lg:pt-40">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="mt-8 space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            By using {SITE_CONFIG.name} services and the {SITE_CONFIG.domain} website,
            you agree to these terms of service.
          </p>

          <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] pt-4">
            Program Enrollment
          </h2>
          <p>
            Enrollment in any Academy program constitutes agreement to our attendance
            policies, payment terms, and safety guidelines. Parents or legal guardians
            must complete registration for athletes under 18.
          </p>

          <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] pt-4">
            Payments and Cancellation
          </h2>
          <p>
            Performance Lab memberships are billed monthly and can be paused or
            cancelled with 30 days written notice. Skills Lab and Private Training
            sessions are non-refundable but may be rescheduled with 24 hours notice.
          </p>

          <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] pt-4">
            Assumption of Risk
          </h2>
          <p>
            Athletic training involves inherent physical risk. By enrolling, parents
            acknowledge these risks and confirm their athlete is medically cleared for
            physical activity.
          </p>

          <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] pt-4">
            Contact
          </h2>
          <p>
            Questions about these terms? Contact us at{" "}
            <a href={`mailto:${SITE_CONFIG.email}`} className="text-[var(--color-brand-gold)] hover:underline">
              {SITE_CONFIG.email}
            </a>.
          </p>

          {/* TODO: Full legal review before launch */}
          <p className="rounded-lg bg-[var(--color-surface-elevated)] p-4 text-sm text-[var(--color-text-muted)]">
            Note: This is a placeholder. Have a legal professional review and expand
            these terms before launch, including liability waivers and COPPA compliance.
          </p>
        </div>
      </div>
    </section>
  );
}
