import { Metadata } from "next";
import Link from "next/link";
import { CONTACTS, SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: `Payment Confirmed — ${SITE.name}`,
  description: "Your payment has been processed successfully. Thank you for registering with The Academy.",
  robots: { index: false, follow: false },
};

export default function PaymentSuccessPage() {
  return (
    <>
      <section className="py-24 md:py-32 section-dark">
        <div className="container text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Payment <span className="text-[var(--color-brand-gold)]">Confirmed!</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Thank you for registering with The Academy. A confirmation email with your
            program details and next steps is on its way.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 section-light">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <h2
              className="text-3xl font-bold mb-8"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What&apos;s Next
            </h2>
            <ol className="space-y-6">
              <li className="flex gap-4">
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-brand-gold)] text-black flex items-center justify-center font-bold text-sm"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  1
                </span>
                <div>
                  <h3 className="font-bold text-lg mb-1">Check Your Email</h3>
                  <p className="text-[var(--color-brand-gray)]">
                    Review your confirmation email for program details, start dates, and
                    location information.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-brand-gold)] text-black flex items-center justify-center font-bold text-sm"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  2
                </span>
                <div>
                  <h3 className="font-bold text-lg mb-1">Prepare for Your First Session</h3>
                  <ul className="text-[var(--color-brand-gray)] list-disc list-inside space-y-1">
                    <li>Wear athletic shoes and comfortable clothing</li>
                    <li>Bring a water bottle to stay hydrated</li>
                    <li>Arrive 10 minutes early to check in</li>
                  </ul>
                </div>
              </li>
              <li className="flex gap-4">
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-brand-gold)] text-black flex items-center justify-center font-bold text-sm"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  3
                </span>
                <div>
                  <h3 className="font-bold text-lg mb-1">Questions?</h3>
                  <p className="text-[var(--color-brand-gray)]">
                    {CONTACTS.map((c, i) => (
                      <span key={c.name}>
                        {i > 0 && " · "}
                        {c.name}:{" "}
                        <a
                          href={`tel:${c.phoneRaw}`}
                          className="text-[var(--color-brand-gold-dark)] hover:underline"
                        >
                          {c.phone}
                        </a>
                      </span>
                    ))}
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link href="/programs" className="btn-primary text-center py-3 px-8">
                Browse Programs
              </Link>
              <Link href="/" className="btn-secondary-dark text-center py-3 px-8">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
