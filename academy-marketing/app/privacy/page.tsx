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
            Last updated: February 2026
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
                  &ldquo;our&rdquo;) is committed to protecting the privacy of
                  our athletes, their families, and visitors to our website.
                  This Privacy Policy explains how we collect, use, and
                  safeguard your personal information when you visit our website
                  or register for our youth athletic training programs.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Information We Collect
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed mb-4">
                  We may collect the following types of information when you
                  register for our programs, contact us, or use our website:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--color-brand-gray)]">
                  <li>
                    Parent/guardian name, email address, and phone number
                  </li>
                  <li>Athlete name, age, and relevant health information</li>
                  <li>
                    Emergency contact information
                  </li>
                  <li>Payment information for program registration</li>
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
                    Processing registration and enrollment for our training
                    programs
                  </li>
                  <li>
                    Communicating with parents and guardians about schedules,
                    events, and athlete progress
                  </li>
                  <li>
                    Ensuring the safety and well-being of athletes during
                    training sessions
                  </li>
                  <li>Processing payments for programs and sessions</li>
                  <li>
                    Improving our website and services through analytics
                  </li>
                  <li>Sending program updates and relevant information</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  We Do Not Sell Your Data
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  We will never sell, rent, or trade your personal information
                  to third parties for marketing purposes. Your data is used
                  solely for operating our youth athletic training programs and
                  communicating with registered families.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Information Sharing
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  We may share your information only in the following limited
                  circumstances: with our coaches and staff who need it to
                  provide training services; with payment processors to
                  complete transactions; when required by law or to protect the
                  safety of our athletes; and with your explicit consent.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Children&apos;s Privacy
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  Because we serve youth athletes, we take special care with
                  information related to minors. We collect athlete information
                  only through their parents or legal guardians. We do not
                  knowingly collect personal information directly from children
                  under 13 through our website. All program registrations must
                  be completed by a parent or guardian.
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
                <h2 className="text-2xl font-bold mb-4">Data Security</h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  We implement reasonable security measures to protect your
                  personal information from unauthorized access, alteration, or
                  disclosure. However, no method of electronic transmission or
                  storage is 100% secure.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Cookies and Analytics
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  Our website may use cookies and analytics tools (such as
                  Google Analytics) to understand how visitors use our site.
                  These tools collect anonymous usage data to help us improve
                  our website experience. You can control cookie settings
                  through your browser preferences.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  You have the right to request access to, correction of, or
                  deletion of your personal information at any time. To make a
                  request, please contact us using the information below.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Changes to This Policy
                </h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  We may update this Privacy Policy from time to time. Any
                  changes will be posted on this page with an updated revision
                  date.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                <p className="text-[var(--color-brand-gray)] leading-relaxed">
                  If you have questions about this Privacy Policy or wish to
                  make a data request, please contact us:
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
