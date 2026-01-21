import { Link } from "wouter";
import { Button } from "./ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, getClerkPublishableKey } from "@/const";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/clerk-react";

export default function Navigation() {
  const { user: dbUser, isAuthenticated, logout } = useAuth();
  const clerkPublishableKey = getClerkPublishableKey();
  
  // Always call useUser() unconditionally (hooks rule)
  // It will work since ClerkProvider is always rendered in main.tsx
  const { user: clerkUser, isSignedIn } = useUser();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use Clerk user if available and Clerk is configured, otherwise fall back to database user
  const user = (clerkPublishableKey && clerkUser) ? {
    id: parseInt(clerkUser.id) || 0,
    openId: clerkUser.id,
    name: clerkUser.fullName || clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || null,
    email: clerkUser.emailAddresses[0]?.emailAddress || null,
    role: (clerkUser.publicMetadata?.role as "user" | "admin") || "user",
  } : dbUser;
  
  const isAuthenticatedFinal = (clerkPublishableKey && isSignedIn) || isAuthenticated;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img src="/academy-logo.jpeg" alt="The Academy" className="h-10 w-10 rounded-full" />
            <span className="text-xl font-bold text-foreground">THE ACADEMY</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/programs" className="text-foreground hover:text-primary transition-colors">
              Programs
            </Link>
            <Link href="/about" className="text-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/gallery" className="text-foreground hover:text-primary transition-colors">
              Gallery
            </Link>
            <Link href="/videos" className="text-foreground hover:text-primary transition-colors">
              Videos
            </Link>
            <Link href="/shop" className="text-foreground hover:text-primary transition-colors">
              Shop
            </Link>
            <Link href="/faqs" className="text-foreground hover:text-primary transition-colors">
              FAQs
            </Link>
            <Link href="/contact" className="text-foreground hover:text-primary transition-colors">
              Contact
            </Link>
            
            {isAuthenticatedFinal ? (
              <>
                <Link href="/member" className="text-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="text-foreground hover:text-primary transition-colors">
                    Admin
                  </Link>
                )}
                {clerkPublishableKey ? (
                  <UserButton afterSignOutUrl="/" />
                ) : (
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                )}
              </>
            ) : (
              <>
                {clerkPublishableKey ? (
                  <>
                    <SignInButton mode="modal" afterSignInUrl="/">
                      <Button variant="outline" size="sm">Login</Button>
                    </SignInButton>
                    <SignUpButton mode="modal" afterSignUpUrl="/">
                      <Button variant="default" size="sm">Sign Up</Button>
                    </SignUpButton>
                  </>
                ) : (
                  <a href={getLoginUrl()} onClick={(e) => {
                    if (getLoginUrl() === "#") {
                      e.preventDefault();
                      alert("Authentication is not configured. Please set VITE_CLERK_PUBLISHABLE_KEY or OAuth credentials in your .env file.");
                    }
                  }}>
                    <Button variant="outline" size="sm" disabled={getLoginUrl() === "#"}>
                      Login
                    </Button>
                  </a>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link href="/" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="/programs" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Programs
              </Link>
              <Link href="/about" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
              <Link href="/gallery" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Gallery
              </Link>
              <Link href="/videos" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Videos
              </Link>
              <Link href="/shop" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Shop
              </Link>
              <Link href="/faqs" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                FAQs
              </Link>
              <Link href="/contact" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Contact
              </Link>
              
              {isAuthenticatedFinal ? (
                <>
                  <Link href="/member" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin" className="text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <a href={getLoginUrl()}>
                    <Button variant="outline" size="sm" className="w-full">
                      Login
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
