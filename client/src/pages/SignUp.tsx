import { Link, useSearch } from "wouter";
import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getClerkPublishableKey, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatUsd } from "@shared/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MEMBERSHIP_PRODUCTS = [
  {
    id: "academy-group-membership",
    name: "Academy Group Membership",
    description: "Unlimited group sessions",
    price: 150,
    intervalLabel: "/month",
    badge: "POPULAR",
    features: [
      "Unlimited group workout sessions",
      "Small group sizes (max 8 players)",
      "Competitive training environment",
      "Youth athletes of all levels",
    ],
  },
  {
    id: "complete-player-membership",
    name: "Complete Player Membership",
    description: "Unlimited skills classes + open gyms",
    price: 100,
    intervalLabel: "/month",
    badge: "BEST VALUE",
    features: [
      "Unlimited skills classes",
      "Unlimited open gym access",
      "Shooting lab access included",
      "Youth athletes of all levels",
    ],
  },
];

const ONE_TIME_PRODUCTS = [
  {
    id: "group-workout",
    name: "Group Workout",
    description: "Single session access to group workouts. Limited to 8 players.",
    price: 25,
    badge: "Group",
    unitLabel: "/session",
  },
  {
    id: "individual-training",
    name: "Individual Training",
    description: "One-on-one coaching tailored to each athlete's goals.",
    price: 60,
    badge: "1-on-1",
    unitLabel: "/session",
  },
  {
    id: "skills-class",
    name: "Skills Class",
    description: "Focused instruction on fundamentals, footwork, and body control.",
    price: 15,
    badge: "Skills",
    unitLabel: "/class",
  },
  {
    id: "on-field-workouts",
    name: "On Field Workouts",
    description: "Outdoor conditioning and agility training to complement basketball skills.",
    price: 30,
    badge: "Outdoor",
    unitLabel: "/session",
  },
  {
    id: "summer-camp",
    name: "Summer Camp",
    description: "Intensive summer training with full-day sessions, skill work, and competition.",
    price: 20,
    badge: "Camp",
    unitLabel: "/day",
  },
  {
    id: "team-academy",
    name: "Team Academy",
    description: "Competitive travel team registration including uniforms and coaching.",
    price: 300,
    badge: "Team",
    unitLabel: "/season",
  },
];

const INDIVIDUAL_PRODUCTS = ONE_TIME_PRODUCTS.slice(0, 3);
const SPECIAL_PRODUCTS = ONE_TIME_PRODUCTS.slice(3);

