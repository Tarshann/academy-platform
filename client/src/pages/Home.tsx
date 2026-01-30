import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Users, Target, Zap, Shield, Heart } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrganizationStructuredData } from "@/components/StructuredData";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const programs = [
    {
      title: "Group Training",
      label: "Athletic Foundation",
      description: "High-energy sessions focused on SAQ training, conditioning, and multi-sport fundamentals. Limited to 8 athletes per session.",
      icon: Users,
      price: "$25",
      unit: "per session",
      featured: false,
    },
    {
      title: "Private Training",
      label: "1-on-1 Coaching",
      description: "One-on-one sessions with Coach Mac or Coach O. Personalized plans for sport-specific goals and athletic development.",
      icon: Target,
      price: "$60",
      unit: "per session",
      featured: true,
    },
    {
      title: "Shooting Lab",
      label: "Skill Mastery",
      description: "Specialized sessions using our Dr Dish machine. High-volume repetition for shooting technique and muscle memory.",
      icon: Zap,
      price: "$25",
      unit: "per session",
      featured: false,
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
        
        {/* Hero Section - Premium Light Aesthetic */}
        <motion.section
          ref={heroRef}
          className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        >
          {/* Background with subtle depth - warm gradient + texture */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-[oklch(0.95_0.005_90)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.05]" />
          {/* Subtle noise texture overlay for depth */}
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

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
                className="text-5xl md:text-7xl font-extrabold mb-8 text-foreground leading-[1.1] tracking-tight"
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
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
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
                  className="border-2 border-border hover:border-primary/50 hover:bg-primary/5 px-8 py-6 text-lg rounded-xl transition-all duration-300"
                  asChild
                >
                  <a href="/contact">Private Training with Coach Mac &amp; Coach O</a>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.section>

        {/* Trust Signals */}
        <section className="py-20 md:py-24 border-b border-border">
          <div className="container px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="flex flex-wrap justify-center items-start gap-12 md:gap-20"
            >
              <motion.div variants={fadeInUp} className="text-center">
                <p className="text-5xl font-extrabold text-foreground mb-2">10+</p>
                <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">Years Coaching</p>
                <p className="text-muted-foreground/60 text-xs mt-1.5">Development experience</p>
              </motion.div>
              <motion.div variants={fadeInUp} className="text-center">
                <p className="text-5xl font-extrabold text-foreground mb-2">200+</p>
                <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">Athletes <span className="font-normal text-muted-foreground/70">&amp; Counting</span></p>
                <p className="text-muted-foreground/60 text-xs mt-1.5">Across Middle TN</p>
              </motion.div>
              <motion.div variants={fadeInUp} className="text-center">
                <p className="text-5xl font-extrabold text-foreground mb-2">3</p>
                <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">Sports Supported</p>
                <p className="text-muted-foreground/60 text-xs mt-1.5">Basketball, football, soccer</p>
              </motion.div>
              <motion.div variants={fadeInUp} className="text-center max-w-[220px] pt-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Trusted by families across Gallatin &amp; Middle Tennessee
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>



        {/* Programs Section */}
        <section className="py-24 md:py-32 bg-background">
          <div className="container px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Our Programs
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the training path that fits your goals
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {programs.map((program, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card 
                    className={`group relative overflow-hidden bg-card border transition-all duration-300 h-full hover:shadow-lg ${
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
                    <CardContent className="p-8">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <program.icon className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium mb-2">
                        {program.label}
                      </p>
                      <h3 className="text-xl font-bold text-foreground mb-3">
                        {program.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed mb-8 text-sm">
                        {program.description}
                      </p>
                      <div className="border-t border-border pt-8">
                        <p className="text-3xl font-bold text-primary mb-1">
                          {program.price}
                          <span className="text-sm text-muted-foreground font-normal ml-1">
                            {program.unit}
                          </span>
                        </p>
                        <Button
                          className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                          asChild
                        >
                          <a href="/signup">Register Now</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center mt-12"
            >
              <Button
                variant="outline"
                size="lg"
                className="border-2 hover:border-primary/50 hover:bg-primary/5"
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
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
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
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="overflow-hidden bg-card border-border h-full">
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                    <div className="absolute bottom-4 left-6">
                      <h3 className="text-2xl font-bold text-foreground">Coach Mac</h3>
                      <p className="text-muted-foreground">Head Coach</p>
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <div className="w-12 h-0.5 bg-primary mb-6" />
                    <blockquote className="text-xl text-foreground italic mb-5 leading-relaxed">
                      "Every athlete deserves a foundation that lasts beyond one sport."
                    </blockquote>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      With over a decade of experience in multi-sport athletic development, 
                      Coach Mac specializes in building complete athletes through SAQ training, 
                      strength conditioning, and sport-specific skill development.
                    </p>
                    <div className="mb-6">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium mb-2">Coaching Focus</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-primary/5 text-muted-foreground rounded">SAQ & Movement</span>
                        <span className="text-xs px-2 py-1 bg-primary/5 text-muted-foreground rounded">Strength Building</span>
                        <span className="text-xs px-2 py-1 bg-primary/5 text-muted-foreground rounded">Sport Transfer</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      asChild
                    >
                      <a href="/contact">Request Private Session</a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="overflow-hidden bg-card border-border h-full">
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                    <div className="absolute bottom-4 left-6">
                      <h3 className="text-2xl font-bold text-foreground">Coach O</h3>
                      <p className="text-muted-foreground">Lead Trainer</p>
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <div className="w-12 h-0.5 bg-primary mb-6" />
                    <blockquote className="text-xl text-foreground italic mb-5 leading-relaxed">
                      "We build confidence through competence. Master the fundamentals, and everything else follows."
                    </blockquote>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      Coach O brings expertise in basketball, football, and soccer development. 
                      His approach focuses on building athletic foundations that translate 
                      across all sports while developing mental toughness and game IQ.
                    </p>
                    <div className="mb-6">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium mb-2">Coaching Focus</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-primary/5 text-muted-foreground rounded">Confidence Building</span>
                        <span className="text-xs px-2 py-1 bg-primary/5 text-muted-foreground rounded">Game IQ</span>
                        <span className="text-xs px-2 py-1 bg-primary/5 text-muted-foreground rounded">Mental Toughness</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      asChild
                    >
                      <a href="/contact">Request Private Session</a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="py-24 md:py-32 bg-background">
          <div className="container px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
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
                  <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 h-full hover:shadow-md">
                    <CardContent className="p-8 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
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
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
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
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-6 text-lg rounded-xl shadow-lg"
                  asChild
                >
                  <a href="/signup">Register Now</a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-background/30 text-background hover:bg-background/10 px-10 py-6 text-lg rounded-xl"
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
    </div>
  );
}
