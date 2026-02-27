import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

function ScheduleCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-48" />
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="p-4 border rounded-lg space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDateHeading(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function groupByDate(
  schedules: Array<{ startTime: Date | string; [key: string]: any }>
) {
  const groups: Record<string, typeof schedules> = {};
  for (const s of schedules) {
    const d = typeof s.startTime === "string" ? new Date(s.startTime) : s.startTime;
    const key = d.toISOString().slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

export default function Schedule() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    data: schedules,
    isLoading,
    isError,
    refetch,
  } = trpc.schedules.upcoming.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const showApiData = isAuthenticated && !authLoading;
  const grouped = schedules ? groupByDate(schedules) : [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />

      <main id="main-content" className="flex-1 py-16">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Weekly Schedule
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              View our weekly program schedule. Private training available by
              appointment.
            </p>
          </div>

          {/* Availability Overview */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 mb-12">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">
                      Tuesdays &amp; Thursdays
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Skills Lab (6:00–6:50 PM) &amp; Performance Lab
                      (7:00–8:00 PM)
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

          {/* Dynamic Upcoming Sessions */}
          {showApiData && (
            <div className="space-y-8 mb-12">
              <h2 className="text-2xl font-bold text-center">
                Upcoming Sessions
              </h2>

              {isLoading && (
                <div className="space-y-6">
                  <ScheduleCardSkeleton />
                  <ScheduleCardSkeleton />
                  <ScheduleCardSkeleton />
                </div>
              )}

              {isError && (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Unable to load schedule
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Something went wrong while fetching the schedule.
                  </p>
                  <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}

              {!isLoading && !isError && grouped.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground">
                    No upcoming sessions scheduled. Check back soon!
                  </p>
                </div>
              )}

              {!isLoading &&
                !isError &&
                grouped.map(([dateKey, sessions]) => (
                  <Card key={dateKey} className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-primary" />
                        {formatDateHeading(sessions[0].startTime)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/30 transition"
                          >
                            <h4 className="font-semibold text-foreground mb-2">
                              {session.title}
                            </h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {formatTime(session.startTime)} –{" "}
                                  {formatTime(session.endTime)}
                                </span>
                              </div>
                              {session.location && (
                                <p className="pt-1">{session.location}</p>
                              )}
                              {session.description && (
                                <p className="pt-1">{session.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {/* Private Training Note */}
          <Card className="bg-muted/30 border-border mt-8">
            <CardContent className="py-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Private Training</h3>
              <p className="text-muted-foreground mb-4">
                By appointment. Contact Coach Mac or Coach O to schedule a
                1-on-1 session ($60/session).
              </p>
              <a href="https://academytn.com/contact">
                <Button variant="outline">Contact Us to Schedule</Button>
              </a>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary/5 border-primary/20 mt-12">
            <CardContent className="py-8 text-center">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Explore our programs or book a private session with one of our
                coaches.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://academytn.com/programs">
                  <Button size="lg">Browse Programs</Button>
                </a>
                <a href="https://academytn.com/contact">
                  <Button size="lg" variant="outline">
                    Book Private Session
                  </Button>
                </a>
              </div>
              <div className="mt-6 text-sm text-muted-foreground">
                <p>Questions? Contact us:</p>
                <p className="mt-1">
                  <span className="font-medium">Coach O:</span>{" "}
                  <a
                    href="tel:+15712920633"
                    className="text-primary hover:underline"
                  >
                    (571) 292-0633
                  </a>{" "}
                  ·{" "}
                  <a
                    href="mailto:omarphilmore@yahoo.com"
                    className="text-primary hover:underline"
                  >
                    omarphilmore@yahoo.com
                  </a>
                </p>
                <p>
                  <span className="font-medium">Coach Mac:</span>{" "}
                  <a
                    href="tel:+13155426222"
                    className="text-primary hover:underline"
                  >
                    (315) 542-6222
                  </a>{" "}
                  ·{" "}
                  <a
                    href="mailto:Tarshann@gmail.com"
                    className="text-primary hover:underline"
                  >
                    Tarshann@gmail.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
