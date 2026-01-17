import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Users, Target, Trophy, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-br from-background via-card to-background">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">About The Academy</h1>              <p className="text-lg text-muted-foreground">
                More than just sports—we're building complete athletes with character, confidence, and championship mentality.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center text-foreground">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed text-center mb-8">
                The Academy is a comprehensive athletic development program serving youth basketball, football, and soccer athletes. 
                We specialize in speed, agility, and quickness (SAQ) training combined with strength conditioning to build complete athletes. 
                Our focus extends beyond sport-specific skills to develop character, work ethic, and mental toughness through hard work, 
                accountability, competitiveness, and sportsmanship.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 bg-card">
          <div className="container">
            <h2 className="text-3xl font-bold mb-12 text-center text-foreground">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="bg-background border-border">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="text-primary" size={24} />
                  </div>
                  <CardTitle className="text-foreground">Hard Work</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We believe that success comes from dedication and consistent effort. Every practice, 
                    every drill, and every game is an opportunity to improve. We instill a strong work 
                    ethic that translates beyond basketball into all areas of life.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Target className="text-primary" size={24} />
                  </div>
                  <CardTitle className="text-foreground">Accountability</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Players learn to take responsibility for their actions, their growth, and their 
                    development. We teach young athletes to be accountable to themselves, their teammates, 
                    and their coaches, building integrity and character.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Trophy className="text-primary" size={24} />
                  </div>
                  <CardTitle className="text-foreground">Competitiveness</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We foster a competitive environment that pushes players to excel and reach their 
                    full potential. Competition teaches resilience, determination, and the drive to 
                    continuously improve while maintaining respect for opponents.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Heart className="text-primary" size={24} />
                  </div>
                  <CardTitle className="text-foreground">Sportsmanship</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Respect, integrity, and fair play are fundamental to everything we do. We teach 
                    players to compete with honor, support their teammates, and show respect to coaches, 
                    officials, and opponents at all times.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Coaching Philosophy */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center text-foreground">Our Coaching Philosophy</h2>
              <div className="space-y-6 text-muted-foreground">
                <p className="text-lg leading-relaxed">
                  At The Academy, we believe in developing the complete athlete. Whether training for basketball, football, or soccer, 
                  we focus on the foundational athletic qualities that translate across all sports: speed, agility, quickness, and strength. 
                  Beyond physical development, we build character, confidence, and life skills that serve athletes long after their playing days.
                </p>
                <p className="text-lg leading-relaxed">
                  Our coaching approach emphasizes individual attention within a team environment. We 
                  recognize that every player has unique strengths and areas for growth. Our coaches work 
                  to identify and develop each player's potential while fostering teamwork and collaboration.
                </p>
                <p className="text-lg leading-relaxed">
                  We prioritize long-term development over short-term results. Rather than focusing solely 
                  on winning games, we concentrate on building fundamental skills, basketball IQ, and mental 
                  toughness that will help players succeed at higher levels of competition.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Leadership Team */}
        <section className="py-16 bg-card">
          <div className="container">
            <h2 className="text-3xl font-bold mb-12 text-center text-foreground">Leadership Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Omar Philmore</CardTitle>
                  <p className="text-sm text-muted-foreground">Co-Founder & Director</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Boys Basketball Coach at Sumner Academy. Dedicated to developing young athletes through structured training and mentorship.
                  </p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Email: <a href="mailto:omarphilmore@yahoo.com" className="text-primary hover:underline">omarphilmore@yahoo.com</a></p>
                    <p>Phone: <a href="tel:5712920833" className="text-primary hover:underline">(571) 292-0833</a></p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Tarshann Washington</CardTitle>
                  <p className="text-sm text-muted-foreground">Co-Founder & Director</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Committed to creating opportunities for youth development through basketball.
                  </p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Email: <a href="mailto:Tarshann@gmail.com" className="text-primary hover:underline">Tarshann@gmail.com</a></p>
                    <p>Phone: <a href="tel:3155426222" className="text-primary hover:underline">(315) 542-6222</a></p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Locations */}
        <section className="py-16 bg-card">
          <div className="container">
            <h2 className="text-3xl font-bold mb-12 text-center text-foreground">Our Training Locations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Sumner Academy Gym</CardTitle>
                  <p className="text-sm text-muted-foreground">Primary Training Facility</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Our main training facility where most group sessions and individual workouts take place. 
                    State-of-the-art basketball courts with excellent lighting and climate control.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Programs:</strong> Group Training, Individual Workouts, Shooting Lab</p>
                    <p><strong>Schedule:</strong> Tuesday, Thursday, Sunday sessions</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Unlimited Potential Gym</CardTitle>
                  <p className="text-sm text-muted-foreground">Gallatin, TN</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Our Gallatin location offers convenient access for families in the area. 
                    Full-size courts perfect for competitive training and open gym sessions.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Programs:</strong> Group Training, Open Gym</p>
                    <p><strong>Schedule:</strong> Sunday Open Gym sessions</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">RT Fisher Gym</CardTitle>
                  <p className="text-sm text-muted-foreground">Additional Training Facility</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Secondary training location used for specialized sessions and overflow capacity. 
                    Quality facility supporting our growing program needs.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Programs:</strong> Group Training, Special Events</p>
                    <p><strong>Schedule:</strong> Varies by season</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-12 text-center">
              <p className="text-muted-foreground max-w-3xl mx-auto">
                <strong>Note:</strong> Training schedules and locations may change seasonally to best serve our athletes. 
                Current members receive schedule updates via email and the member portal. Specific addresses and directions 
                are provided upon registration.
              </p>
            </div>
          </div>
        </section>

        {/* Volunteer CTA */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Want to Coach for The Academy?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                We're always looking for passionate coaches and volunteers who share our values and 
                commitment to youth development. Join our team and make a difference in young athletes' lives.
              </p>
              <a href="/contact">
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                  Apply to Coach
                </button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
