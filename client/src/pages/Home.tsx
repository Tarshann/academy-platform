import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Users, Target, Zap, Shield, Heart, ChevronDown, MessageCircle } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrganizationStructuredData } from "@/components/StructuredData";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";


export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showMobileCTA, setShowMobileCTA] = useState(false);
  

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Show sticky mobile CTA after scrolling past hero
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = heroRef.current?.offsetHeight || 600;
      setShowMobileCTA(scrollY > heroHeight * 0.7);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

  // Phase 3 Motion System - consistent, subtle animations
  // Easing: cubic-bezier(0.4, 0, 0.2, 1) - standard Material easing
  const motionEasing = [0.4, 0, 0.2, 1] as const;
  
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: prefersReducedMotion ? 0 : 0.2, 
        ease: motionEasing 
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: prefersReducedMotion ? 0 : 0.08, 
        delayChildren: prefersReducedMotion ? 0 : 0.1 
      },
    },
  };

  // Section header animation
  const sectionHeader = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: prefersReducedMotion ? 0 : 0.25, 
        ease: motionEasing 
      },
    },
  };

  const programs = [
    {
      title: "Academy Performance Lab",
      label: "Membership",
      description: "Year-round structured development with SAQ training, strength conditioning, and sport-specific skills.",
      scarcity: "Limited to 6–8 athletes per group",
      bestFor: "Committed athletes ages 8\u201314",
      schedule: "Tue & Thu 7:00\u20138:00 PM \u2022 Sun 11:00 AM\u201312:00 PM",
      icon: Zap,
      price: "$245",
      unit: "per month",
      featured: true,
      cta: "Learn More",
      href: "/performance-lab",
    },
    {
      title: "Academy Skills Lab",
      label: "Drop-In",
      description: "Community drop-in sessions for fundamentals, movement, and positive competition. All skill levels welcome.",
      bestFor: "All ages",
      schedule: "Tue & Thu 6:00\u20136:50 PM",
      icon: Users,
      price: "$10",
      unit: "per session",
      featured: false,
      cta: "Learn More",
      href: "/skills-lab",
    },
    {
      title: "Private Training",
      label: "1-on-1 Coaching",
      description: "One-on-one sessions with Coach Mac or Coach O. Personalized plans for sport-specific goals and athletic development.",
      bestFor: "Serious athletes",
      icon: Target,
      price: "$60",
      unit: "per session",
      featured: false,
      cta: "Book a Session",
      href: "/contact",
    },
  ];

  const values = [
    {
      title: "Fundamentals First",
      description: "Proper technique and athletic IQ are the foundation of every great player.",
      icon: Target,
    },
    {
      title: "Building Confidence",
      description: "An environment where confidence grows through skill mastery and positive reinforcement.",
      icon: Shield,
    },
    {
      title: "Long-Term Growth",
      description: "Sustainable development over short-term wins. Skills and character that last forever.",
      icon: Heart,
    },
  ];



  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main id="main-content">
        <OrganizationStructuredData />
        
        {/* Hero Section - Premium Light Aesthetic with Video Background */}
        <motion.section
          ref={heroRef}
          className="relative z-10 min-h-[90vh] flex items-center justify-center"
        >
          {/* Hero Background - Academy Training Photo */}
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663204873520/YoeYbBWtxqzEHYHH.jpeg"
              alt="Academy basketball training session"
              className="absolute w-full h-full object-cover opacity-50 saturate-[0.8] brightness-105"
              style={{ filter: 'sepia(0.05)', objectPosition: 'center 30%' }}
            />
          </div>
          {/* Warm overlay gradient for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-primary/[0.08]" />
          {/* Subtle noise texture overlay for depth */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

          <motion.div 
            style={{ opacity: heroOpacity, y: heroY }}
            className="container relative z-10 px-6 py-16 sm:py-24"
          >
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full"
              >
                <span className="text-primary font-medium text-sm tracking-wide">GALLATIN, TN</span>
                <span className="w-1 h-1 rounded-full bg-primary/40" />
                <span className="text-muted-foreground text-sm">Multi-Sport Development</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 text-foreground leading-[1.08] tracking-tight max-w-[20ch] mx-auto"
              >
                Build Complete Athletes.
                <br />
                <span className="text-primary">Not Just Better Players.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
              >
                Multi-sport development &bull; SAQ Training &bull; Strength &bull; Confidence
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 ease-out [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:none)]:active:opacity-90"
                  asChild
                >
                  <a href="/programs">
                    View Programs
                    <ArrowRight className="ml-2" size={20} />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-border hover:border-primary/50 hover:bg-primary/5 px-8 py-6 text-lg rounded-xl transition-all duration-150 ease-out [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:none)]:active:opacity-90"
                  asChild
                >
                  <a href="/contact">Private Training with Coach Mac &amp; Coach O</a>
                </Button>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Scroll cue indicator - fades out after scroll */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            style={{ opacity: heroOpacity }}
          >
            <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">Scroll</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground/40" />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Trust Signals */}
        <section className="relative z-0 py-16 md:py-20 border-b border-border">
          <div className="container px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-8 md:gap-0"
            >
              {/* Stat 1 */}
              <motion.div variants={fadeInUp} className="text-center px-8 md:px-12">
                <p className="text-4xl md:text-5xl font-black text-foreground mb-1 tabular-nums">10+</p>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Years Coaching</p>
                <p className="text-muted-foreground/50 text-[11px] mt-1">Development experience</p>
              </motion.div>
              
              {/* Hairline divider */}
              <div className="hidden md:block w-px h-12 bg-border" />
              
              {/* Stat 2 */}
              <motion.div variants={fadeInUp} className="text-center px-8 md:px-12">
                <p className="text-4xl md:text-5xl font-black text-foreground mb-1 tabular-nums">200+</p>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Athletes <span className="font-normal text-muted-foreground/60">&amp; Counting</span></p>
                <p className="text-muted-foreground/50 text-[11px] mt-1">Across Middle TN</p>
              </motion.div>
              
              {/* Hairline divider */}
              <div className="hidden md:block w-px h-12 bg-border" />
              
              {/* Stat 3 */}
              <motion.div variants={fadeInUp} className="text-center px-8 md:px-12">
                <p className="text-4xl md:text-5xl font-black text-foreground mb-1 tabular-nums">4</p>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Sports Supported</p>
                <p className="text-muted-foreground/50 text-[11px] mt-1">Basketball, flag football, football, soccer</p>
              </motion.div>
            </motion.div>
          </div>
        </section>



        {/* Programs Section */}
        <section className="py-24 md:py-32 bg-background">
          <div className="container px-6">
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: motionEasing }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Our Programs
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the training path that fits your goals
              </p>
            </motion.div>

            {/* Program Cards */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid gap-6 max-w-5xl mx-auto md:grid-cols-3"
            >
              {programs.map((program, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card
                    className={`group relative overflow-hidden bg-card border transition-all duration-150 ease-out h-full hover:shadow-lg [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:none)]:active:opacity-95 ${
                      program.featured
                        ? "border-primary shadow-md ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    {program.featured && (
                      <div className="absolute top-4 right-4">
                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
                    <CardContent className="p-6 md:p-8 flex flex-col h-full">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <program.icon className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium mb-2">
                        {program.label}
                      </p>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {program.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-sm flex-grow">
                        {program.description}
                      </p>
                      {/* Scarcity signal */}
                      {(program as any).scarcity && (
                        <p className="text-[11px] text-orange-600 font-semibold mt-3">
                          {(program as any).scarcity}
                        </p>
                      )}
                      {/* Program fit micro-line */}
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        Best for: <span className="text-muted-foreground">{program.bestFor}</span>
                      </p>
                      {program.schedule && (
                        <p className="text-[11px] text-muted-foreground/60 mt-1 mb-4">
                          {program.schedule}
                        </p>
                      )}
                      {!program.schedule && <div className="mb-4" />}
                      {/* Price section pinned to bottom */}
                      <div className="border-t border-border pt-6 mt-auto">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-primary tabular-nums">{program.price}</span>
                          <span className="text-sm text-muted-foreground">{program.unit}</span>
                        </div>
                        <Button
                          className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-md transition-all duration-150 ease-out [@media(hover:none)]:active:opacity-90"
                          asChild
                        >
                          <a href={program.href}>{program.cta}</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.15, duration: prefersReducedMotion ? 0 : 0.2, ease: motionEasing }}
              className="text-center mt-12"
            >
              <Button
                variant="outline"
                size="lg"
                className="border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-150 ease-out [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:none)]:active:opacity-90"
                asChild
              >
                <a href="/programs">
                  View All Programs
                  <ArrowRight className="ml-2" size={18} />
                </a>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Two-Track Pathway — Distinct buyer paths, not a funnel */}
        <section className="py-24 md:py-32 bg-muted/30 border-y border-border">
          <div className="container px-6">
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: motionEasing }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Two Paths. One Goal.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the track that fits your athlete's needs
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
            >
              {/* Left Card — Train & Develop */}
              <motion.div variants={fadeInUp}>
                <Card className="bg-card border-border h-full hover:shadow-lg transition-all duration-150">
                  <CardContent className="p-8 md:p-10 flex flex-col h-full">
                    <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full self-start">
                      <span className="text-primary font-semibold text-xs uppercase tracking-wider">Flexible</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                      Train &amp; Develop
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      Drop-in skills sessions and private coaching for families who want flexible, high-quality athletic development without a monthly commitment.
                    </p>
                    <div className="space-y-4 mb-8 flex-grow">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">Skills Lab</p>
                          <p className="text-muted-foreground text-sm">Drop-in sessions, $10 each. Fundamentals, movement, and positive competition. All ages welcome.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Target className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">Private Training</p>
                          <p className="text-muted-foreground text-sm">1-on-1 with Coach Mac or Coach O. Personalized plans for sport-specific goals. $60/session.</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:shadow-md transition-all duration-150 ease-out [@media(hover:none)]:active:opacity-90"
                      asChild
                    >
                      <a href="/contact">
                        Book a Session
                        <ArrowRight className="ml-2" size={18} />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Right Card — Performance Track */}
              <motion.div variants={fadeInUp}>
                <Card className="bg-card border-primary shadow-md ring-1 ring-primary/20 h-full hover:shadow-lg transition-all duration-150">
                  <CardContent className="p-8 md:p-10 flex flex-col h-full">
                    <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full self-start">
                      <span className="text-primary font-semibold text-xs uppercase tracking-wider">Application-Based</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                      Performance Track
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      A structured 90-day development cycle for serious athletes ready to commit to consistent, measurable growth.
                    </p>
                    <div className="space-y-4 mb-8 flex-grow">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">Performance Lab</p>
                          <p className="text-muted-foreground text-sm">$245/mo. SAQ training, strength conditioning, and sport-specific skills. 3x/week (Tue, Thu, Sun).</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Shield className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">Capped at 8 Athletes</p>
                          <p className="text-muted-foreground text-sm">Small-group format ensures every athlete gets real coaching attention. Baseline testing tracks progress.</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-orange-600 font-semibold mb-4">
                      Limited spots per cohort — application required
                    </p>
                    <Button
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:shadow-md transition-all duration-150 ease-out [@media(hover:none)]:active:opacity-90"
                      asChild
                    >
                      <a href="/performance-lab">
                        Apply for Performance Lab
                        <ArrowRight className="ml-2" size={18} />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Coach Spotlight Section */}
        <section className="py-24 md:py-32 bg-background">
          <div className="container px-6">
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: motionEasing }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Meet Your Coaches
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experienced coaches dedicated to developing complete athletes
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: motionEasing }}
              >
                <Card className="group overflow-hidden bg-card border-border h-full transition-all duration-150 ease-out hover:shadow-lg [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:none)]:active:opacity-95">
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    <img 
                      src="/images/coach-mac.jpg" 
                      alt="Coach Mac instructing athletes during training"
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-300 [@media(hover:hover)]:group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent" />
                    <div className="absolute bottom-4 left-6">
                      <h3 className="text-2xl font-bold text-white drop-shadow-lg">Coach Mac</h3>
                      <p className="text-white/80 drop-shadow">Lead Trainer</p>
                    </div>
                  </div>
                  <CardContent className="p-6 md:p-8">
                    <div className="w-10 h-0.5 bg-primary mb-5" />
                    <blockquote className="text-lg md:text-xl text-foreground italic mb-4 leading-[1.6]">
                      "Every athlete deserves a foundation that lasts beyond one sport."
                    </blockquote>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      With over a decade of experience in multi-sport athletic development, 
                      Coach Mac specializes in building complete athletes through SAQ training, 
                      strength conditioning, and sport-specific skill development.
                    </p>
                    <div className="mb-5">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium mb-2">Coaching Focus</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs px-2.5 py-1 bg-primary/5 text-muted-foreground rounded-md border border-primary/10">SAQ & Movement</span>
                        <span className="text-xs px-2.5 py-1 bg-primary/5 text-muted-foreground rounded-md border border-primary/10">Strength Building</span>
                        <span className="text-xs px-2.5 py-1 bg-primary/5 text-muted-foreground rounded-md border border-primary/10">Sport Transfer</span>
                      </div>
                    </div>
                    {/* Availability note */}
                    <p className="text-[11px] text-muted-foreground/60 mb-4 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500/70" />
                      Limited weekly slots available
                    </p>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-md transition-all duration-150 ease-out [@media(hover:none)]:active:opacity-90"
                      asChild
                    >
                      <a href="/contact">Book Private Session</a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: motionEasing }}
              >
                <Card className="group overflow-hidden bg-card border-border h-full transition-all duration-150 ease-out hover:shadow-lg [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:none)]:active:opacity-95">
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    <img 
                      src="/images/coach-o.jpg" 
                      alt="Coach O working with young athletes"
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-300 [@media(hover:hover)]:group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent" />
                    <div className="absolute bottom-4 left-6">
                      <h3 className="text-2xl font-bold text-white drop-shadow-lg">Coach O</h3>
                      <p className="text-white/80 drop-shadow">Lead Trainer</p>
                    </div>
                  </div>
                  <CardContent className="p-6 md:p-8">
                    <div className="w-10 h-0.5 bg-primary mb-5" />
                    <blockquote className="text-lg md:text-xl text-foreground italic mb-4 leading-[1.6]">
                      "We build confidence through competence. Master the fundamentals, and everything else follows."
                    </blockquote>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      Coach O brings expertise in basketball, flag football, and soccer development. 
                      His approach focuses on building athletic foundations that translate 
                      across all sports while developing mental toughness and game IQ.
                    </p>
                    <div className="mb-5">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium mb-2">Coaching Focus</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs px-2.5 py-1 bg-primary/5 text-muted-foreground rounded-md border border-primary/10">Confidence Building</span>
                        <span className="text-xs px-2.5 py-1 bg-primary/5 text-muted-foreground rounded-md border border-primary/10">Game IQ</span>
                        <span className="text-xs px-2.5 py-1 bg-primary/5 text-muted-foreground rounded-md border border-primary/10">Mental Toughness</span>
                      </div>
                    </div>
                    {/* Availability note */}
                    <p className="text-[11px] text-muted-foreground/60 mb-4 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500/70" />
                      Limited weekly slots available
                    </p>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-md transition-all duration-150 ease-out [@media(hover:none)]:active:opacity-90"
                      asChild
                    >
                      <a href="/contact">Book Private Session</a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Private Sessions Module - Premium booking CTA */}
        <section className="py-20 md:py-24 bg-background border-y border-border">
          <div className="container px-6">
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: motionEasing }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-primary font-medium text-sm">Most Popular Option</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Private Sessions
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Most popular option for athletes who want fast, personalized progress with Coach Mac or Coach O.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-all duration-150 ease-out [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:none)]:active:opacity-90"
                  asChild
                >
                  <a href="/contact?subject=Private%20Session%20Request">
                    Request a Private Session
                    <ArrowRight className="ml-2" size={20} />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-border hover:border-primary/50 hover:bg-primary/5 px-8 py-6 text-lg rounded-xl transition-all duration-150 ease-out [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:none)]:active:opacity-90"
                  asChild
                >
                  <a href="/contact">
                    <MessageCircle className="mr-2" size={20} />
                    Contact Us
                  </a>
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground/60 mb-6">
                We'll reply within 24 hours to schedule your session.
              </p>
              
              {/* School Credibility Line */}
              <div className="pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground/70 leading-relaxed">
                  Trusted by athletes from <span className="text-muted-foreground">Sumner Academy</span>, <span className="text-muted-foreground">Shafer Middle School</span>, <span className="text-muted-foreground">Rucker Middle School</span>, <span className="text-muted-foreground">Gallatin High School</span>, <span className="text-muted-foreground">Liberty Creek Middle School</span>, <span className="text-muted-foreground">Station Camp</span>, <span className="text-muted-foreground">Stratford High School</span>, and more across Sumner & Davidson County.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="py-24 md:py-32 bg-background">
          <div className="container px-6">
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: motionEasing }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Our Philosophy
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                A place where your child will be{" "}
                <span className="text-primary font-semibold">seen, developed, and supported</span>
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            >
              {values.map((value, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="group bg-card border-border hover:border-primary/30 transition-all duration-150 ease-out h-full hover:shadow-md [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:none)]:active:opacity-95">
                    <CardContent className="p-8 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 transition-transform duration-150 [@media(hover:hover)]:group-hover:scale-105">
                        <value.icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-3">
                        {value.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Parent Testimonials — Dark background with gold accents */}
        <section className="py-24 md:py-32 bg-foreground">
          <div className="container px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={sectionHeader}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-background">
                What Parents Are Saying
              </h2>
              <p className="text-lg text-background/60 max-w-2xl mx-auto">
                Real feedback from Academy families
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            >
              {[
                {
                  quote: "After three months in the Performance Lab, my son's first-step quickness improved so much his basketball coach asked what changed. The structured SAQ work translates directly to game speed. He's not just faster\u2014he moves with purpose now.",
                  author: "Marcus T.",
                  detail: "Parent of 7th grader",
                },
                {
                  quote: "My daughter used to hang back during drills and avoid competition. Coach Mac and Coach O built her up session by session. Now she's the first one on the court and leads warm-ups. The confidence she's gained goes way beyond sports.",
                  author: "Keisha R.",
                  detail: "Parent of 5th grader",
                },
                {
                  quote: "We tried three other programs before The Academy. The difference is the structure\u2014every session has a plan, the coaches track progress, and my son knows exactly what he's working on each week. It's real development, not just running kids through generic drills.",
                  author: "David & Sarah L.",
                  detail: "Parents of 6th grader",
                },
              ].map((testimonial, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="bg-background/[0.06] border-background/10 h-full backdrop-blur-sm">
                    <CardContent className="p-6 md:p-8 flex flex-col h-full">
                      <span className="text-primary text-4xl font-serif leading-none mb-3 select-none">&ldquo;</span>
                      <blockquote className="text-background/80 text-sm leading-relaxed flex-grow">
                        {testimonial.quote}
                      </blockquote>
                      <div className="mt-6 pt-4 border-t border-background/10">
                        <p className="text-background font-semibold text-sm">
                          {testimonial.author}
                        </p>
                        <p className="text-background/50 text-xs mt-0.5">
                          {testimonial.detail}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32 bg-foreground text-background">
          <div className="container px-6">
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: motionEasing }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Start Your
                <br />
                <span className="text-primary">Athletic Journey?</span>
              </h2>
              <p className="text-lg text-background/70 mb-10 leading-relaxed">
                Join families across Gallatin and Middle Tennessee who trust The Academy 
                for their athlete's development.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-all duration-150 ease-out [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:none)]:active:opacity-90"
                  asChild
                >
                  <a href="/programs">View Programs</a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-background/30 text-background hover:bg-background/10 px-10 py-6 text-lg rounded-xl transition-all duration-150 ease-out [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:none)]:active:opacity-90"
                  asChild
                >
                  <a href="/contact">Contact Us</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
      
      {/* Sticky Mobile CTA - appears after scrolling past hero */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ 
          y: showMobileCTA ? 0 : 100, 
          opacity: showMobileCTA ? 1 : 0 
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-lg border-t border-border/50 px-4 py-3 safe-area-pb"
      >
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 rounded-xl shadow-md"
            asChild
          >
            <a href="/programs">Get Started</a>
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-2 h-12 rounded-xl"
            asChild
          >
            <a href="/contact">Book Private</a>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
