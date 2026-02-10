import { Suspense } from "react";
import { generatePageMetadata } from "@/lib/metadata";
import { GetStartedQuiz } from "./GetStartedQuiz";

export const metadata = generatePageMetadata({
  title: "Get Started",
  description:
    "Find the right training program for your athlete. Take our 30-second assessment and book a free evaluation at The Academy in Gallatin, TN.",
  path: "/get-started",
});

export default function GetStartedPage() {
  return (
    <Suspense
      fallback={
        <section className="section-dark flex min-h-screen items-center pt-20">
          <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
            <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-neutral-800)]" />
            <div className="mt-6 h-12 w-full animate-pulse rounded bg-[var(--color-neutral-800)]" />
            <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-[var(--color-neutral-800)]" />
          </div>
        </section>
      }
    >
      <GetStartedQuiz />
    </Suspense>
  );
}
