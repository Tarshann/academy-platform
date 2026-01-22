import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Award, TrendingUp, Users } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrganizationStructuredData } from "@/components/StructuredData";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
      },
    },
  };

  const programs = [
    {
      title: "Group Training Sessions",
      description: "High-energy group workouts focusing on basketball fundamentals, conditioning, and team dynamics.",
      icon: Users,
      color: "from-amber-500/20 to-yellow-600/20",
      borderColor: "border-amber-500/30",
    },
    {
      title: "Individual Workouts",
      description: "Personalized one-on-one training tailored to your specific goals and skill development needs.",
      icon: Award,
      color: "from-amber-600/20 to-orange-600/20",
      borderColor: "border-amber-600/30",
    },
    {
      title: "Shooting Lab",
      description: "Specialized shooting mechanics training with video analysis and data-driven feedback.",
      icon: TrendingUp,
      color: "from-yellow-500/20 to-amber-500/20",
      borderColor: "border-yellow-500/30",
    },
  ];



  return (
    <div className="min-h-screen">
      <OrganizationStructuredData />
      {/* Hero Section with Parallax */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-black"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-yellow-500/10 to-transparent rounded-full blur-3xl"
          />
        </div>

        <div className="container relative z-10 px-6 py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-block mb-6 px-6 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-full"
            >
              <span className="text-amber-300 font-semibold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">ELITE ATHLETIC DEVELOPMENT</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-6xl md:text-8xl font-black mb-8 leading-tight"
            >
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                THE BEGINNING
              </span>
              <br />
              <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">OF A NEW CHAPTER</span>
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                IN GALLATIN SPORTS
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-xl md:text-2xl text-neutral-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Developing elite youth athletes across{" "}
              <span className="text-amber-300 font-semibold">basketball</span>,{" "}
              <span className="text-amber-300 font-semibold">football</span>, and{" "}
              <span className="text-amber-300 font-semibold">soccer</span> through expert training in speed, agility,
              quickness, and strength.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold px-8 py-6 text-lg rounded-xl shadow-2xl shadow-amber-500/50 hover:shadow-amber-500/70 transition-all duration-300 hover:scale-105 group"
                asChild
              >
                <a href="/signup">
                  Start Your Journey
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-amber-500/50 text-white hover:bg-amber-500/10 hover:border-amber-500 px-8 py-6 text-lg rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105"
                asChild
              >
                <a href="/programs">Explore Programs</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-amber-500/50 rounded-full flex justify-center pt-2"
          >
            <div className="w-1 h-2 bg-amber-500 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.section>



      {/* Programs Section */}
      <section className="py-32 bg-gradient-to-b from-neutral-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        
        <div className="container px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                Our Programs
              </span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Choose the training path that fits your goals and watch your game reach new heights
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-8"
          >
            {programs.map((program, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="group relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/80 border-neutral-700/50 hover:border-amber-500/50 transition-all duration-500 h-full backdrop-blur-sm hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20">
                  <div className={`absolute inset-0 bg-gradient-to-br ${program.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <CardContent className="relative z-10 p-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${program.color} border ${program.borderColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <program.icon className="w-8 h-8 text-amber-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-amber-300 transition-colors">
                      {program.title}
                    </h3>
                    <p className="text-neutral-400 leading-relaxed mb-6">{program.description}</p>
                    <Button
                      variant="ghost"
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 p-0 h-auto font-semibold group/btn"
                      asChild
                    >
                      <a href="/programs">
                        Learn More
                        <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-center mt-16"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold px-10 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 hover:scale-105"
              asChild
            >
              <a href="/programs">View All Programs</a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Philosophy & Values Section */}
      <section className="py-32 bg-gradient-to-br from-black via-neutral-900 to-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
        </div>
        
        <div className="container px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                Our Philosophy
              </span>
            </h2>
            <p className="text-2xl text-neutral-300 max-w-4xl mx-auto leading-relaxed">
              This is a place where your child will be <span className="text-amber-300 font-semibold">seen, developed, and supported</span>
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
          >
            {[
              {
                title: "Fundamentals First",
                description: "We teach the game correctly from the ground up. Proper technique and basketball IQ are the foundation of every great player.",
                icon: "🏀",
              },
              {
                title: "Building Confidence",
                description: "Every athlete deserves to feel capable and empowered. We create an environment where confidence grows through skill mastery and positive reinforcement.",
                icon: "💪",
              },
              {
                title: "Long-Term Growth",
                description: "We prioritize sustainable development over short-term wins. Trophies fade, but the skills, character, and love for the game last forever.",
                icon: "📈",
              },
              {
                title: "Safe to Fail & Learn",
                description: "Mistakes are part of the journey. Our environment encourages athletes to take risks, learn from failures, and grow stronger.",
                icon: "🛡️",
              },
              {
                title: "Community & Mentorship",
                description: "We're building more than athletes—we're building leaders. Our program fosters mentorship, accountability, and lifelong connections.",
                icon: "🤝",
              },
            ].map((value, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="group relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/80 border-neutral-700/50 hover:border-amber-500/50 transition-all duration-500 h-full backdrop-blur-sm hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="relative z-10 p-8">
                    <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                      {value.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-amber-300 transition-colors">
                      {value.title}
                    </h3>
                    <p className="text-neutral-400 leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-center mt-20"
          >
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
              At The Academy, we don't just train athletes—we develop <span className="text-amber-400 font-semibold">confident, skilled, and resilient young people</span> who carry these lessons far beyond the court.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-neutral-900 via-black to-neutral-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-yellow-500/10" />
        </div>
        
        <div className="container px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-8">
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                Ready to Transform
              </span>
              <br />
              <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">Your Athletic Journey?</span>
            </h2>
            <p className="text-xl text-neutral-300 mb-12 leading-relaxed">
              Join hundreds of youth athletes who have elevated their game with The Academy's proven training methods
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold px-12 py-7 text-xl rounded-xl shadow-2xl shadow-amber-500/50 hover:shadow-amber-500/70 transition-all duration-300 hover:scale-105"
                asChild
              >
                <a href="/signup">Register Now</a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-amber-500/50 text-white hover:bg-amber-500/10 hover:border-amber-500 px-12 py-7 text-xl rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105"
                asChild
              >
                <a href="/contact">Contact Us</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
