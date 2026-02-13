import { generatePageMetadata } from "@/lib/metadata";
import { SITE, CONTACT } from "@/lib/config";

export const metadata = generatePageMetadata({
  title: "Privacy Policy",
  description: `Privacy policy for ${SITE.name}. Learn how we collect, use, and protect your personal information.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 md:py-28 section-dark">
        <div className="container text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-white/60 text-sm">
            Last updated: February 13, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24 section-light">
        <div className="container">
          <div className="max-w-3xl mx-auto prose-custom">
            <div className="space-y-10">
              <div>
                <h2 className="text-2xl font-bold mb-4">Introduction</h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  {SITE.name} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
                  &ldquo;our&rdquo;) operates {SITE.name} mobile application
                  and the website at academytn.com. This Privacy Policy
                  describes how we collect, use, and protect your personal
                  information when you use our website, mobile app, or register
                  for our youth athletic training programs.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Information We Collect
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed mb-4">
                  When you create an account or use our services, we may collect
                  the following types of information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--color-brand-gray)]">
                  <li>
                    <strong>Account Information:</strong> Name, email address,
                    and password (managed securely through our authentication
                    provider, Clerk)
                  </li>
                  <li>
                    <strong>Athlete Information:</strong> Your child&apos;s name
                    and age group, which you provide when registering for
                    programs
                  </li>
                  <li>
                    <strong>Usage Information:</strong> Session registrations,
                    attendance records, and schedule preferences
                  </li>
                  <li>
                    <strong>Device Information:</strong> Device type, operating
                    system version, and push notification tokens (if you enable
                    notifications)
                  </li>
                  <li>
                    Emergency contact information
                  </li>
                  <li>
                    Payment information for program registration
                  </li>
                  <li>
                    Website usage data through cookies and analytics tools
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  How We Use Your Information
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed mb-4">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--color-brand-gray)]">
                  <li>
                    Managing program registrations and session enrollment
                  </li>
                  <li>
                    Sending schedule updates and announcements
                  </li>
                  <li>
                    Communicating with parents and athletes about training
                    sessions
                  </li>
                  <li>
                    Processing payments through our secure payment provider
                    (Stripe)
                  </li>
                  <li>
                    Sending push notifications about schedule changes or
                    important updates (with your permission)
                  </li>
                  <li>
                    Ensuring the safety and well-being of athletes during
                    training sessions
                  </li>
                  <li>
                    Improving our website and services through analytics
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Information Sharing
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed mb-4">
                  We do not sell, rent, or share your personal information with
                  third parties for marketing purposes. We share information
                  only with:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--color-brand-gray)]">
                  <li>
                    <strong>Service providers</strong> that help us operate our
                    services (Clerk for authentication, Stripe for payments, and
                    Vercel for hosting)
                  </li>
                  <li>
                    Our coaches and staff who need it to provide training
                    services
                  </li>
                  <li>
                    When required by law or to protect the safety of our
                    athletes
                  </li>
                  <li>
                    With your explicit consent
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Data Security</h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  We use industry-standard security measures to protect your
                  information, including encrypted data transmission
                  (HTTPS/TLS), secure authentication through Clerk, and
                  PCI-compliant payment processing through Stripe. No method of
                  electronic storage is 100% secure, but we take reasonable
                  measures to protect your data.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Children&apos;s Privacy
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  Our app is designed for use by parents and guardians of youth
                  athletes. We do not knowingly collect personal information
                  directly from children under 13. Parent or guardian accounts
                  manage all athlete information. All program registrations must
                  be completed by a parent or guardian. If you believe a child
                  under 13 has provided us with personal information without
                  parental consent, please contact us immediately.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Push Notifications
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  With your permission, we send push notifications about
                  schedule changes, new announcements, and direct messages. You
                  can disable notifications at any time through your device
                  settings or within the app.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Photos and Media
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  We may take photos or videos during training sessions for
                  promotional purposes. Parents and guardians will be notified
                  and may opt out of media use at any time by contacting us.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Cookies and Analytics
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  Our website may use cookies and analytics tools to understand
                  how visitors use our site. These tools collect anonymous usage
                  data to help us improve our website experience. You can
                  control cookie settings through your browser preferences.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  You may request access to, correction of, or deletion of your
                  personal information at any time by contacting us. You may
                  also delete your account through the app or by contacting us
                  directly.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Changes to This Policy
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  We may update this Privacy Policy from time to time. We will
                  notify you of any material changes through the app or by
                  email.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  If you have questions about this Privacy Policy or our data
                  practices, contact us:
                </p>
                <div className="mt-4 bg-[var(--color-brand-gray-light)] rounded-xl p-6">
                  <p className="font-semibold mb-1">{SITE.name}</p>
                  <p className="text-[var(--color-brand-gray)]">
                    Gallatin, Tennessee
                  </p>
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
                    Website:{" "}
                    <a
                      href={SITE.url}
                      className="text-[var(--color-brand-gold-dark)] hover:underline"
                    >
                      academytn.com
                    </a>
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
