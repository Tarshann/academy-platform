import { generatePageMetadata } from "@/lib/metadata";
import { BreadcrumbJsonLd } from "@/lib/structured-data";
import GetStartedQuiz from "./GetStartedQuiz";

export const metadata = generatePageMetadata({
  title: "Get Started — Free Assessment",
  description:
    "Take our quick quiz to find the right training program for your athlete. Free assessment for youth athletes in Gallatin, TN.",
  path: "/get-started",
});

export default function GetStartedPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Get Started", href: "/get-started" },
        ]}
      />
      <GetStartedQuiz />
    </>
  );
}
