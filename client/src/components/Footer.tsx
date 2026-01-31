import { Link } from "wouter";
import { Facebook, Instagram, MapPin, Clock, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
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
              Building complete athletes through multi-sport development in basketball, football, and soccer.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/theacademytn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.instagram.com/theacademytn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.tiktok.com/@theacademytn"
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
              <Link href="/signup" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Register Now
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
                <span>Sessions by appointment</span>
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
                <a href="tel:5712920833" className="hover:text-primary transition-colors">
                  (571) 292-0833
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Social proof line */}
        <div className="mt-12 pt-8 border-t border-border">
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
  );
}
