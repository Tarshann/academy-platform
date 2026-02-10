import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ProgramStructuredData } from "@/components/StructuredData";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function Programs() {

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      <ProgramStructuredData 
        name="The Academy Athletic Development Programs"
        description="Comprehensive athletic development programs for basketball, flag football, and soccer athletes. SAQ training, strength conditioning, and sport-specific skill development."
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
              <p className="text-lg text-muted-foreground mb-4">
                Comprehensive athletic development programs for basketball, flag football, and soccer athletes. 
                Our focus on SAQ (Speed, Agility, Quickness) training and strength conditioning builds 
                foundational athletic qualities that translate across all sports.
              </p>
              <p className="text-sm text-muted-foreground/80">
                Explore what we offer below. Each program has its own page with full details.
              </p>
            </div>
          </div>
        </section>

        {/* Programs List */}
        <section className="py-16">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Academy Performance Lab - Featured */}
              <Card id="program-performance-lab" className="bg-card border-primary ring-1 ring-primary/20 scroll-mt-24">
                <CardHeader>
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2">
                    FLAGSHIP PROGRAM
                  </div>
                  <CardTitle className="text-foreground">Academy Performance Lab</CardTitle>
                  <CardDescription className="text-muted-foreground">Year-round structured development for committed young athletes</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Three sessions per week of SAQ training, strength conditioning, and sport-specific skill development.
                    Capped at 6–8 athletes per group for maximum coaching attention.
                  </p>
                  <p className="text-sm text-muted-foreground/80 mb-2">
                    Tuesday &amp; Thursday 7:00–8:00 PM &bull; Sunday 11:00 AM–12:00 PM
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["3 sessions per week", "SAQ & strength conditioning", "Sport-specific skill development", "Leadership opportunities (ages 13–14, by invitation)", "Sunday makeup/open session access"].map((item) => (
                      <span key={item} className="text-xs px-2.5 py-1 bg-primary/5 text-muted-foreground rounded-md border border-primary/10">
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-2xl font-bold text-primary mb-2">$280 <span className="text-sm text-muted-foreground font-normal">per month</span></p>
                    <Link href="/performance-lab">
                      <Button className="w-full">Apply for Performance Lab</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Academy Skills Lab */}
              <Card id="program-skills-lab" className="bg-card border-border scroll-mt-24">
                <CardHeader>
                  <CardTitle className="text-foreground">Academy Skills Lab</CardTitle>
                  <CardDescription className="text-muted-foreground">Community drop-in for fundamentals, movement, and fun</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Open sessions focused on movement fundamentals, coordination, and positive competition.
                    No commitment required — just show up and play.
                  </p>
                  <p className="text-sm text-muted-foreground/80 mb-2">
                    Tuesday &amp; Thursday 6:00–6:50 PM
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Movement prep & fundamentals", "Skill stations", "Competitive games", "All ages and skill levels welcome"].map((item) => (
                      <span key={item} className="text-xs px-2.5 py-1 bg-primary/5 text-muted-foreground rounded-md border border-primary/10">
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-2xl font-bold text-primary mb-2">$10 <span className="text-sm text-muted-foreground font-normal">per session</span></p>
                    <Link href="/skills-lab">
                      <Button className="w-full">Register for Skills Lab</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Private Training */}
              <Card id="program-private-training" className="bg-card border-border scroll-mt-24">
                <CardHeader>
                  <CardTitle className="text-foreground">Private Training</CardTitle>
                  <CardDescription className="text-muted-foreground">Personalized 1-on-1 coaching with Coach Mac or Coach O</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    One-on-one sessions tailored to your athlete's specific goals. Personalized plans
                    for sport-specific development and athletic growth.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Personalized training plan", "Sport-specific skill development", "Flexible scheduling", "Direct coach attention"].map((item) => (
                      <span key={item} className="text-xs px-2.5 py-1 bg-primary/5 text-muted-foreground rounded-md border border-primary/10">
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-2xl font-bold text-primary mb-2">$60 <span className="text-sm text-muted-foreground font-normal">per session</span></p>
                    <Link href="/contact">
                      <Button className="w-full">Book a Session</Button>
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
