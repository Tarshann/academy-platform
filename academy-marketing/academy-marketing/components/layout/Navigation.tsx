"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";

const NAV_LINKS = [
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
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[var(--color-surface-dark)]/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <nav
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-wider text-[var(--color-brand-white)] lg:text-2xl"
          >
            THE ACADEMY
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() =>
                  link.children && setActiveDropdown(link.label)
                }
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={link.href}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium tracking-wide text-[var(--color-text-on-dark-secondary)] transition-colors hover:text-[var(--color-brand-white)]"
                >
                  {link.label}
                  {link.children && <ChevronDown className="h-3.5 w-3.5" />}
                </Link>

                {/* Dropdown */}
                {link.children && activeDropdown === link.label && (
                  <div className="absolute left-0 top-full w-56 pt-2">
                    <div className="rounded-lg border border-[var(--color-neutral-800)] bg-[var(--color-surface-dark-elevated)] p-2 shadow-xl">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-md px-4 py-2.5 text-sm text-[var(--color-text-on-dark-secondary)] transition-colors hover:bg-[var(--color-neutral-800)] hover:text-[var(--color-brand-white)]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-4 lg:flex">
            <Link
              href={`tel:${SITE_CONFIG.phone.replace(/[^0-9+]/g, "")}`}
              className="text-sm text-[var(--color-text-on-dark-secondary)] transition-colors hover:text-[var(--color-brand-white)]"
            >
              {SITE_CONFIG.phone}
            </Link>
            <Link href="/get-started" className="btn-primary">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-12 w-12 items-center justify-center text-[var(--color-brand-white)] lg:hidden"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-[var(--color-surface-dark)] lg:hidden">
          <div className="flex h-full flex-col px-6 py-8">
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <div key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="font-display block py-3 text-2xl tracking-wide text-[var(--color-brand-white)]"
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <div className="ml-4 flex flex-col gap-1 border-l-2 border-[var(--color-neutral-800)] pl-4">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setIsOpen(false)}
                          className="py-2 text-base text-[var(--color-text-on-dark-secondary)]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-4 border-t border-[var(--color-neutral-800)] pt-6">
              <Link
                href={`tel:${SITE_CONFIG.phone.replace(/[^0-9+]/g, "")}`}
                className="text-center text-lg text-[var(--color-text-on-dark-secondary)]"
              >
                {SITE_CONFIG.phone}
              </Link>
              <Link
                href="/get-started"
                onClick={() => setIsOpen(false)}
                className="btn-primary w-full text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
