import { Link, useSearch } from "wouter";
import { useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getClerkPublishableKey, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Debug validation detector - shows which element is failing validation
// Only active when ?debugValidation=1 is in the URL
function useValidationDebugger() {
  const searchString = useSearch();
  const isDebugMode = searchString.includes('debugValidation=1');

  useEffect(() => {
    if (!isDebugMode) return;

    const debugOverlay = document.createElement('div');
    debugOverlay.id = 'validation-debug-overlay';
    debugOverlay.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      right: 10px;
      max-height: 200px;
      overflow-y: auto;
      background: rgba(0,0,0,0.9);
      color: #0f0;
      font-family: monospace;
      font-size: 11px;
      padding: 10px;
      z-index: 99999;
      border-radius: 8px;
      display: none;
    `;
    document.body.appendChild(debugOverlay);

    const logToOverlay = (msg: string) => {
      debugOverlay.style.display = 'block';
      debugOverlay.innerHTML += `<div>${new Date().toISOString().slice(11, 23)} ${msg}</div>`;
      debugOverlay.scrollTop = debugOverlay.scrollHeight;
    };

    // Capture invalid events at document level
    const handleInvalid = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      
      const el = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const info = {
        tagName: el.tagName,
        id: el.id || '(none)',
        name: el.name || '(none)',
        type: (el as HTMLInputElement).type || '(none)',
        required: el.required,
        pattern: (el as HTMLInputElement).pattern || '(none)',
        valueLength: el.value?.length ?? 0,
        willValidate: el.willValidate,
        validationMessage: el.validationMessage,
      };
      logToOverlay(`INVALID EVENT: ${JSON.stringify(info)}`);
    };

    // Scan for any element that would fail validation
    const scanForInvalidElements = () => {
      const elements = document.querySelectorAll('input, select, textarea');
      const failing: string[] = [];
      elements.forEach((el) => {
        const input = el as HTMLInputElement;
        if (input.willValidate && !input.checkValidity()) {
          failing.push(`${input.tagName}#${input.id || '?'}[name=${input.name || '?'}][type=${input.type}] msg="${input.validationMessage}"`);
        }
      });
      if (failing.length > 0) {
        logToOverlay(`SCAN FOUND ${failing.length} FAILING: ${failing.join(', ')}`);
      } else {
        logToOverlay('SCAN: No failing elements found');
      }
    };

    // Log all form-associated elements on page load
    const logAllFormElements = () => {
      const elements = document.querySelectorAll('input, select, textarea, button');
      logToOverlay(`PAGE LOAD: Found ${elements.length} form-associated elements`);
      elements.forEach((el, i) => {
        const input = el as HTMLInputElement;
        logToOverlay(`  [${i}] ${input.tagName}#${input.id || '?'} type=${input.type || '?'} required=${input.required} pattern=${input.pattern || 'none'} willValidate=${input.willValidate}`);
      });
    };

    document.addEventListener('invalid', handleInvalid, true);
    
    // Expose scan function globally for manual testing
    (window as any).__scanValidation = scanForInvalidElements;
    
    // Log elements after a short delay to catch dynamically added ones
    setTimeout(logAllFormElements, 1000);

    return () => {
      document.removeEventListener('invalid', handleInvalid, true);
      delete (window as any).__scanValidation;
      debugOverlay.remove();
    };
  }, [isDebugMode]);

  return isDebugMode;
}

// Div-based CTA component to bypass Safari iOS validation
// Safari validates all inputs in the DOM when a <button> is clicked,
// even hidden inputs injected by Stripe/Clerk. Using a div avoids this.
interface DivButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline';
  size?: 'default' | 'lg';
  className?: string;
  children: React.ReactNode;
}

