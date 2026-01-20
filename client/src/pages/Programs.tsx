import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function Programs() {
  const { data: programs, isLoading } = trpc.programs.list.useQuery();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-br from-background via-card to-background">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Our Programs</h1>
              <p className="text-lg text-muted-foreground">
                Comprehensive basketball development programs for youth ages 8-18. Choose the program 
                that fits your goals and schedule.
              </p>
            </div>
          </div>
        </section>

        {/* Programs List */}
        <section className="py-16">
          <div className="container">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={48} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Group Sessions */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Group Sessions</CardTitle>
                    <CardDescription className="text-muted-foreground">Ages 8-18 • Limited to 8 players</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Group workouts are designed to bring together a collective of players, fostering an 
                      environment that combines friendly competition and skill development. These sessions 
                      offer young athletes the opportunity to familiarize themselves with the game and its 
                      dynamics, all while focusing on enhancing their abilities through targeted training exercises.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Players will improve their individual skills and compete to outwork, outrun and 
                      outperform each other in our weekly group workouts.
                    </p>
                    <div className="border-t border-border pt-4 mt-4">
                      <p className="text-2xl font-bold text-primary mb-2">$25 <span className="text-sm text-muted-foreground font-normal">per session</span></p>
                      <Link href="/signup">
                        <Button className="w-full">Register Now</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Individual Workouts */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Individual Workouts</CardTitle>
                    <CardDescription className="text-muted-foreground">Ages 8-18 • One-on-one training</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Whether you're actively taking part in summer basketball camps to get better at playing 
                      or if you're working hard on your own to improve your skills, it's important to give 
                      players personalized basketball drills that will effectively enhance their abilities.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Our coaches focus on each player's unique strengths, ensuring maximum improvement 
                      through customized training plans.
                    </p>
                    <div className="border-t border-border pt-4 mt-4">
                      <p className="text-2xl font-bold text-primary mb-2">$60 <span className="text-sm text-muted-foreground font-normal">per session</span></p>
                      <Link href="/signup">
                        <Button className="w-full">Register Now</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Shooting Lab */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Shooting Lab</CardTitle>
                    <CardDescription className="text-muted-foreground">Ages 8-18 • Technique & Mechanics Focus</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Specialized sessions using our Dr Dish shooting machine focused on proper shooting technique 
                      and mechanics. The Dr Dish acts as an automatic rebounder, instantly rebounding made or 
                      missed shots and delivering return passes. Fires up to 1800 shots per hour for high-volume 
                      repetition.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Perfect for developing muscle memory, refining form, and improving shooting consistency through 
                      focused technical work.
                    </p>
                    <div className="border-t border-border pt-4 mt-4">
                      <p className="text-2xl font-bold text-primary mb-2">Included <span className="text-sm text-muted-foreground font-normal">in memberships</span></p>
                      <Link href="/signup">
                        <Button className="w-full">View Memberships</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Skills Class */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Skills Class</CardTitle>
                    <CardDescription className="text-muted-foreground">Ages 8-18 • Fundamentals focus</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Focused skill development sessions covering ball handling, shooting form, footwork, 
                      and defensive fundamentals. Perfect for players looking to build a strong foundation.
                    </p>
                    <div className="border-t border-border pt-4 mt-4">
                      <p className="text-2xl font-bold text-primary mb-2">$15 <span className="text-sm text-muted-foreground font-normal">per class</span></p>
                      <Link href="/signup">
                        <Button className="w-full">Register Now</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Academy Group Membership */}
                <Card className="bg-card border-border border-primary">
                  <CardHeader>
                    <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2">
                      POPULAR
                    </div>
                    <CardTitle className="text-foreground">Academy Group Membership</CardTitle>
                    <CardDescription className="text-muted-foreground">Ages 8-18 • Best value</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Unlimited access to group sessions throughout the month. Perfect for dedicated players 
                      who want consistent training and development.
                    </p>
                    <div className="border-t border-border pt-4 mt-4">
                      <p className="text-2xl font-bold text-primary mb-2">$150 <span className="text-sm text-muted-foreground font-normal">per month</span></p>
                      <Link href="/signup">
                        <Button className="w-full">Register Now</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Complete Player Membership */}
                <Card className="bg-card border-border border-primary">
                  <CardHeader>
                    <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2">
                      BEST VALUE
                    </div>
                    <CardTitle className="text-foreground">Complete Player Membership</CardTitle>
                    <CardDescription className="text-muted-foreground">Ages 8-18 • All-access</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Unlimited access to skills classes and open gyms. The most comprehensive option for 
                      serious players committed to year-round development.
                    </p>
                    <div className="border-t border-border pt-4 mt-4">
                      <p className="text-2xl font-bold text-primary mb-2">$100 <span className="text-sm text-muted-foreground font-normal">per month</span></p>
                      <Link href="/signup">
                        <Button className="w-full">Register Now</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Additional Programs */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Academy Summer Camp</CardTitle>
                  <CardDescription className="text-muted-foreground">Ages 8-18 • 3rd Annual at Sumner Academy</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Join us for our 3rd annual summer camp at Sumner Academy! Intensive week-long training 
                    designed to accelerate player development during the off-season. Full-day sessions with 
                    skill work, games, and competition.
                  </p>
                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-2xl font-bold text-primary mb-2">$200 <span className="text-sm text-muted-foreground font-normal">per week</span></p>
                    <p className="text-sm text-muted-foreground mb-4">$20 deposit (included in total) • $180 due after deposit</p>
                    <Link href="/signup">
                      <Button className="w-full">Register Now</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Team Academy Registration</CardTitle>
                  <CardDescription className="text-muted-foreground">Ages 8-18 • Competitive teams</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Join our competitive travel teams representing The Academy in tournaments and leagues. 
                    Includes uniforms, coaching, and tournament fees.
                  </p>
                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-2xl font-bold text-primary mb-2">$300 <span className="text-sm text-muted-foreground font-normal">per season</span></p>
                    <Link href="/signup">
                      <Button className="w-full">Register Now</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary/10">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Not Sure Which Program is Right?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Contact us to discuss your goals and we'll help you choose the best program for your development.
              </p>
              <Link href="/contact">
                <Button size="lg" className="text-lg px-8">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
