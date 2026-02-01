/**
 * Register Page - Form-Free Implementation
 * 
 * This page is specifically designed to avoid Safari iOS validation issues.
 * Key design decisions:
 * 1. NO <form> elements anywhere on the page
 * 2. NO <input type="email"> elements
 * 3. NO embedded Clerk auth widgets
 * 4. All buttons are <div role="button"> to avoid form submission behavior
 * 5. Sign-in is a link only, not an embedded form
 * 6. Email is collected by Stripe at checkout, not on this page
 */

import { useState, useCallback } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ShoppingCart, X, ArrowRight, Check, Users, User, Target, Dumbbell, Calendar, Trophy } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

// Product definitions matching server/products.ts
const PRODUCTS = [
  {
    id: "group-workout",
    name: "Group Workout",
    description: "Single session access to group workouts. Limited to 8 players.",
    price: 25,
    priceDisplay: "$25.00",
    unit: "/session",
    category: "session",
    badge: "Group",
    icon: Users,
  },
  {
    id: "individual-training",
    name: "Individual Training",
    description: "One-on-one training tailored to each athlete's goals.",
    price: 60,
    priceDisplay: "$60.00",
    unit: "/session",
    category: "session",
    badge: "1-on-1",
    icon: User,
  },
  {
    id: "shooting-lab",
    name: "Shooting Lab",
    description: "Dr Dish shooting machine session focused on technique and mechanics. Limited to 8 players.",
    price: 25,
    priceDisplay: "$25.00",
    unit: "/session",
    category: "session",
    badge: "Specialty",
    icon: Target,
  },
  {
    id: "saq-training",
    name: "SAQ Training",
    description: "Speed, Agility, and Quickness training for all sports.",
    price: 30,
    priceDisplay: "$30.00",
    unit: "/session",
    category: "session",
    badge: "Performance",
    icon: Dumbbell,
  },
  {
    id: "open-gym",
    name: "Open Gym",
    description: "Game-like experience with supervised play. Seasonal availability.",
    price: 15,
    priceDisplay: "$15.00",
    unit: "/session",
    category: "session",
    badge: "Seasonal",
    icon: Calendar,
  },
  {
    id: "monthly-unlimited",
    name: "Monthly Unlimited",
    description: "Unlimited access to all group sessions for one month.",
    price: 150,
    priceDisplay: "$150.00",
    unit: "/month",
    category: "membership",
    badge: "Best Value",
    icon: Trophy,
  },
  {
    id: "quarterly-unlimited",
    name: "Quarterly Unlimited",
    description: "Unlimited access to all group sessions for three months.",
    price: 400,
    priceDisplay: "$400.00",
    unit: "/quarter",
    category: "membership",
    badge: "Popular",
    icon: Trophy,
  },
];

// DivButton - A button that uses <div> to avoid form validation
interface DivButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

function DivButton({ onClick, disabled, variant = "primary", size = "md", className = "", children }: DivButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all cursor-pointer select-none";
  
  const variantStyles = {
    primary: "bg-[#CFB53B] text-black hover:bg-[#B8A235] active:bg-[#A08F2F]",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
    outline: "border-2 border-[#CFB53B] text-[#CFB53B] hover:bg-[#CFB53B] hover:text-black",
  };
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";
  
  const handleClick = useCallback(() => {
    if (disabled) return;
    // Use requestAnimationFrame to break any validation chain
    requestAnimationFrame(() => {
      onClick();
    });
  }, [disabled, onClick]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);
  
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      aria-disabled={disabled}
    >
      {children}
    </div>
  );
}

