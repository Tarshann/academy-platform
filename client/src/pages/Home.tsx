import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Users, Target, Zap, Shield, Heart, ChevronDown, MessageCircle } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrganizationStructuredData } from "@/components/StructuredData";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

// Program Finder filter options
const sportOptions = ["Any Sport", "Basketball", "Football", "Soccer"] as const;
const goalOptions = ["Any Goal", "Speed & Agility (SAQ)", "Skills Development", "Strength & Conditioning", "Confidence Building"] as const;
const formatOptions = ["Any Format", "Private (1-on-1)", "Small Group", "Shooting Lab"] as const;

type SportOption = typeof sportOptions[number];
type GoalOption = typeof goalOptions[number];
type FormatOption = typeof formatOptions[number];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showMobileCTA, setShowMobileCTA] = useState(false);
  
  // Program Finder state
  const [selectedSport, setSelectedSport] = useState<SportOption>("Any Sport");
  const [selectedGoal, setSelectedGoal] = useState<GoalOption>("Any Goal");
  const [selectedFormat, setSelectedFormat] = useState<FormatOption>("Any Format");
  const [showFinder, setShowFinder] = useState(false);
  
  const resetFilters = () => {
    setSelectedSport("Any Sport");
    setSelectedGoal("Any Goal");
    setSelectedFormat("Any Format");
  };
  
  const hasActiveFilters = selectedSport !== "Any Sport" || selectedGoal !== "Any Goal" || selectedFormat !== "Any Format";

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
      title: "Group Training",
      label: "Basketball Development",
      description: "High-energy basketball sessions focused on skill development, game IQ, and competitive drills. Limited to 8 athletes per session.",
      bestFor: "All skill levels",
      icon: Users,
      price: "$25",
      unit: "per session",
      featured: false,
      // Filtering metadata
      sports: ["Basketball"],
      goals: ["Skills Development", "Confidence Building"],
      format: "Small Group",
    },
    {
      title: "Private Training",
      label: "1-on-1 Coaching",
      description: "One-on-one sessions with Coach Mac or Coach O. Personalized plans for sport-specific goals and athletic development.",
      bestFor: "Serious athletes",
      icon: Target,
      price: "$60",
      unit: "per session",
      featured: true,
      // Filtering metadata
      sports: ["Basketball", "Football", "Soccer"],
      goals: ["Speed & Agility (SAQ)", "Skills Development", "Strength & Conditioning", "Confidence Building"],
      format: "Private (1-on-1)",
    },
    {
      title: "Shooting Lab",
      label: "Skill Mastery",
      description: "Specialized sessions using our Dr Dish machine. High-volume repetition for shooting technique and muscle memory.",
      bestFor: "Basketball players",
      icon: Zap,
      price: "$25",
      unit: "per session",
      featured: false,
      // Filtering metadata
      sports: ["Basketball"],
      goals: ["Skills Development"],
      format: "Shooting Lab",
    },
  ];
  
  // Filter programs based on selections
  const filteredPrograms = programs.filter((program) => {
    const sportMatch = selectedSport === "Any Sport" || program.sports.includes(selectedSport);
    const goalMatch = selectedGoal === "Any Goal" || program.goals.includes(selectedGoal);
    const formatMatch = selectedFormat === "Any Format" || program.format === selectedFormat;
    return sportMatch && goalMatch && formatMatch;
  });

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
          className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        >
          {/* Video Background - respects prefers-reduced-motion */}
          <div className="absolute inset-0 overflow-hidden">
            {prefersReducedMotion ? (
              <img 
                src="/images/hero-poster.jpg"
                alt=""
                className="absolute w-full h-full object-cover opacity-40 saturate-[0.7] brightness-110"
                style={{ filter: 'sepia(0.1)' }}
                aria-hidden="true"
              />
            ) : (
              <>
                {/* Poster image shown until video loads */}
                <img 
                  src="/images/hero-poster.jpg"
                  alt=""
                  className={`absolute w-full h-full object-cover opacity-40 saturate-[0.7] brightness-110 transition-opacity duration-500 ${videoLoaded ? 'opacity-0' : ''}`}
                  style={{ filter: 'sepia(0.1)' }}
                  aria-hidden="true"
                />
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="/images/hero-poster.jpg"
                  onCanPlay={() => setVideoLoaded(true)}
                  className={`absolute w-full h-full object-cover opacity-40 saturate-[0.7] brightness-110 ${videoLoaded ? 'video-fade-in' : 'opacity-0'}`}
                  style={{ filter: 'sepia(0.1)' }}
                >
                  <source src="/images/hero-video.mp4" type="video/mp4" />
                </video>
              </>
            )}
          </div>
          {/* Warm overlay gradient for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-primary/[0.08]" />
          {/* Subtle noise texture overlay for depth */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

          <motion.div 
            style={{ opacity: heroOpacity, y: heroY }}
            className="container relative z-10 px-6 py-24"
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
        <section className="py-16 md:py-20 border-b border-border">
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
                <p className="text-4xl md:text-5xl font-black text-foreground mb-1 tabular-nums">3</p>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Sports Supported</p>
                <p className="text-muted-foreground/50 text-[11px] mt-1">Basketball, football, soccer</p>
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

            {/* Program Finder - Apple-style selector strip */}
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: motionEasing }}
              className="max-w-4xl mx-auto mb-16"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  onClick={() => setShowFinder(!showFinder)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Target className="w-4 h-4" />
                  {showFinder ? "Hide Program Finder" : "Find Your Program"}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFinder ? "rotate-180" : ""}`} />
                </button>
              </div>
              
              {showFinder && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: motionEasing }}
                  className="bg-muted/30 rounded-2xl p-6 border border-border"
                >
                  <div className="grid sm:grid-cols-3 gap-4">
                    {/* Sport selector */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium mb-2">
                        Sport
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {sportOptions.map((sport) => (
                          <button
                            key={sport}
                            onClick={() => setSelectedSport(sport)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                              selectedSport === sport
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                            }`}
                          >
                            {sport === "Any Sport" ? "Any" : sport}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Goal selector */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium mb-2">
                        Training Goal
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {goalOptions.map((goal) => (
                          <button
                            key={goal}
                            onClick={() => setSelectedGoal(goal)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                              selectedGoal === goal
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                            }`}
                          >
                            {goal === "Any Goal" ? "Any" : goal.replace(" & ", "/").replace("Speed/Agility (SAQ)", "SAQ")}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Format selector */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium mb-2">
                        Format
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {formatOptions.map((format) => (
                          <button
                            key={format}
                            onClick={() => setSelectedFormat(format)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                              selectedFormat === format
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                            }`}
                          >
                            {format === "Any Format" ? "Any" : format.replace(" (1-on-1)", "")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Reset button */}
                  {hasActiveFilters && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Showing {filteredPrograms.length} of {programs.length} programs
                      </p>
                      <button
                        onClick={resetFilters}
                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        Reset filters
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Program Cards */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className={`grid gap-6 max-w-5xl mx-auto ${filteredPrograms.length === 1 ? "md:grid-cols-1 max-w-md" : filteredPrograms.length === 2 ? "md:grid-cols-2 max-w-3xl" : "md:grid-cols-3"}`}
            >
              {filteredPrograms.length > 0 ? (
                filteredPrograms.map((program, index) => (
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
                      {/* Program fit micro-line */}
                      <p className="text-[11px] text-muted-foreground/60 mt-4 mb-6">
                        Best for: <span className="text-muted-foreground">{program.bestFor}</span>
                      </p>
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
                          <a href="/signup">Register Now</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
              ) : (
                /* Empty state - no matching programs */
                <motion.div variants={fadeInUp} className="col-span-full text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <Target className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No exact match found</h3>
                    <p className="text-muted-foreground mb-6">
                      We recommend <span className="font-semibold text-foreground">Private Training</span> for personalized coaching that covers all your goals.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        asChild
                      >
                        <a href="/contact?subject=Private%20Session%20Request">Talk to Us</a>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="border-2"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
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

        {/* Coach Spotlight Section */}
        <section className="py-24 md:py-32 bg-muted/30">
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
                      Coach O brings expertise in basketball, football, and soccer development. 
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
                  <a href="/signup">Register Now</a>
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
            <a href="/signup">Register Now</a>
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