function DivButton({ onClick, disabled, variant = 'default', size = 'default', className, children }: DivButtonProps) {
  const isDebugMode = typeof window !== 'undefined' && window.location.search.includes('debugValidation=1');

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) onClick();
    }
  }, [disabled, onClick]);

  const handleClick = useCallback(() => {
    if (disabled) return;

    // In debug mode, scan for invalid elements before checkout
    if (isDebugMode && (window as any).__scanValidation) {
      (window as any).__scanValidation();
    }

    // Delay by one tick to break Safari's validation chain
    requestAnimationFrame(() => {
      onClick();
    });
  }, [disabled, onClick, isDebugMode]);

  const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] cursor-pointer select-none";
  const variantStyles = variant === 'outline' 
    ? "border bg-transparent shadow-xs hover:bg-accent dark:bg-transparent dark:border-input dark:hover:bg-input/50"
    : "bg-primary text-primary-foreground hover:bg-primary/90";
  const sizeStyles = size === 'lg' ? "h-10 rounded-md px-6" : "h-9 px-4 py-2";
  const disabledStyles = disabled ? "pointer-events-none opacity-50" : "";

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(baseStyles, variantStyles, sizeStyles, disabledStyles, className)}
      aria-disabled={disabled}
    >
      {children}
    </div>
  );
}

