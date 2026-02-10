import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, getClerkPublishableKey } from "@/const";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import type { MouseEvent } from "react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { SearchBar } from "./SearchBar";
import { logger } from "@/lib/logger";
import { useClerkState } from "@/contexts/ClerkStateContext";

export default function Navigation() {
  const { user: dbUser, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const clerkPublishableKey = getClerkPublishableKey();
  const {
    user: clerkUser,
    isSignedIn,
    isEnabled: isClerkEnabled,
  } = useClerkState();
  const loginUrl = getLoginUrl();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const handleClickOutside = (event: globalThis.MouseEvent) => {
      const target = event.target as Node;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  // Prefer Clerk user when enabled; otherwise fall back to database user
  const user =
    clerkPublishableKey && clerkUser
      ? {
          id: parseInt(clerkUser.id) || 0,
          openId: clerkUser.id,
          name:
            clerkUser.fullName ||
            clerkUser.firstName ||
            clerkUser.emailAddresses[0]?.emailAddress ||
            null,
          email: clerkUser.emailAddresses[0]?.emailAddress || null,
          role: (clerkUser.publicMetadata?.role as "user" | "admin") || "user",
        }
      : dbUser;

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

  const getLinkClassName = (path: string, isRegister = false, isMobile = false) => {
    // Pixel-perfect: consistent 2px underline, aligned insets, proper vertical rhythm
    if (isMobile) {
      // Mobile: 44px+ tap targets, full-width links
      const mobileBase = "block px-4 py-3 text-base font-medium rounded-lg transition-colors";
      const mobileActive = isActiveRoute(path) ? "text-primary bg-primary/5" : "text-foreground hover:bg-muted/50 active:bg-muted";
      const mobileRegister = isRegister ? "text-primary font-semibold" : "";
      return [mobileBase, mobileActive, mobileRegister].filter(Boolean).join(" ");
    }
    
    const baseClasses = "relative text-foreground hover:text-primary transition-all duration-200 py-2 text-sm font-medium";
    const hoverUnderline = "hover:after:absolute hover:after:bottom-0 hover:after:left-1 hover:after:right-1 hover:after:h-[2px] hover:after:bg-primary/30 hover:after:rounded-full";
    const activeUnderline = "text-primary font-semibold after:absolute after:bottom-0 after:left-1 after:right-1 after:h-[2px] after:bg-primary after:rounded-full";
    const registerAccent = isRegister ? "text-primary font-semibold hover:text-primary/80" : "";
    
    return [
      baseClasses,
      hoverUnderline,
      isActiveRoute(path) ? activeUnderline : "",
      registerAccent,
    ]
      .filter(Boolean)
      .join(" ");
  };

  const handleAuthLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (loginUrl === "#") {
      event.preventDefault();
      logger.warn(
        "Authentication is not configured. Set VITE_CLERK_PUBLISHABLE_KEY or OAuth credentials."
      );
      if (import.meta.env.DEV) {
        alert(
          "Authentication is not configured. Please set VITE_CLERK_PUBLISHABLE_KEY or OAuth credentials in your .env file."
        );
      }
    }
  };

  const isHomePage = location === "/";

  return (
    <nav 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled || !isHomePage
          ? "bg-card/95 backdrop-blur-lg border-b border-border/50 shadow-sm" 
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo - aligned baseline with nav items */}
          <Link href="/" className="flex items-center gap-3 py-1">
            <img
              src="/academy-logo.jpeg"
              alt="The Academy"
              className="h-9 w-9 rounded-full"
            />
            <span className="text-lg font-bold text-foreground tracking-tight">
              THE ACADEMY
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={getLinkClassName("/")}
              aria-current={isActiveRoute("/") ? "page" : undefined}
            >
              Home
            </Link>
            <Link
              href="/programs"
              className={getLinkClassName("/programs")}
              aria-current={isActiveRoute("/programs") ? "page" : undefined}
            >
              Programs
            </Link>
            <Link
              href="/performance-lab"
              className={getLinkClassName("/performance-lab")}
              aria-current={isActiveRoute("/performance-lab") ? "page" : undefined}
            >
              Performance Lab
            </Link>
            <Link
              href="/skills-lab"
              className={getLinkClassName("/skills-lab")}
              aria-current={isActiveRoute("/skills-lab") ? "page" : undefined}
            >
              Skills Lab
            </Link>
            <Link
              href="/schedule"
              className={getLinkClassName("/schedule")}
              aria-current={isActiveRoute("/schedule") ? "page" : undefined}
            >
              Schedule
            </Link>
            <Link
              href="/about"
              className={getLinkClassName("/about")}
              aria-current={isActiveRoute("/about") ? "page" : undefined}
            >
              About
            </Link>
            <Link
              href="/gallery"
              className={getLinkClassName("/gallery")}
              aria-current={isActiveRoute("/gallery") ? "page" : undefined}
            >
              Gallery
            </Link>
            <Link
              href="/shop"
              className={getLinkClassName("/shop")}
              aria-current={isActiveRoute("/shop") ? "page" : undefined}
            >
              Shop
            </Link>
            <Link
              href="/blog"
              className={getLinkClassName("/blog")}
              aria-current={isActiveRoute("/blog") ? "page" : undefined}
            >
              Blog
            </Link>
            <Link
              href="/faqs"
              className={getLinkClassName("/faqs")}
              aria-current={isActiveRoute("/faqs") ? "page" : undefined}
            >
              FAQs
            </Link>
            <Link
              href="/contact"
              className={getLinkClassName("/contact")}
              aria-current={isActiveRoute("/contact") ? "page" : undefined}
            >
              Contact
            </Link>

            {isAuthenticatedFinal ? (
              <>
                <Link
                  href="/member"
                  className={getLinkClassName("/member")}
                  aria-current={isActiveRoute("/member") ? "page" : undefined}
                >
                  Dashboard
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className={getLinkClassName("/admin")}
                    aria-current={isActiveRoute("/admin") ? "page" : undefined}
                  >
                    Admin
                  </Link>
                )}
                {clerkPublishableKey && isClerkEnabled ? (
                  <UserButton afterSignOutUrl="/" />
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={handleLogout} formNoValidate>
                    Logout
                  </Button>
                )}
              </>
            ) : (
              <>
                {clerkPublishableKey && isClerkEnabled ? (
                  <>
                    <SignInButton mode="modal" fallbackRedirectUrl="/">
                      <Button type="button" variant="outline" size="sm" formNoValidate>
                        Login
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal" fallbackRedirectUrl="/">
                      <Button type="button" variant="default" size="sm" formNoValidate>
                        Sign Up
                      </Button>
                    </SignUpButton>
                  </>
                ) : loginUrl !== "#" ? (
                  <a href={loginUrl} onClick={handleAuthLinkClick}>
                    <Button type="button" variant="outline" size="sm" formNoValidate>
                      Login
                    </Button>
                  </a>
                ) : null}
              </>
            )}
          </div>

          {/* Mobile Menu Button - 44px tap target for accessibility */}
          <button
            type="button"
            ref={mobileMenuButtonRef}
            className="md:hidden text-foreground w-11 h-11 flex items-center justify-center -mr-2 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            id="mobile-menu"
            className="md:hidden py-4 border-t border-border/50 bg-card/95 backdrop-blur-lg"
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Mobile links with 44px+ tap targets */}
            <div className="flex flex-col gap-1 px-2">
              <div className="px-4 pb-2">
                <SearchBar />
              </div>
              <Link
                href="/"
                className={getLinkClassName("/", false, true)}
                aria-current={isActiveRoute("/") ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/programs"
                className={getLinkClassName("/programs", false, true)}
                aria-current={isActiveRoute("/programs") ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                Programs
              </Link>
              <Link
                href="/performance-lab"
                className={getLinkClassName("/performance-lab", false, true)}
                aria-current={isActiveRoute("/performance-lab") ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                Performance Lab
              </Link>
              <Link
                href="/skills-lab"
                className={getLinkClassName("/skills-lab", false, true)}
                aria-current={isActiveRoute("/skills-lab") ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                Skills Lab
              </Link>
              <Link
                href="/schedule"
                className={getLinkClassName("/schedule", false, true)}
                aria-current={isActiveRoute("/schedule") ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                Schedule
              </Link>
              <Link
                href="/about"
                className={getLinkClassName("/about", false, true)}
                aria-current={isActiveRoute("/about") ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/gallery"
                className={getLinkClassName("/gallery", false, true)}
                aria-current={isActiveRoute("/gallery") ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                Gallery
              </Link>
              <Link
                href="/shop"
                className={getLinkClassName("/shop", false, true)}
                aria-current={isActiveRoute("/shop") ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link
                href="/blog"
                className={getLinkClassName("/blog", false, true)}
                aria-current={isActiveRoute("/blog") ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/faqs"
                className={getLinkClassName("/faqs", false, true)}
                aria-current={isActiveRoute("/faqs") ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQs
              </Link>
              <Link
                href="/contact"
                className={getLinkClassName("/contact", false, true)}
                aria-current={isActiveRoute("/contact") ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>

              {isAuthenticatedFinal ? (
                <>
                  <Link
                    href="/member"
                    className={getLinkClassName("/member", false, true)}
                    aria-current={isActiveRoute("/member") ? "page" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      className={getLinkClassName("/admin", false, true)}
                      aria-current={
                        isActiveRoute("/admin") ? "page" : undefined
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full mt-2 h-11"
                    formNoValidate
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  {clerkPublishableKey && isClerkEnabled ? (
                    <>
                      <SignInButton mode="modal" fallbackRedirectUrl="/">
                        <Button type="button" variant="outline" size="sm" className="w-full" formNoValidate>
                          Login
                        </Button>
                      </SignInButton>
                      <SignUpButton mode="modal" fallbackRedirectUrl="/">
                        <Button type="button" variant="default" size="sm" className="w-full" formNoValidate>
                          Sign Up
                        </Button>
                      </SignUpButton>
                    </>
                  ) : loginUrl !== "#" ? (
                    <a href={loginUrl} onClick={handleAuthLinkClick}>
                      <Button type="button" variant="outline" size="sm" className="w-full" formNoValidate>
                        Login
                      </Button>
                    </a>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
