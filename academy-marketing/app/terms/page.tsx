import { generatePageMetadata } from "@/lib/metadata";
import { SITE, CONTACT } from "@/lib/config";

export const metadata = generatePageMetadata({
  title: "Terms of Service",
  description: `Terms of service for ${SITE.name} youth athletic training programs in Gallatin, TN.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 md:py-28 section-dark">
        <div className="container text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Terms of Service
          </h1>
          <p className="text-white/60 text-sm">
            Last updated: February 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24 section-light">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-10">
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Agreement to Terms
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  By accessing our website or enrolling in any program offered
                  by {SITE.name} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
                  &ldquo;our&rdquo;), you agree to be bound by these Terms of
                  Service. If you are enrolling a minor, you represent that you
                  are the parent or legal guardian of the athlete and have the
                  authority to agree to these terms on their behalf.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Program Participation
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed mb-4">
                  Our youth athletic training programs involve physical activity
                  including running, jumping, agility drills, strength
                  exercises, and sport-specific skills training. By enrolling
                  your athlete, you acknowledge and agree to the following:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--color-brand-gray)]">
                  <li>
                    Your athlete is physically able to participate in athletic
                    training activities
                  </li>
                  <li>
                    You will disclose any relevant medical conditions, injuries,
                    or physical limitations prior to participation
                  </li>
                  <li>
                    Athletes must follow all safety instructions provided by
                    coaches during sessions
                  </li>
                  <li>
                    Appropriate athletic attire and footwear must be worn to all
                    sessions
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Assumption of Risk
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  Participation in youth athletic training involves inherent
                  risks, including but not limited to: muscle strains, sprains,
                  bruises, fractures, heat-related illness, and other injuries
                  that may occur during physical activity. By enrolling your
                  athlete, you acknowledge and voluntarily assume these risks.
                  We take every reasonable precaution to ensure athlete safety,
                  including proper warm-ups, qualified coaching, and appropriate
                  training progressions.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Liability Waiver
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  To the fullest extent permitted by Tennessee law, you agree
                  to release, waive, and discharge {SITE.name}, its owners,
                  coaches, employees, and volunteers from any and all liability,
                  claims, or demands arising out of or related to your
                  athlete&apos;s participation in our training programs. A
                  separate liability waiver and release form must be signed
                  prior to participation and will be provided during the
                  registration process.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Payment and Pricing
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed mb-4">
                  The following pricing applies to our programs:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--color-brand-gray)] mb-4">
                  <li>
                    <strong>Performance Lab:</strong> $245 per month
                    (month-to-month membership)
                  </li>
                  <li>
                    <strong>Skills Lab:</strong> $10 per session (drop-in, pay
                    at the door)
                  </li>
                  <li>
                    <strong>Private Training:</strong> $60 per session
                    (scheduled by appointment)
                  </li>
                </ul>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  Pricing is subject to change with reasonable notice. Any
                  price changes will be communicated to enrolled families
                  before the next billing cycle.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Refund Policy</h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  Performance Lab memberships may be cancelled at any time with
                  notice before the next billing period. Refunds for partial
                  months are handled on a case-by-case basis. Skills Lab
                  drop-in payments and Private Training session payments are
                  non-refundable once a session has been attended. If a
                  scheduled private session is cancelled with at least 24 hours
                  notice, the session fee may be applied to a future booking.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Weather and Cancellations
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  As we train outdoors, sessions may be affected by weather
                  conditions. In the event of severe weather, sessions may be
                  cancelled or rescheduled. We will communicate cancellations
                  as early as possible through our normal communication
                  channels. Cancelled sessions for Performance Lab members
                  will be made up when possible.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Code of Conduct</h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  We expect all athletes, parents, and guardians to conduct
                  themselves with respect and sportsmanship. We reserve the
                  right to remove any athlete from a program if their behavior
                  is disruptive, unsafe, or disrespectful to coaches, staff, or
                  fellow athletes. Refunds in cases of removal for conduct
                  violations are at our discretion.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Photos and Media Release
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  By enrolling in our programs, you grant {SITE.name}{" "}
                  permission to use photos and videos taken during training
                  sessions for promotional and marketing purposes, including
                  website, social media, and print materials. You may opt out
                  of media use at any time by notifying us in writing.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Intellectual Property
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  All content on this website, including text, images, logos,
                  and training materials, is the property of {SITE.name} and is
                  protected by applicable intellectual property laws. You may
                  not reproduce, distribute, or use our content without prior
                  written permission.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  These Terms of Service shall be governed by and construed in
                  accordance with the laws of the State of Tennessee. Any
                  disputes arising under these terms shall be resolved in the
                  courts of Sumner County, Tennessee.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Changes to These Terms
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  We reserve the right to update these Terms of Service at any
                  time. Changes will be posted on this page with an updated
                  revision date. Continued use of our services after changes
                  are posted constitutes acceptance of the updated terms.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  If you have questions about these Terms of Service, please
                  contact us:
                </p>
                <div className="mt-4 bg-[var(--color-brand-gray-light)] rounded-xl p-6">
                  <p className="font-semibold mb-1">{SITE.name}</p>
                  <p className="text-[var(--color-brand-gray)]">
                    Email:{" "}
                    <a
                      href={`mailto:${CONTACT.email}`}
                      className="text-[var(--color-brand-gold-dark)] hover:underline"
                    >
                      {CONTACT.email}
                    </a>
                  </p>
                  <p className="text-[var(--color-brand-gray)]">
                    Phone:{" "}
                    <a
                      href={`tel:${CONTACT.phoneRaw}`}
                      className="text-[var(--color-brand-gold-dark)] hover:underline"
                    >
                      {CONTACT.phone}
                    </a>
                  </p>
                  <p className="text-[var(--color-brand-gray)]">
                    Location: Gallatin, Tennessee
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
