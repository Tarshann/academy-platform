import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useAuth } from "@/_core/hooks/useAuth";
import { getClerkPublishableKey, getLoginUrl } from "@/const";

export default function PaymentSuccess() {
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const clerkPublishableKey = getClerkPublishableKey();
  const loginUrl = getLoginUrl();

  useEffect(() => {
    // Simulate verification delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      <main id="main-content" className="flex-1 flex items-center justify-center py-16">
        <div className="container max-w-2xl">
          <Breadcrumbs items={[
            { label: "Programs", href: "/programs" },
            { label: "Payment Success" }
          ]} />
          {loading ? (
            <Card className="bg-card border-border text-center py-12">
              <CardContent>
                <Loader2 className="animate-spin text-primary mx-auto mb-4" size={48} />
                <p className="text-muted-foreground">Confirming your payment...</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="text-primary" size={64} />
                </div>
                <CardTitle className="text-3xl text-foreground">Payment Successful!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-lg text-muted-foreground mb-2">
                    Thank you for your registration with The Academy!
                  </p>
                  <p className="text-muted-foreground">
                    You will receive a confirmation email shortly with details about your program.
                  </p>
                </div>

                {sessionId && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Transaction ID:</p>
                    <p className="text-xs font-mono text-foreground break-all">{sessionId}</p>
                  </div>
                )}

                <div className="space-y-3 pt-4">
                  {isAuthenticated ? (
                    <Link href="/member">
                      <Button className="w-full" size="lg">
                        Go to Member Dashboard
                      </Button>
                    </Link>
                  ) : clerkPublishableKey ? (
                    <>
                      <Link href="/sign-up">
                        <Button className="w-full" size="lg">
                          Create Your Account
                        </Button>
                      </Link>
                      <Link href="/sign-in">
                        <Button variant="outline" className="w-full" size="lg">
                          Sign In to View Your Schedule
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <a href={loginUrl}>
                      <Button className="w-full" size="lg" disabled={loginUrl === "#"}>
                        Sign In to Access Member Tools
                      </Button>
                    </a>
                  )}
                  <Link href="/signup">
                    <Button variant="outline" className="w-full" size="lg">
                      Register for More Programs
                    </Button>
                  </Link>
                </div>

                <div className="border-t border-border pt-6 mt-6">
                  <h3 className="font-semibold text-foreground mb-3">What's Next?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Check your email for confirmation and program details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>View your schedule in the member dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Prepare for your first session - bring athletic shoes, water, and a positive attitude!</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Questions? <Link href="/contact"><span className="text-primary hover:underline">Contact us</span></Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
