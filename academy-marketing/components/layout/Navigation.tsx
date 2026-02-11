"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { SITE } from "@/lib/config";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  {
    label: "Programs",
    href: "/programs",
    children: [
      { label: "Performance Lab", href: "/programs/performance-lab" },
      { label: "Skills Lab", href: "/programs/skills-lab" },
      { label: "Private Training", href: "/programs/private-training" },
    ],
  },
  { label: "Coaches", href: "/coaches" },
  { label: "FAQ", href: "/faq" },
  { label: "Blog", href: "/blog" },
  { label: "Events", href: "/events" },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-[var(--color-brand-black)]/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <span
            className="text-xl md:text-2xl font-bold text-[var(--color-brand-white)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            THE ACADEMY
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) =>
            link.children ? (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => setProgramsOpen(true)}
                onMouseLeave={() => setProgramsOpen(false)}
              >
                <Link
                  href={link.href}
                  className="flex items-center gap-1 text-sm font-medium text-[var(--color-brand-white)]/80 hover:text-[var(--color-brand-gold)] transition-colors"
                  style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em", textTransform: "uppercase" }}
                >
                  {link.label}
                  <ChevronDown size={14} />
                </Link>
                {programsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-[var(--color-brand-black)] border border-white/10 rounded-lg shadow-xl py-2">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2 text-sm text-[var(--color-brand-white)]/70 hover:text-[var(--color-brand-gold)] hover:bg-white/5 transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--color-brand-white)]/80 hover:text-[var(--color-brand-gold)] transition-colors"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em", textTransform: "uppercase" }}
              >
                {link.label}
              </Link>
            )
          )}
          <a
            href="https://app.academytn.com"
            className="text-sm font-medium text-[var(--color-brand-white)]/80 hover:text-[var(--color-brand-gold)] transition-colors"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em", textTransform: "uppercase" }}
          >
            Member Login
          </a>
          <Link href="/get-started" className="btn-primary text-sm py-2.5 px-5">
            Get Started
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-[var(--color-brand-white)] p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[var(--color-brand-black)] border-t border-white/10">
          <nav className="container py-6 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <div key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-lg text-[var(--color-brand-white)] hover:text-[var(--color-brand-gold)] transition-colors"
                  style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  {link.label}
                </Link>
                {link.children && (
                  <div className="ml-4 mt-2 flex flex-col gap-2">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className="text-sm text-[var(--color-brand-white)]/60 hover:text-[var(--color-brand-gold)] transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <a
              href="https://app.academytn.com"
              onClick={() => setMobileOpen(false)}
              className="block text-lg text-[var(--color-brand-white)] hover:text-[var(--color-brand-gold)] transition-colors"
              style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Member Login
            </a>
            <Link
              href="/get-started"
              onClick={() => setMobileOpen(false)}
              className="btn-primary text-center mt-4"
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
