"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[var(--color-brand-black)]/95 backdrop-blur-lg border-t border-white/10 px-4 py-3">
      <div className="flex gap-3">
        <Link href="/get-started" className="btn-primary flex-1 text-center text-sm py-3">
          Get Started
        </Link>
        <Link href="/programs" className="btn-secondary-dark flex-1 text-center text-sm py-3 border-white/30 text-white">
          View Programs
        </Link>
      </div>
    </div>
  );
}
