"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FAQItem = { question: string; answer: string };

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col divide-y divide-[var(--color-neutral-200)]">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-start justify-between gap-4 py-6 text-left"
            aria-expanded={openIndex === i}
          >
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] pr-4">
              {item.question}
            </h3>
            <ChevronDown
              className={`mt-1 h-5 w-5 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 ${
                openIndex === i ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              openIndex === i ? "max-h-96 pb-6" : "max-h-0"
            }`}
          >
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
