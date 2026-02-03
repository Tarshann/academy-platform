import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const SCHEDULE_DATA = [
  {
    day: "Tuesday",
    programs: [
      {
        name: "Group Workout Sessions",
        time: "Various Times",
        location: "TBD - Contact for details",
        description: "Team-based training focusing on fundamentals and game situations",
        icon: Users,
      },
      {
        name: "Skills Classes",
        time: "Various Times",
        location: "TBD - Contact for details",
        description: "Skill-specific training for ball handling, shooting, and footwork",
        icon: Users,
      },
      {
        name: "SAQ Training",
        time: "Various Times",
        location: "TBD - Contact for details",
        description: "Speed, Agility, and Quickness development",
        icon: Users,
      },
    ],
  },
  {
    day: "Thursday",
    programs: [
      {
        name: "Group Workout Sessions",
        time: "Various Times",
        location: "TBD - Contact for details",
        description: "Team-based training focusing on fundamentals and game situations",
        icon: Users,
      },
      {
        name: "Skills Classes",
        time: "Various Times",
        location: "TBD - Contact for details",
        description: "Skill-specific training for ball handling, shooting, and footwork",
        icon: Users,
      },
      {
        name: "SAQ Training",
        time: "Various Times",
        location: "TBD - Contact for details",
        description: "Speed, Agility, and Quickness development",
        icon: Users,
      },
    ],
  },
  {
    day: "Saturday",
    programs: [
      {
        name: "Private Training Sessions",
        time: "By Appointment",
        location: "TBD - Confirmed with coach",
        description: "One-on-one personalized training with Coach Mac or Coach O",
        icon: Users,
      },
    ],
  },
  {
    day: "Sunday",
    programs: [
      {
        name: "Private Training Sessions",
        time: "By Appointment",
        location: "TBD - Confirmed with coach",
        description: "One-on-one personalized training with Coach Mac or Coach O",
        icon: Users,
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
              View our typical weekly program schedule. Contact us for specific times and
              locations for each program.
            </p>
          </div>

          {/* Availability Overview */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 mb-12">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Weekends</h3>
                    <p className="text-sm text-muted-foreground">
                      Private sessions primarily available on Saturdays & Sundays
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Tuesdays & Thursdays</h3>
                    <p className="text-sm text-muted-foreground">
                      Group Sessions, Skills Classes, and SAQ Training
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Other Weekdays</h3>
                    <p className="text-sm text-muted-foreground">
                      Limited private session availability
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
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {daySchedule.programs.map((program, idx) => {
                      const Icon = program.icon;
                      return (
                        <div
                          key={idx}
                          className="p-4 border border-border rounded-lg hover:bg-muted/50 transition"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <Icon className="h-5 w-5 text-primary mt-0.5" />
                            <h4 className="font-semibold text-foreground">{program.name}</h4>
                          </div>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{program.time}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5" />
                              <span>{program.location}</span>
                            </div>
                            <p className="pt-2">{program.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <Card className="bg-primary/5 border-primary/20 mt-12">
            <CardContent className="py-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Register for group programs or book a private session with one of our coaches.
                Contact us for specific times and availability.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg">Browse Programs</Button>
                </Link>
                <Link href="/private-session-booking">
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
