import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { ProgramStructuredData } from "@/components/StructuredData";
import { ProgramCardSkeleton } from "@/components/skeletons/ProgramCardSkeleton";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const sportLabels: Record<string, string> = {
  basketball: "Basketball",
  football: "Football",
  soccer: "Soccer",
  multi_sport: "Multi-Sport",
  saq: "SAQ Training",
};

export default function Programs() {
  const { data: programs, isLoading } = trpc.programs.list.useQuery();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  
  const filteredPrograms = selectedSport
    ? programs?.filter((p: any) => p.sport === selectedSport)
    : programs;
  
  const sportOptions = [
    { value: null, label: "All Sports" },
    { value: "basketball", label: "Basketball" },
    { value: "football", label: "Football" },
    { value: "soccer", label: "Soccer" },
    { value: "multi_sport", label: "Multi-Sport" },
    { value: "saq", label: "SAQ Training" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      <ProgramStructuredData 
        name="The Academy Athletic Development Programs"
        description="Comprehensive athletic development programs for basketball, football, and soccer athletes. SAQ training, strength conditioning, and sport-specific skill development."
      />
      <main id="main-content" className="flex-1">
        <div className="container pt-6">
          <Breadcrumbs items={[{ label: "Programs" }]} />
        </div>
        {/* Hero */}
        <section className="py-16 bg-gradient-to-br from-background via-card to-background">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Our Programs</h1>
              <p className="text-lg text-muted-foreground">
                Comprehensive athletic development programs for basketball, football, and soccer athletes. 
                Our focus on SAQ (Speed, Agility, Quickness) training and strength conditioning builds 
                foundational athletic qualities that translate across all sports. Choose the program 
                that fits your goals and schedule.
              </p>
            </div>
          </div>
        </section>

        {/* Programs List */}
        <section className="py-16">
          <div className="container">
            {/* Sport Filter */}
            <div className="mb-8 flex flex-wrap gap-2 justify-center">
              {sportOptions.map((option) => (
                <Button
                  key={option.value || "all"}
                  variant={selectedSport === option.value ? "default" : "outline"}
                  onClick={() => setSelectedSport(option.value)}
                  size="sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ProgramCardSkeleton />
                <ProgramCardSkeleton />
                <ProgramCardSkeleton />
              </div>
            ) : filteredPrograms && filteredPrograms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPrograms.map((program: any) => {
                  const anchorId = program.slug ? `program-${program.slug}` : `program-${program.id}`;
                  return (
                    <Card key={program.id} id={anchorId} className="bg-card border-border scroll-mt-24">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-foreground">{program.name}</CardTitle>
                          <CardDescription className="text-muted-foreground">
                            Ages {program.ageMin}-{program.ageMax}
                            {program.maxParticipants && ` • Max ${program.maxParticipants} participants`}
                          </CardDescription>
                        </div>
                        {program.sport && (
                          <Badge variant="outline" className="shrink-0">
                            {sportLabels[program.sport] || program.sport}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 line-clamp-4">
                        {program.description}
                      </p>
                      <div className="border-t border-border pt-4 mt-4">
                        <p className="text-2xl font-bold text-primary mb-2">
                          ${program.price} <span className="text-sm text-muted-foreground font-normal">per {program.category === 'membership' ? 'month' : 'session'}</span>
                        </p>
                        <Link href="/signup">
                          <Button className="w-full">Register Now</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {selectedSport ? `No ${sportLabels[selectedSport] || selectedSport} programs available.` : "No programs available yet."}
                </p>
                {selectedSport && (
                  <Button variant="outline" onClick={() => setSelectedSport(null)} className="mt-4">
                    Show All Programs
                  </Button>
                )}
              </div>
            )}
            
            {/* Legacy hardcoded programs (fallback if no DB programs) */}
            {(!filteredPrograms || filteredPrograms.length === 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Group Sessions */}
                <Card id="program-group-sessions" className="bg-card border-border scroll-mt-24">
                  <CardHeader>
                    <CardTitle className="text-foreground">Group Sessions</CardTitle>
                    <CardDescription className="text-muted-foreground">Youth athletes • Limited to 8 players</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Group training sessions focus on foundational athletic development through SAQ (Speed, 
                      Agility, Quickness) training and strength conditioning. These sessions build the core 
                      athletic qualities that translate across basketball, football, and soccer - improving 
                      acceleration, change of direction, and overall athleticism.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Players develop fundamental movement patterns, build confidence through proper technique, 
                      and compete in a supportive environment that emphasizes long-term growth over short-term results.
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
                <Card id="program-individual-workouts" className="bg-card border-border scroll-mt-24">
                  <CardHeader>
                    <CardTitle className="text-foreground">Individual Workouts</CardTitle>
                    <CardDescription className="text-muted-foreground">Youth athletes • One-on-one training</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      One-on-one sessions are tailored to each athlete's sport, position, and performance goals.
                      Training plans blend SAQ work, strength fundamentals, and skill development to build complete
                      athletes across basketball, football, and soccer.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Coaches focus on each athlete's unique strengths, ensuring meaningful progress through
                      personalized programming and targeted feedback.
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
                <Card id="program-shooting-lab" className="bg-card border-border scroll-mt-24">
                  <CardHeader>
                    <CardTitle className="text-foreground">Shooting Lab</CardTitle>
                    <CardDescription className="text-muted-foreground">Youth athletes • Limited to 8 players per session</CardDescription>
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
                      focused technical work. <strong>Not included in memberships.</strong>
                    </p>
                    <div className="border-t border-border pt-4 mt-4">
                      <p className="text-2xl font-bold text-primary mb-2">$25 <span className="text-sm text-muted-foreground font-normal">per session</span></p>
                      <Link href="/signup">
                        <Button className="w-full">Register Now</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Skills Class */}
                <Card id="program-skills-class" className="bg-card border-border scroll-mt-24">
                  <CardHeader>
                    <CardTitle className="text-foreground">Skills Class</CardTitle>
                    <CardDescription className="text-muted-foreground">Youth athletes • Fundamentals focus</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Focused development sessions covering footwork, balance, coordination, and sport-specific
                      fundamentals. Perfect for athletes looking to build a strong foundation across multiple sports.
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
                <Card id="program-academy-group-membership" className="bg-card border-border border-primary scroll-mt-24">
                  <CardHeader>
                    <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2">
                      POPULAR
                    </div>
                    <CardTitle className="text-foreground">Academy Group Membership</CardTitle>
                    <CardDescription className="text-muted-foreground">Youth athletes • Best value</CardDescription>
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
                <Card id="program-complete-player-membership" className="bg-card border-border border-primary scroll-mt-24">
                  <CardHeader>
                    <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2">
                      BEST VALUE
                    </div>
                    <CardTitle className="text-foreground">Complete Player Membership</CardTitle>
                    <CardDescription className="text-muted-foreground">Youth athletes • All-access</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Unlimited access to skills classes and open gyms (when available seasonally). The most comprehensive option for 
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
              <Card id="program-academy-summer-camp" className="bg-card border-border scroll-mt-24">
                <CardHeader>
                  <CardTitle className="text-foreground">Academy Summer Camp</CardTitle>
                  <CardDescription className="text-muted-foreground">Youth athletes • 3rd Annual at Sumner Academy</CardDescription>
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

              <Card id="program-academy-league" className="bg-card border-border scroll-mt-24">
                <CardHeader>
                  <CardTitle className="text-foreground">Academy League</CardTitle>
                  <CardDescription className="text-muted-foreground">Youth athletes • Competitive league play</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Join our competitive league representing The Academy in organized games and tournaments. 
                    Includes coaching, game management, and competitive development opportunities.
                  </p>
                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-lg text-muted-foreground mb-4">Contact us for availability and pricing</p>
                    <Link href="/contact">
                      <Button className="w-full">Contact Us</Button>
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
