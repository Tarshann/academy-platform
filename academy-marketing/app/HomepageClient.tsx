"use client";

import { useReveal } from "@/lib/useReveal";

export function RevealSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useReveal();

  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? "visible" : ""} ${
        delay === 1
          ? "reveal-delay-1"
          : delay === 2
          ? "reveal-delay-2"
          : delay === 3
          ? "reveal-delay-3"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
