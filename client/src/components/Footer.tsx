import { useState } from "react";
import { Link } from "wouter";
import { Facebook, Instagram, MapPin, Clock, Mail, Phone, MessageCircle } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <>
      {/* Floating SMS button — mobile only */}
      <a
        href="sms:+15712920633?body=Hi%2C%20I%27m%20interested%20in%20The%20Academy%20programs"
        className="fixed bottom-5 right-5 z-40 md:hidden w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
        aria-label="Text us"
      >
        <MessageCircle size={24} />
      </a>

    <footer className="bg-card border-t border-border mt-auto">
      {/* Gold accent line at top */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
      
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/academy-logo.jpeg"
                alt="The Academy"
                className="h-10 w-10 rounded-full"
              />
              <span className="text-xl font-bold text-foreground">THE ACADEMY</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Building complete athletes through multi-sport development in basketball, flag football, and soccer.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/share/1DY8v2AEuN/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.instagram.com/the_academytn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.tiktok.com/@academytn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                aria-label="TikTok"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Programs</h3>
            <div className="w-8 h-0.5 bg-primary mb-4" />
            <div className="flex flex-col gap-3">
              <Link href="/programs" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                All Programs
              </Link>
              <Link href="/performance-lab" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Performance Lab
              </Link>
              <Link href="/skills-lab" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Skills Lab
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                About Us
              </Link>
              <Link href="/faqs" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                FAQs
              </Link>
            </div>
          </div>

          {/* Location & Schedule */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Location</h3>
            <div className="w-8 h-0.5 bg-primary mb-4" />
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <span>Gallatin, Tennessee</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block">Tue &amp; Thu 6:00–8:00 PM</span>
                  <span className="block">Sun 11:00 AM–12:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Contact</h3>
            <div className="w-8 h-0.5 bg-primary mb-4" />
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-primary flex-shrink-0" />
                <a href="mailto:omarphilmore@yahoo.com" className="hover:text-primary transition-colors">
                  omarphilmore@yahoo.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-primary flex-shrink-0" />
                <a href="tel:5712920633" className="hover:text-primary transition-colors">
                  (571) 292-0633
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Email capture */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="max-w-md mx-auto text-center mb-8">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">Get schedule updates, session reminders, and Academy news.</p>
            {subscribed ? (
              <p className="text-sm text-primary font-medium">Thanks! You're on the list.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Social proof line */}
        <div className="pt-4">
          <p className="text-center text-sm text-muted-foreground/70 mb-8">
            Proudly serving athletes in <span className="text-muted-foreground">Gallatin</span>, <span className="text-muted-foreground">Hendersonville</span>, and <span className="text-muted-foreground">Sumner County</span>
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} The Academy. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/contact" className="hover:text-primary transition-colors">
              Contact
            </Link>
            <Link href="/faqs" className="hover:text-primary transition-colors">
              FAQs
            </Link>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
