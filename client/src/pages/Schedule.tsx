import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const SCHEDULE_DATA = [
  {
    day: "Tuesday",
    programs: [
      {
        name: "Academy Skills Lab",
        time: "6:00–7:00 PM",
        details: "Drop-in, $10/session, all ages",
        href: "/skills-lab",
      },
      {
        name: "Academy Performance Lab",
        time: "7:15–8:15 PM",
        details: "Members only, $280/month",
        href: "/performance-lab",
      },
    ],
  },
  {
    day: "Thursday",
    programs: [
      {
        name: "Academy Skills Lab",
        time: "6:00–7:00 PM",
        details: "Drop-in, $10/session, all ages",
        href: "/skills-lab",
      },
      {
        name: "Academy Performance Lab",
        time: "7:15–8:15 PM",
        details: "Members only, $280/month",
        href: "/performance-lab",
      },
    ],
  },
  {
    day: "Sunday",
    programs: [
      {
        name: "Academy Performance Lab",
        time: "11:00 AM–12:00 PM",
        details: "Members only, $280/month",
        href: "/performance-lab",
      },
    ],
  },
];

export default function Schedule() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />

      <main id="main-content" className="flex-1 py-16">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Weekly Schedule</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              View our weekly program schedule. Private training available by appointment.
            </p>
          </div>

          {/* Availability Overview */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 mb-12">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Tuesdays &amp; Thursdays</h3>
                    <p className="text-sm text-muted-foreground">
                      Skills Lab (6:00–7:00 PM) &amp; Performance Lab (7:15–8:15 PM)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Sundays</h3>
                    <p className="text-sm text-muted-foreground">
                      Performance Lab (11:00 AM–12:00 PM)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Private Training</h3>
                    <p className="text-sm text-muted-foreground">
                      By appointment — contact Coach Mac or Coach O
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Schedule */}
          <div className="space-y-8">
            {SCHEDULE_DATA.map((daySchedule) => (
              <Card key={daySchedule.day} className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" />
                    {daySchedule.day}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {daySchedule.programs.map((program, idx) => (
                      <Link key={idx} href={program.href} className="block">
                        <div className="p-4 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/30 transition cursor-pointer">
                          <h4 className="font-semibold text-foreground mb-2">{program.name}</h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{program.time}</span>
                            </div>
                            <p className="pt-1">{program.details}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Private Training Note */}
          <Card className="bg-muted/30 border-border mt-8">
            <CardContent className="py-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Private Training</h3>
              <p className="text-muted-foreground mb-4">
                By appointment. Contact Coach Mac or Coach O to schedule a 1-on-1 session ($60/session).
              </p>
              <Link href="/contact">
                <Button variant="outline">Contact Us to Schedule</Button>
              </Link>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary/5 border-primary/20 mt-12">
            <CardContent className="py-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Explore our programs or book a private session with one of our coaches.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/programs">
                  <Button size="lg">Browse Programs</Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    Book Private Session
                  </Button>
                </Link>
              </div>
              <div className="mt-6 text-sm text-muted-foreground">
                <p>Questions? Contact us at:</p>
                <a
                  href="mailto:omarphilmore@yahoo.com"
                  className="text-primary hover:underline font-medium"
                >
                  omarphilmore@yahoo.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
