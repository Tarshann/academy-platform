import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, getClerkPublishableKey } from "@/const";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import type { MouseEvent } from "react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { SearchBar } from "./SearchBar";
import { logger } from "@/lib/logger";
import { useClerkState } from "@/contexts/ClerkStateContext";

export default function Navigation() {
  const { user: dbUser, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const clerkPublishableKey = getClerkPublishableKey();
  const { user: clerkUser, isSignedIn, isEnabled: isClerkEnabled } = useClerkState();
  const loginUrl = getLoginUrl();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Prefer Clerk user when enabled; otherwise fall back to database user
  const user = (clerkPublishableKey && clerkUser) ? {
    id: parseInt(clerkUser.id) || 0,
    openId: clerkUser.id,
    name: clerkUser.fullName || clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || null,
    email: clerkUser.emailAddresses[0]?.emailAddress || null,
    role: (clerkUser.publicMetadata?.role as "user" | "admin") || "user",
  } : dbUser;
  
  const isAuthenticatedFinal =
    (clerkPublishableKey && isClerkEnabled && isSignedIn) || isAuthenticated;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const isActiveRoute = (path: string) => {
    if (path === "/") return location === "/";
    return location === path || location.startsWith(`${path}/`);
  };

  const getLinkClassName = (path: string) =>
    [
      "text-foreground hover:text-primary transition-colors",
      isActiveRoute(path) ? "text-primary font-semibold" : "",
    ]
      .filter(Boolean)
      .join(" ");

  const handleAuthLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (loginUrl === "#") {
      event.preventDefault();
      logger.warn("Authentication is not configured. Set VITE_CLERK_PUBLISHABLE_KEY or OAuth credentials.");
      if (import.meta.env.DEV) {
        alert(
          "Authentication is not configured. Please set VITE_CLERK_PUBLISHABLE_KEY or OAuth credentials in your .env file."
        );
      }
    }
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
            <Link href="/" className={getLinkClassName("/")} aria-current={isActiveRoute("/") ? "page" : undefined}>
              Home
            </Link>
            <Link href="/programs" className={getLinkClassName("/programs")} aria-current={isActiveRoute("/programs") ? "page" : undefined}>
              Programs
            </Link>
            <Link href="/signup" className={getLinkClassName("/signup")} aria-current={isActiveRoute("/signup") ? "page" : undefined}>
              Register
            </Link>
            <Link href="/about" className={getLinkClassName("/about")} aria-current={isActiveRoute("/about") ? "page" : undefined}>
              About
            </Link>
            <Link href="/gallery" className={getLinkClassName("/gallery")} aria-current={isActiveRoute("/gallery") ? "page" : undefined}>
              Gallery
            </Link>
            <Link href="/videos" className={getLinkClassName("/videos")} aria-current={isActiveRoute("/videos") ? "page" : undefined}>
              Videos
            </Link>
            <Link href="/shop" className={getLinkClassName("/shop")} aria-current={isActiveRoute("/shop") ? "page" : undefined}>
              Shop
            </Link>
            <Link href="/blog" className={getLinkClassName("/blog")} aria-current={isActiveRoute("/blog") ? "page" : undefined}>
              Blog
            </Link>
            <Link href="/faqs" className={getLinkClassName("/faqs")} aria-current={isActiveRoute("/faqs") ? "page" : undefined}>
              FAQs
            </Link>
            <Link href="/contact" className={getLinkClassName("/contact")} aria-current={isActiveRoute("/contact") ? "page" : undefined}>
              Contact
            </Link>
            
            {isAuthenticatedFinal ? (
              <>
                <Link href="/member" className={getLinkClassName("/member")} aria-current={isActiveRoute("/member") ? "page" : undefined}>
                  Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className={getLinkClassName("/admin")} aria-current={isActiveRoute("/admin") ? "page" : undefined}>
                    Admin
                  </Link>
                )}
                {clerkPublishableKey && isClerkEnabled ? (
                  <UserButton afterSignOutUrl="/" />
                ) : (
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                )}
              </>
            ) : (
              <>
                {clerkPublishableKey && isClerkEnabled ? (
                  <>
                    <SignInButton mode="modal" afterSignInUrl="/">
                      <Button variant="outline" size="sm">Login</Button>
                    </SignInButton>
                    <SignUpButton mode="modal" afterSignUpUrl="/">
                      <Button variant="default" size="sm">Sign Up</Button>
                    </SignUpButton>
                  </>
                ) : (
                  <a href={loginUrl} onClick={handleAuthLinkClick}>
                    <Button variant="outline" size="sm" disabled={loginUrl === "#"}>
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
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            id="mobile-menu"
            className="md:hidden py-4 border-t border-border"
            role="menu"
            aria-label="Main navigation"
          >
            <div className="flex flex-col gap-4">
              <div className="px-4 pb-2">
                <SearchBar />
              </div>
              <Link href="/" className={getLinkClassName("/")} aria-current={isActiveRoute("/") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="/programs" className={getLinkClassName("/programs")} aria-current={isActiveRoute("/programs") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                Programs
              </Link>
              <Link href="/signup" className={getLinkClassName("/signup")} aria-current={isActiveRoute("/signup") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                Register
              </Link>
              <Link href="/about" className={getLinkClassName("/about")} aria-current={isActiveRoute("/about") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
              <Link href="/gallery" className={getLinkClassName("/gallery")} aria-current={isActiveRoute("/gallery") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                Gallery
              </Link>
              <Link href="/videos" className={getLinkClassName("/videos")} aria-current={isActiveRoute("/videos") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                Videos
              </Link>
              <Link href="/shop" className={getLinkClassName("/shop")} aria-current={isActiveRoute("/shop") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                Shop
              </Link>
              <Link href="/blog" className={getLinkClassName("/blog")} aria-current={isActiveRoute("/blog") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                Blog
              </Link>
              <Link href="/faqs" className={getLinkClassName("/faqs")} aria-current={isActiveRoute("/faqs") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                FAQs
              </Link>
              <Link href="/contact" className={getLinkClassName("/contact")} aria-current={isActiveRoute("/contact") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                Contact
              </Link>
              
              {isAuthenticatedFinal ? (
                <>
                  <Link href="/member" className={getLinkClassName("/member")} aria-current={isActiveRoute("/member") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin" className={getLinkClassName("/admin")} aria-current={isActiveRoute("/admin") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  {clerkPublishableKey && isClerkEnabled ? (
                    <>
                      <SignInButton mode="modal" afterSignInUrl="/">
                        <Button variant="outline" size="sm" className="w-full">Login</Button>
                      </SignInButton>
                      <SignUpButton mode="modal" afterSignUpUrl="/">
                        <Button variant="default" size="sm" className="w-full">Sign Up</Button>
                      </SignUpButton>
                    </>
                  ) : (
                    <a href={loginUrl} onClick={handleAuthLinkClick}>
                      <Button variant="outline" size="sm" className="w-full" disabled={loginUrl === "#"}>
                        Login
                      </Button>
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
