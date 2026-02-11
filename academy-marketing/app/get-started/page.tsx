import { generatePageMetadata } from "@/lib/metadata";
import GetStartedQuiz from "./GetStartedQuiz";

export const metadata = generatePageMetadata({
  title: "Get Started — Free Assessment",
  description:
    "Take our quick quiz to find the right training program for your athlete. Free assessment for youth athletes in Gallatin, TN.",
  path: "/get-started",
});

export default function GetStartedPage() {
  return <GetStartedQuiz />;
}
