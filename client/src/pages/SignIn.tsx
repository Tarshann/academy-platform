import { SignIn } from "@clerk/clerk-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { getClerkPublishableKey } from "@/const";

export default function SignInPage() {
  const clerkKey = getClerkPublishableKey();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectParam = searchParams.get("redirect")?.trim();
  const redirectPath =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/member";
  const signUpUrl = `/signup?redirect=${encodeURIComponent(redirectPath)}`;
  
  if (!clerkKey) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Not Configured</h1>
            <p className="text-muted-foreground">
              Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center py-16">
        <SignIn 
          routing="path" 
          path="/sign-in"
          signUpUrl={signUpUrl}
          afterSignInUrl={redirectPath}
        />
      </main>
      <Footer />
    </div>
  );
}
