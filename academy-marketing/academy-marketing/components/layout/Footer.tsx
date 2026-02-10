import Link from "next/link";
import { SITE_CONFIG } from "@/lib/config";
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="section-dark border-t border-[var(--color-neutral-800)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="font-display text-xl font-bold tracking-wider text-[var(--color-brand-white)]"
            >
              THE ACADEMY
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-on-dark-secondary)]">
              Elite youth multi-sport athletic training in Gallatin, TN. Building
              faster, stronger, more confident athletes.
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href={SITE_CONFIG.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-neutral-700)] text-[var(--color-text-on-dark-secondary)] transition-colors hover:border-[var(--color-brand-gold)] hover:text-[var(--color-brand-gold)]"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={SITE_CONFIG.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-neutral-700)] text-[var(--color-text-on-dark-secondary)] transition-colors hover:border-[var(--color-brand-gold)] hover:text-[var(--color-brand-gold)]"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Programs */}
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wider text-[var(--color-brand-gold)]">
              Programs
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              <li>
                <Link
                  href="/programs/performance-lab"
                  className="text-sm text-[var(--color-text-on-dark-secondary)] transition-colors hover:text-[var(--color-brand-white)]"
                >
                  Academy Performance Lab
                </Link>
              </li>
              <li>
                <Link
                  href="/programs/skills-lab"
                  className="text-sm text-[var(--color-text-on-dark-secondary)] transition-colors hover:text-[var(--color-brand-white)]"
                >
                  Academy Skills Lab
                </Link>
              </li>
              <li>
                <Link
                  href="/programs/private-training"
                  className="text-sm text-[var(--color-text-on-dark-secondary)] transition-colors hover:text-[var(--color-brand-white)]"
                >
                  Private Training
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wider text-[var(--color-brand-gold)]">
              Resources
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              <li>
                <Link
                  href="/coaches"
                  className="text-sm text-[var(--color-text-on-dark-secondary)] transition-colors hover:text-[var(--color-brand-white)]"
                >
                  Meet the Coaches
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-[var(--color-text-on-dark-secondary)] transition-colors hover:text-[var(--color-brand-white)]"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-[var(--color-text-on-dark-secondary)] transition-colors hover:text-[var(--color-brand-white)]"
                >
                  Training Tips & Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/get-started"
                  className="text-sm text-[var(--color-text-on-dark-secondary)] transition-colors hover:text-[var(--color-brand-white)]"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wider text-[var(--color-brand-gold)]">
              Contact
            </h3>
            <ul className="mt-4 flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand-gold)]" />
                <span className="text-sm text-[var(--color-text-on-dark-secondary)]">
                  {SITE_CONFIG.address.street}
                  <br />
                  {SITE_CONFIG.address.city}, {SITE_CONFIG.address.state}{" "}
                  {SITE_CONFIG.address.zip}
                </span>
              </li>
              <li>
                <a
                  href={`tel:${SITE_CONFIG.phone.replace(/[^0-9+]/g, "")}`}
                  className="flex items-center gap-3 text-sm text-[var(--color-text-on-dark-secondary)] transition-colors hover:text-[var(--color-brand-white)]"
                >
                  <Phone className="h-4 w-4 shrink-0 text-[var(--color-brand-gold)]" />
                  {SITE_CONFIG.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="flex items-center gap-3 text-sm text-[var(--color-text-on-dark-secondary)] transition-colors hover:text-[var(--color-brand-white)]"
                >
                  <Mail className="h-4 w-4 shrink-0 text-[var(--color-brand-gold)]" />
                  {SITE_CONFIG.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-neutral-800)] pt-8 text-xs text-[var(--color-text-muted)] md:flex-row">
          <p>
            &copy; {currentYear} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--color-text-on-dark-secondary)]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--color-text-on-dark-secondary)]">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
