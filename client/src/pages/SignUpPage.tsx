import { SignUp } from "@clerk/clerk-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { getClerkPublishableKey } from "@/const";

export default function SignUpPage() {
  const clerkKey = getClerkPublishableKey();
  
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
        <SignUp 
          routing="path" 
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/"
        />
      </main>
      <Footer />
    </div>
  );
}