export default function SignUp() {
  const { isAuthenticated } = useAuth();
  const checkoutKeyRef = useRef<Map<string, string>>(new Map());
  
  // Enable debug mode with ?debugValidation=1
  useValidationDebugger();

  // Global validation suppression for Safari iOS
  // Safari validates hidden/injected inputs (Stripe, Clerk) even with noValidate
  // This captures and suppresses those native validation events
  useEffect(() => {
    const suppressValidation = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    // Capture phase to intercept before any other handler
    document.addEventListener('invalid', suppressValidation, true);
    
    return () => {
      document.removeEventListener('invalid', suppressValidation, true);
    };
  }, []);

  const clerkPublishableKey = getClerkPublishableKey();
  const loginUrl = getLoginUrl();
  
  // For authenticated users
  const createCheckout = trpc.payment.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecting to checkout...");
        window.location.assign(data.url);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });
  
  // For guest users - Stripe will collect email
  const createGuestCheckout = trpc.payment.createGuestCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecting to checkout...");
        window.location.assign(data.url);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  // Simplified checkout handler - no email collection on this page
  // Stripe Checkout will collect email natively
  const handlePurchase = (productId: string) => {
    const baseFingerprint = productId.trim();
    
    if (isAuthenticated) {
      // Authenticated user - use their account email
      const authFingerprint = `auth:${baseFingerprint}`;
      const existingKey = checkoutKeyRef.current.get(authFingerprint);
      const idempotencyKey = existingKey ?? crypto.randomUUID();
      if (!existingKey) {
        checkoutKeyRef.current.set(authFingerprint, idempotencyKey);
      }
      createCheckout.mutate({ productId, idempotencyKey });
    } else {
      // Guest user - Stripe will collect email
      const guestFingerprint = `guest:${baseFingerprint}`;
      const existingKey = checkoutKeyRef.current.get(guestFingerprint);
      const idempotencyKey = existingKey ?? crypto.randomUUID();
      if (!existingKey) {
        checkoutKeyRef.current.set(guestFingerprint, idempotencyKey);
      }
      createGuestCheckout.mutate({ productId, idempotencyKey });
    }
  };

  const isPending = createCheckout.isPending || createGuestCheckout.isPending;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-br from-background via-card to-background">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Registration</h1>
              <p className="text-lg text-muted-foreground">
                Ready to train? Choose your program and register below. Not sure which is right for you? <Link href="/programs" className="text-primary hover:underline font-medium">Explore our programs</Link> first.
              </p>
            </div>
          </div>
        </section>

        {/* Guest info banner - no email input, Stripe collects email */}
        {!isAuthenticated && (
          <section className="py-10">
            <div className="container">
              <Card className="bg-card border-border max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-foreground text-2xl">Guest Registration</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Click any program below to register. You'll enter your email securely during checkout.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Want to manage bookings and access member features?
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {clerkPublishableKey ? (
                        <>
                          <Link href="/sign-up">
                            <Button type="button" variant="outline">Create Account</Button>
                          </Link>
                          <Link href="/sign-in">
                            <Button type="button" variant="ghost">Sign In</Button>
                          </Link>
                        </>
                      ) : (
                        <a href={loginUrl}>
                          <Button type="button" variant="outline" disabled={loginUrl === "#"}>
                            Sign In
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Memberships */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Memberships</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Best value for committed players. Unlimited access to programs throughout the month.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="bg-card border-2 border-primary relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">POPULAR</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-foreground text-2xl">Academy Group Membership</CardTitle>
                  <CardDescription className="text-muted-foreground">Unlimited group sessions</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-primary">$150</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Unlimited group workout sessions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Small group sizes (max 8 players)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Competitive training environment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Youth athletes of all levels</span>
                    </li>
                  </ul>
                  <DivButton 
                    className="w-full" 
                    size="lg"
                    onClick={() => handlePurchase('academy-group-membership')}
                    disabled={isPending}
                  >
                    {isPending ? 'Processing...' : 'Register Now'}
                  </DivButton>
                </CardContent>
              </Card>

              <Card className="bg-card border-2 border-primary relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">BEST VALUE</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-foreground text-2xl">Complete Player Membership</CardTitle>
                  <CardDescription className="text-muted-foreground">Unlimited skills classes + open gyms</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-primary">$100</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Unlimited skills classes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Unlimited open gym access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Shooting lab access included</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-muted-foreground">Youth athletes of all levels</span>
                    </li>
                  </ul>
                  <DivButton 
                    className="w-full" 
                    size="lg"
                    onClick={() => handlePurchase('complete-player-membership')}
                    disabled={isPending}
                  >
                    {isPending ? 'Processing...' : 'Register Now'}
                  </DivButton>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Individual Sessions */}
        <section className="py-16 bg-card">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Individual Sessions</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Pay-as-you-go options. Perfect for flexible schedules or trying programs before committing.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Group Workout</CardTitle>
                  <CardDescription className="text-muted-foreground">Limited to 8 players</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$25</span>
                    <span className="text-muted-foreground">/session</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Single session access to group workouts. Develop skills in a competitive environment.
                  </p>
                  <DivButton 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handlePurchase('group-workout')}
                    disabled={isPending}
                  >
                    {isPending ? 'Processing...' : 'Register'}
                  </DivButton>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Individual Training</CardTitle>
                  <CardDescription className="text-muted-foreground">One-on-one coaching</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$60</span>
                    <span className="text-muted-foreground">/session</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Personalized training focused on your unique strengths and development goals.
                  </p>
                  <DivButton 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handlePurchase('individual-training')}
                    disabled={isPending}
                  >
                    {isPending ? 'Processing...' : 'Register'}
                  </DivButton>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Skills Class</CardTitle>
                  <CardDescription className="text-muted-foreground">Fundamentals focus</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$15</span>
                    <span className="text-muted-foreground">/class</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Build a strong foundation with focused instruction on basketball fundamentals, footwork, and body control.
                  </p>
                  <DivButton 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handlePurchase('skills-class')}
                    disabled={isPending}
                  >
                    {isPending ? 'Processing...' : 'Register'}
                  </DivButton>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Special Programs */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Special Programs</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Seasonal camps and competitive team opportunities.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">On Field Workouts</CardTitle>
                  <CardDescription className="text-muted-foreground">Outdoor training</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$30</span>
                    <span className="text-muted-foreground">/session</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Outdoor conditioning and agility training to complement basketball skills.
                  </p>
                  <DivButton 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handlePurchase('on-field-workouts')}
                    disabled={isPending}
                  >
                    {isPending ? 'Processing...' : 'Register'}
                  </DivButton>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Summer Camp</CardTitle>
                  <CardDescription className="text-muted-foreground">Seasonal program</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$20</span>
                    <span className="text-muted-foreground">/day</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Intensive summer training with full-day sessions, skill work, and competition.
                  </p>
                  <DivButton 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handlePurchase('summer-camp')}
                    disabled={isPending}
                  >
                    {isPending ? 'Processing...' : 'Register'}
                  </DivButton>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Team Academy</CardTitle>
                  <CardDescription className="text-muted-foreground">Competitive travel team</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$300</span>
                    <span className="text-muted-foreground">/season</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Join our competitive teams. Includes uniforms, coaching, and tournament fees.
                  </p>
                  <DivButton 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handlePurchase('team-academy')}
                    disabled={isPending}
                  >
                    {isPending ? 'Processing...' : 'Register'}
                  </DivButton>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary/10">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Need Help Choosing?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Not sure which program is right for you? Contact us and we'll help you find the perfect fit.
              </p>
              <Link href="/contact">
                <Button type="button" size="lg" className="text-lg px-8">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
