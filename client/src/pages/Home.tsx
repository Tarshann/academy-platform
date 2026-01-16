import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Users, Target, Trophy } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-background via-card to-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              THE BEGINNING OF A NEW CHAPTER IN GALLATIN SPORTS
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Using basketball to develop youth, ages 8-18, through hard work, accountability, competitiveness, and sportsmanship.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Register Now
                </Button>
              </Link>
              <Link href="/programs">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  View Programs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Welcome to The Academy</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The Academy is a youth basketball program that prioritizes player development in all areas, 
              including well-being, in a well-structured setting. We focus on using basketball to develop 
              youth through long-term development, helping athletes excel on and off the court.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="text-primary" size={24} />
                </div>
                <CardTitle className="text-foreground">Hard Work</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  We believe in dedication and commitment. Every session is an opportunity to improve 
                  through consistent effort and determination.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="text-primary" size={24} />
                </div>
                <CardTitle className="text-foreground">Accountability</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Players learn to take responsibility for their actions, growth, and development 
                  both on and off the court.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="text-primary" size={24} />
                </div>
                <CardTitle className="text-foreground">Competitiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  We foster a competitive environment that pushes players to excel while maintaining 
                  respect and sportsmanship.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Programs Overview */}
      <section className="py-16 bg-card">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">Our Programs</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Choose from our range of basketball development programs designed for youth ages 8-18
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-background border-border hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-foreground">Group Sessions</CardTitle>
                <CardDescription className="text-muted-foreground">From $25/session</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Collective player workouts fostering friendly competition and skill development. 
                  Limited to 8 players for maximum attention.
                </p>
                <Link href="/programs">
                  <Button variant="outline" className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-background border-border hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-foreground">Individual Workouts</CardTitle>
                <CardDescription className="text-muted-foreground">$60/session</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Personalized basketball drills focused on each player's unique strengths, 
                  ensuring maximum improvement.
                </p>
                <Link href="/programs">
                  <Button variant="outline" className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-background border-border hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-foreground">Shooting Lab</CardTitle>
                <CardDescription className="text-muted-foreground">Included in memberships</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Automatic rebounder firing up to 1800 shots per hour. Get an intense workout 
                  in a short time.
                </p>
                <Link href="/programs">
                  <Button variant="outline" className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                View All Programs & Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <blockquote className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              "Academy helped me gain the confidence to compete"
            </blockquote>
            <p className="text-lg text-muted-foreground">— Alejandro Jimenez</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/10">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join The Academy and take your game to the next level. Registration is now open.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Sign Up Today
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
