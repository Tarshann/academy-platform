import Link from "next/link";
import { SITE, CONTACT, CONTACTS, ADDRESS, SOCIAL } from "@/lib/config";
import { Facebook, Instagram, MapPin, Clock, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-brand-black)] text-[var(--color-brand-white)]">
      <div className="h-1 bg-gradient-to-r from-transparent via-[var(--color-brand-gold)] to-transparent" />

      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                THE ACADEMY
              </span>
              <span className="text-xs text-white/40">Est. {SITE.foundingYear}</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Building complete athletes through multi-sport development in
              basketball, flag football, and soccer.
            </p>
            <div className="flex gap-3">
              <a
                href={SOCIAL.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[var(--color-brand-gold)]/20 hover:text-[var(--color-brand-gold)] transition-all"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[var(--color-brand-gold)]/20 hover:text-[var(--color-brand-gold)] transition-all"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href={SOCIAL.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[var(--color-brand-gold)]/20 hover:text-[var(--color-brand-gold)] transition-all"
                aria-label="TikTok"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>
            </div>
          </div>

          {/* Programs */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Programs
            </h3>
            <div className="w-8 h-0.5 bg-[var(--color-brand-gold)] mb-4" />
            <div className="flex flex-col gap-3">
              <Link href="/programs" className="text-white/60 hover:text-[var(--color-brand-gold)] transition-colors text-sm">All Programs</Link>
              <Link href="/programs/performance-lab" className="text-white/60 hover:text-[var(--color-brand-gold)] transition-colors text-sm">Performance Lab</Link>
              <Link href="/programs/skills-lab" className="text-white/60 hover:text-[var(--color-brand-gold)] transition-colors text-sm">Skills Lab</Link>
              <Link href="/coaches" className="text-white/60 hover:text-[var(--color-brand-gold)] transition-colors text-sm">Coaches</Link>
              <Link href="/faq" className="text-white/60 hover:text-[var(--color-brand-gold)] transition-colors text-sm">FAQs</Link>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Location
            </h3>
            <div className="w-8 h-0.5 bg-[var(--color-brand-gold)] mb-4" />
            <div className="flex flex-col gap-3 text-sm text-white/60">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-[var(--color-brand-gold)] mt-0.5 flex-shrink-0" />
                <span>{ADDRESS.full}</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={16} className="text-[var(--color-brand-gold)] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block">Tue &amp; Thu 6:00–8:00 PM</span>
                  <span className="block">Sun 11:00 AM–12:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Contact
            </h3>
            <div className="w-8 h-0.5 bg-[var(--color-brand-gold)] mb-4" />
            <div className="flex flex-col gap-4 text-sm text-white/60">
              {CONTACTS.map((c) => (
                <div key={c.name} className="flex flex-col gap-1">
                  <span className="text-white/80 font-medium text-xs uppercase tracking-wide">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-[var(--color-brand-gold)] flex-shrink-0" />
                    <a href={`tel:${c.phoneRaw}`} className="hover:text-[var(--color-brand-gold)] transition-colors">
                      {c.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-[var(--color-brand-gold)] flex-shrink-0" />
                    <a href={`mailto:${c.email}`} className="hover:text-[var(--color-brand-gold)] transition-colors">
                      {c.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Service areas */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-center text-sm text-white/40 mb-8">
            Proudly serving athletes in{" "}
            <span className="text-white/60">Gallatin</span>,{" "}
            <span className="text-white/60">Hendersonville</span>, and{" "}
            <span className="text-white/60">Sumner County</span>
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/privacy" className="hover:text-[var(--color-brand-gold)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--color-brand-gold)] transition-colors">Terms</Link>
            <Link href="/faq" className="hover:text-[var(--color-brand-gold)] transition-colors">FAQs</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