export default function Register() {
  const [cart, setCart] = useState<string[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  // Guest checkout mutation
  const checkoutMutation = trpc.payment.createGuestCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        // Clear cart before redirect
        setCart([]);
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      setIsCheckingOut(false);
      toast.error(error.message || "Failed to create checkout session. Please try again.");
    },
  });
  
  const addToCart = useCallback((productId: string) => {
    if (!cart.includes(productId)) {
      setCart(prev => [...prev, productId]);
      const product = PRODUCTS.find(p => p.id === productId);
      toast.success(`${product?.name} has been added to your cart.`);
    }
  }, [cart]);
  
  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(id => id !== productId));
  }, []);
  
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);
  
  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      toast.error("Please add items to your cart before checking out.");
      return;
    }
    
    setIsCheckingOut(true);
    
    // Use requestAnimationFrame to ensure we're outside any event handler chain
    requestAnimationFrame(() => {
      checkoutMutation.mutate({ productIds: cart });
    });
  }, [cart, checkoutMutation, toast]);
  
  const cartTotal = cart.reduce((sum, id) => {
    const product = PRODUCTS.find(p => p.id === id);
    return sum + (product?.price || 0);
  }, 0);
  
  const sessionProducts = PRODUCTS.filter(p => p.category === "session");
  const membershipProducts = PRODUCTS.filter(p => p.category === "membership");
  
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Register</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose your training program and register below. Email is collected securely at checkout.
          </p>
        </div>
        
        {/* Guest Checkout Notice */}
        <Card className="mb-8 border-[#CFB53B]/20 bg-[#CFB53B]/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-[#CFB53B]" />
                <span className="font-medium text-gray-900">Guest Checkout</span>
                <span className="text-gray-600">— Your email will be collected at checkout.</span>
              </div>
              <Link href="/sign-in" className="text-[#CFB53B] hover:underline font-medium flex items-center gap-1">
                Sign in for faster checkout <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Cart Section */}
        {cart.length > 0 && (
          <Card className="mb-8 border-2 border-[#CFB53B]/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Your Cart
              </CardTitle>
              <CardDescription>
                Select classes below, then checkout. Stripe will collect your email securely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cart.map(productId => {
                  const product = PRODUCTS.find(p => p.id === productId);
                  if (!product) return null;
                  return (
                    <div key={productId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="font-medium">{product.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">{product.priceDisplay}</span>
                        <DivButton
                          onClick={() => removeFromCart(productId)}
                          variant="secondary"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </DivButton>
                      </div>
                    </div>
                  );
                })}
                <Separator className="my-3" />
                <div className="flex items-center justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <DivButton
                  onClick={handleCheckout}
                  disabled={isCheckingOut || checkoutMutation.isPending}
                  variant="primary"
                  size="lg"
                  className="flex-1"
                >
                  {isCheckingOut || checkoutMutation.isPending ? (
                    <>Processing... <ArrowRight className="h-5 w-5" /></>
                  ) : (
                    <>Checkout <ArrowRight className="h-5 w-5" /></>
                  )}
                </DivButton>
                <DivButton
                  onClick={clearCart}
                  variant="outline"
                  size="lg"
                >
                  Clear Cart
                </DivButton>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Training Sessions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Training Sessions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessionProducts.map(product => {
              const Icon = product.icon;
              const isInCart = cart.includes(product.id);
              
              return (
                <Card key={product.id} className={`transition-all ${isInCart ? "ring-2 ring-[#CFB53B]" : ""}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary" className="mb-2">{product.badge}</Badge>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">{product.priceDisplay}</span>
                        <span className="text-gray-500 text-sm">{product.unit}</span>
                      </div>
                    </div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-[#CFB53B]" />
                      {product.name}
                    </CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DivButton
                      onClick={() => isInCart ? removeFromCart(product.id) : addToCart(product.id)}
                      variant={isInCart ? "secondary" : "primary"}
                      className="w-full"
                    >
                      {isInCart ? (
                        <><Check className="h-4 w-4" /> Added</>
                      ) : (
                        "Add to Cart"
                      )}
                    </DivButton>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
        
        {/* Memberships */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Memberships</h2>
          <p className="text-gray-600 mb-6">Best value for committed players. Unlimited access to group sessions.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {membershipProducts.map(product => {
              const Icon = product.icon;
              const isInCart = cart.includes(product.id);
              
              return (
                <Card key={product.id} className={`transition-all ${isInCart ? "ring-2 ring-[#CFB53B]" : ""}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary" className="mb-2">{product.badge}</Badge>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">{product.priceDisplay}</span>
                        <span className="text-gray-500 text-sm">{product.unit}</span>
                      </div>
                    </div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-[#CFB53B]" />
                      {product.name}
                    </CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DivButton
                      onClick={() => isInCart ? removeFromCart(product.id) : addToCart(product.id)}
                      variant={isInCart ? "secondary" : "primary"}
                      className="w-full"
                    >
                      {isInCart ? (
                        <><Check className="h-4 w-4" /> Added</>
                      ) : (
                        "Subscribe"
                      )}
                    </DivButton>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
        
        {/* Academy Travel Teams & Summer Camp */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Special Programs</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Badge variant="secondary" className="mb-2 w-fit">Offseason</Badge>
                <CardTitle>Academy Travel Teams</CardTitle>
                <CardDescription>
                  Competitive travel team experience during the offseason. Contact us for availability and pricing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/contact" className="inline-flex items-center gap-2 text-[#CFB53B] hover:underline font-medium">
                  Contact for Details <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Badge variant="secondary" className="mb-2 w-fit">Summer</Badge>
                <CardTitle>Academy Summer Camp</CardTitle>
                <CardDescription>
                  3rd Annual Summer Camp at Sumner Academy. $200 for the week ($20 deposit included, $180 due after deposit).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/contact" className="inline-flex items-center gap-2 text-[#CFB53B] hover:underline font-medium">
                  Register for Camp <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