// Enhanced debug validation detector - shows which element is failing validation
// Only active when ?debugValidation=1 is in the URL
// Captures: invalid, submit, click events and reportValidity/checkValidity calls
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
      max-height: 250px;
      overflow-y: auto;
      background: rgba(0,0,0,0.95);
      color: #0f0;
      font-family: monospace;
      font-size: 10px;
      padding: 10px;
      z-index: 99999;
      border-radius: 8px;
    `;
    debugOverlay.innerHTML = '<div style="color:#ff0;margin-bottom:5px;">VALIDATION DEBUG MODE ACTIVE</div>';
    document.body.appendChild(debugOverlay);

    const logToOverlay = (msg: string, color = '#0f0') => {
      const line = document.createElement('div');
      line.style.color = color;
      line.textContent = `${new Date().toISOString().slice(11, 23)} ${msg}`;
      debugOverlay.appendChild(line);
      debugOverlay.scrollTop = debugOverlay.scrollHeight;
    };

    const getElementInfo = (el: Element) => {
      const input = el as HTMLInputElement;
      const outerHTML = el.outerHTML || "";
      return {
        tagName: el.tagName,
        id: el.id || '(none)',
        name: input.name || '(none)',
        type: input.type || '(none)',
        inputMode: input.inputMode || '(none)',
        required: input.required,
        pattern: input.pattern || '(none)',
        valueLength: input.value?.length ?? 0,
        willValidate: input.willValidate,
        validationMessage: input.validationMessage,
        outerHTML: outerHTML.length > 300 ? `${outerHTML.slice(0, 300)}…` : outerHTML,
      };
    };

    // Capture invalid events at document level
    const handleInvalid = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const info = getElementInfo(e.target as Element);
      logToOverlay(`INVALID: ${JSON.stringify(info)}`, '#f00');
    };

    // Capture submit events
    const handleSubmit = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const form = e.target as HTMLFormElement;
      logToOverlay(`SUBMIT BLOCKED: form#${form.id || '?'} action=${form.action || '(none)'}`, '#ff0');
    };

    // Capture click events to see what triggers validation
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const btn = (target.tagName === 'BUTTON' ? target : target.closest('button')) as HTMLButtonElement;
        logToOverlay(`CLICK: button#${btn.id || '?'} type=${btn.type} form=${btn.form?.id || '(none)'}`, '#0ff');
      }
    };

    // Scan for any element that would fail validation
    const scanForInvalidElements = () => {
      const elements = document.querySelectorAll('input, select, textarea');
      const failing: string[] = [];
      elements.forEach((el) => {
        const input = el as HTMLInputElement;
        // Use try-catch because checkValidity might throw in some edge cases
        try {
          if (input.willValidate && !input.checkValidity()) {
            failing.push(`${input.tagName}#${input.id || '?'}[name=${input.name || '?'}][type=${input.type}] msg="${input.validationMessage}"`);
          }
        } catch (err) {
          failing.push(`${input.tagName}#${input.id || '?'} ERROR: ${err}`);
        }
      });
      if (failing.length > 0) {
        logToOverlay(`SCAN FOUND ${failing.length} FAILING: ${failing.join(', ')}`, '#f00');
      } else {
        logToOverlay('SCAN: No failing elements found', '#0f0');
      }
      return failing;
    };

    // Log all form-associated elements on page load
    const logAllFormElements = () => {
      const forms = document.querySelectorAll('form');
      logToOverlay(`FORMS: Found ${forms.length} form elements`, forms.length > 0 ? '#ff0' : '#0f0');
      forms.forEach((form, i) => {
        logToOverlay(`  [form ${i}] id=${form.id || '?'} noValidate=${form.noValidate}`, '#ff0');
      });

      const elements = document.querySelectorAll('input, select, textarea, button');
      logToOverlay(`ELEMENTS: Found ${elements.length} form-associated elements`);
      elements.forEach((el, i) => {
        const input = el as HTMLInputElement;
        const hasValidation = input.required || input.pattern || input.type === 'email';
        logToOverlay(`  [${i}] ${input.tagName}#${input.id || '?'} type=${input.type || '?'} req=${input.required} pat=${input.pattern || '-'} willVal=${input.willValidate}`, hasValidation ? '#ff0' : '#888');
      });
    };

    const wrapValidityMethod = <T extends Record<"reportValidity" | "checkValidity", (...args: any[]) => any>>(
      prototype: T,
      method: "reportValidity" | "checkValidity",
      label: string
    ) => {
      const original = prototype[method];
      prototype[method] = function (...args: any[]) {
        const info = getElementInfo(this as unknown as Element);
        logToOverlay(`${label}.${method} called: ${JSON.stringify(info)}`, "#0ff");
        try {
          const result = original.apply(this, args as []);
          logToOverlay(`${label}.${method} result: ${result}`, "#0f0");
          return result;
        } catch (error) {
          logToOverlay(`${label}.${method} ERROR: ${error}`, "#f00");
          throw error;
        }
      };
      return () => {
        prototype[method] = original;
      };
    };

    const restoreMethods = [
      wrapValidityMethod(HTMLFormElement.prototype, "reportValidity", "FORM"),
      wrapValidityMethod(HTMLFormElement.prototype, "checkValidity", "FORM"),
      wrapValidityMethod(HTMLInputElement.prototype, "reportValidity", "INPUT"),
      wrapValidityMethod(HTMLInputElement.prototype, "checkValidity", "INPUT"),
      wrapValidityMethod(HTMLSelectElement.prototype, "reportValidity", "SELECT"),
      wrapValidityMethod(HTMLSelectElement.prototype, "checkValidity", "SELECT"),
      wrapValidityMethod(HTMLTextAreaElement.prototype, "reportValidity", "TEXTAREA"),
      wrapValidityMethod(HTMLTextAreaElement.prototype, "checkValidity", "TEXTAREA"),
    ];

    document.addEventListener('invalid', handleInvalid, true);
    document.addEventListener('submit', handleSubmit, true);
    document.addEventListener('click', handleClick, true);
    
    // Expose scan function globally for manual testing
    (window as any).__scanValidation = scanForInvalidElements;
    (window as any).__logElements = logAllFormElements;
    
    // Log elements after a short delay to catch dynamically added ones
    setTimeout(logAllFormElements, 500);
    setTimeout(logAllFormElements, 2000); // Re-scan after Clerk/Stripe might inject elements

    return () => {
      document.removeEventListener('invalid', handleInvalid, true);
      document.removeEventListener('submit', handleSubmit, true);
      document.removeEventListener('click', handleClick, true);
      restoreMethods.forEach((restore) => restore());
      delete (window as any).__scanValidation;
      delete (window as any).__logElements;
      debugOverlay.remove();
    };
  }, [isDebugMode]);

  return isDebugMode;
}

// PHASE B: Hard stop Safari validation on /signup
// This hook makes /signup completely immune to HTML constraint validation
// by overriding prototype methods and capturing all validation-related events
function useValidationHardStop(isDebugMode: boolean) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    // Store original prototype methods
    const originalReportValidity = HTMLFormElement.prototype.reportValidity;
    const originalCheckValidity = HTMLFormElement.prototype.checkValidity;
    const originalInputReportValidity = HTMLInputElement.prototype.reportValidity;
    const originalInputCheckValidity = HTMLInputElement.prototype.checkValidity;
    const originalSelectReportValidity = HTMLSelectElement.prototype.reportValidity;
    const originalSelectCheckValidity = HTMLSelectElement.prototype.checkValidity;
    const originalTextAreaReportValidity = HTMLTextAreaElement.prototype.reportValidity;
    const originalTextAreaCheckValidity = HTMLTextAreaElement.prototype.checkValidity;

    if (!isDebugMode) {
      // Override form validation methods to always return true on /signup
      HTMLFormElement.prototype.reportValidity = function() {
        return true;
      };
      HTMLFormElement.prototype.checkValidity = function() {
        return true;
      };

      // Override input validation methods
      HTMLInputElement.prototype.reportValidity = function() {
        return true;
      };
      HTMLInputElement.prototype.checkValidity = function() {
        return true;
      };

      // Override select validation methods
      HTMLSelectElement.prototype.reportValidity = function() {
        return true;
      };
      HTMLSelectElement.prototype.checkValidity = function() {
        return true;
      };

      // Override textarea validation methods
      HTMLTextAreaElement.prototype.reportValidity = function() {
        return true;
      };
      HTMLTextAreaElement.prototype.checkValidity = function() {
        return true;
      };
    }

    // Capture and suppress submit events
    const suppressSubmit = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    // Capture and suppress invalid events
    const suppressInvalid = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    // Add novalidate to all forms on the page
    const addNoValidateToForms = () => {
      if (isDebugMode) {
        return;
      }
      document.querySelectorAll('form').forEach(form => {
        form.setAttribute('novalidate', 'true');
        form.noValidate = true;
      });
    };

    // Run immediately and observe for new forms
    addNoValidateToForms();

    // MutationObserver to catch dynamically added forms
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLFormElement && !isDebugMode) {
            node.setAttribute('novalidate', 'true');
            node.noValidate = true;
          }
          if (node instanceof HTMLElement) {
            if (!isDebugMode) {
              node.querySelectorAll('form').forEach(form => {
                form.setAttribute('novalidate', 'true');
                form.noValidate = true;
              });
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Add event listeners in capture phase
    document.addEventListener('submit', suppressSubmit, true);
    document.addEventListener('invalid', suppressInvalid, true);

    return () => {
      // Restore original prototype methods
      HTMLFormElement.prototype.reportValidity = originalReportValidity;
      HTMLFormElement.prototype.checkValidity = originalCheckValidity;
      HTMLInputElement.prototype.reportValidity = originalInputReportValidity;
      HTMLInputElement.prototype.checkValidity = originalInputCheckValidity;
      HTMLSelectElement.prototype.reportValidity = originalSelectReportValidity;
      HTMLSelectElement.prototype.checkValidity = originalSelectCheckValidity;
      HTMLTextAreaElement.prototype.reportValidity = originalTextAreaReportValidity;
      HTMLTextAreaElement.prototype.checkValidity = originalTextAreaCheckValidity;

      // Remove event listeners
      document.removeEventListener('submit', suppressSubmit, true);
      document.removeEventListener('invalid', suppressInvalid, true);

      // Disconnect observer
      observer.disconnect();
    };
  }, [isDebugMode]);
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
  const [cartItems, setCartItems] = useState<string[]>([]);
  const productLookup = useMemo(
    () => new Map(ONE_TIME_PRODUCTS.map((product) => [product.id, product])),
    []
  );
  
  // Enable debug mode with ?debugValidation=1
  const isDebugMode = useValidationDebugger();

  // PHASE B: Hard stop Safari validation on /signup
  // This overrides prototype methods and captures all validation events
  // to make /signup completely immune to HTML constraint validation
  useValidationHardStop(isDebugMode);

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

  const cartDetails = useMemo(
    () =>
      cartItems
        .map((id) => productLookup.get(id))
        .filter((item): item is (typeof ONE_TIME_PRODUCTS)[number] => Boolean(item)),
    [cartItems, productLookup]
  );
  const cartTotal = useMemo(
    () => cartDetails.reduce((sum, item) => sum + item.price, 0),
    [cartDetails]
  );

  const toggleCartItem = useCallback((productId: string) => {
    setCartItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Simplified checkout handler - no email collection on this page
  // Stripe Checkout will collect email natively
  const handleCheckout = (productIds: string[]) => {
    const normalized = productIds.map((id) => id.trim()).filter(Boolean);
    if (normalized.length === 0) {
      toast.error("Select at least one program to continue.");
      return;
    }

    const baseFingerprint = normalized.slice().sort().join("|");
    
    if (isAuthenticated) {
      // Authenticated user - use their account email
      const authFingerprint = `auth:${baseFingerprint}`;
      const existingKey = checkoutKeyRef.current.get(authFingerprint);
      const idempotencyKey = existingKey ?? crypto.randomUUID();
      if (!existingKey) {
        checkoutKeyRef.current.set(authFingerprint, idempotencyKey);
      }
      createCheckout.mutate({ productIds: normalized, idempotencyKey });
    } else {
      // Guest user - Stripe will collect email
      const guestFingerprint = `guest:${baseFingerprint}`;
      const existingKey = checkoutKeyRef.current.get(guestFingerprint);
      const idempotencyKey = existingKey ?? crypto.randomUUID();
      if (!existingKey) {
        checkoutKeyRef.current.set(guestFingerprint, idempotencyKey);
      }
      createGuestCheckout.mutate({ productIds: normalized, idempotencyKey });
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

        {/* Cart */}
        <section className="py-10">
          <div className="container">
            <Card className="bg-card border-border max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-foreground text-2xl">Your Class Cart</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Select one or more classes below, then check out with Stripe (email collected at checkout).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cartDetails.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No classes selected yet. Tap “Add to cart” on any class to build your registration.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <ul className="space-y-2">
                      {cartDetails.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between text-sm text-foreground"
                        >
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">{formatUsd(item.price)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-semibold">
                      <span>Total</span>
                      <span>{formatUsd(cartTotal)}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-6">
                  <div className="flex items-center gap-3">
                    <DivButton
                      className="w-full sm:w-auto"
                      size="lg"
                      onClick={() => handleCheckout(cartItems)}
                      disabled={cartItems.length === 0 || isPending}
                    >
                      {isPending ? "Processing..." : "Checkout Selected Classes"}
                    </DivButton>
                    {cartItems.length > 0 && (
                      <Button type="button" variant="ghost" onClick={clearCart}>
                        Clear cart
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Memberships are monthly subscriptions and check out separately.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Memberships */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Memberships</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Best value for committed players. Unlimited access to programs throughout the month.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {MEMBERSHIP_PRODUCTS.map((product) => (
                <Card key={product.id} className="bg-card border-2 border-primary relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">{product.badge}</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-foreground text-2xl">{product.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">{product.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-primary">{formatUsd(product.price)}</span>
                      <span className="text-muted-foreground">{product.intervalLabel}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {product.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="text-primary mt-0.5 flex-shrink-0" size={20} />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <DivButton 
                      className="w-full" 
                      size="lg"
                      onClick={() => handleCheckout([product.id])}
                      disabled={isPending}
                    >
                      {isPending ? 'Processing...' : 'Register Now'}
                    </DivButton>
                  </CardContent>
                </Card>
              ))}
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
              {INDIVIDUAL_PRODUCTS.map((product) => {
                const isSelected = cartItems.includes(product.id);
                return (
                  <Card key={product.id} className="bg-background border-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-foreground">{product.name}</CardTitle>
                        <Badge variant="outline">{product.badge}</Badge>
                      </div>
                      <CardDescription className="text-muted-foreground">One-time registration</CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl font-bold text-primary">{formatUsd(product.price)}</span>
                        <span className="text-muted-foreground">{product.unitLabel}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-6">
                        {product.description}
                      </p>
                      <Button
                        type="button"
                        variant={isSelected ? "secondary" : "outline"}
                        className="w-full"
                        onClick={() => toggleCartItem(product.id)}
                        disabled={isPending}
                      >
                        {isSelected ? "Remove from cart" : "Add to cart"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
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
              {SPECIAL_PRODUCTS.map((product) => {
                const isSelected = cartItems.includes(product.id);
                return (
                  <Card key={product.id} className="bg-card border-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-foreground">{product.name}</CardTitle>
                        <Badge variant="outline">{product.badge}</Badge>
                      </div>
                      <CardDescription className="text-muted-foreground">One-time registration</CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl font-bold text-primary">{formatUsd(product.price)}</span>
                        <span className="text-muted-foreground">{product.unitLabel}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-6">
                        {product.description}
                      </p>
                      <Button
                        type="button"
                        variant={isSelected ? "secondary" : "outline"}
                        className="w-full"
                        onClick={() => toggleCartItem(product.id)}
                        disabled={isPending}
                      >
                        {isSelected ? "Remove from cart" : "Add to cart"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
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
