import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, Bell, Users } from "lucide-react";
import { useEffect } from "react";

export default function MemberDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: announcements, isLoading: announcementsLoading } = trpc.announcements.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: schedules, isLoading: schedulesLoading } = trpc.schedules.upcoming.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1">
        {/* Header */}
        <section className="py-12 bg-gradient-to-br from-background via-card to-background">
          <div className="container">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
              Welcome back, {user.name || 'Member'}!
            </h1>
            <p className="text-muted-foreground">
              Your member dashboard for schedules, announcements, and more.
            </p>
          </div>
        </section>

        {/* Dashboard Content */}
        <section className="py-12">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Announcements */}
              <div className="lg:col-span-2">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Bell className="text-primary" size={24} />
                      <CardTitle className="text-foreground">Announcements</CardTitle>
                    </div>
                    <CardDescription className="text-muted-foreground">
                      Latest updates from The Academy
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {announcementsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-primary" size={32} />
                      </div>
                    ) : announcements && announcements.length > 0 ? (
                      <div className="space-y-4">
                        {announcements.map((announcement) => (
                          <div key={announcement.id} className="border-b border-border pb-4 last:border-0">
                            <h3 className="font-semibold text-foreground mb-2">{announcement.title}</h3>
                            <p className="text-muted-foreground text-sm">{announcement.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleDateString() : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No announcements at this time. Check back soon!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Links */}
              <div className="space-y-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="/programs">
                        <Users className="mr-2" size={18} />
                        View Programs
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="/signup">
                        <Calendar className="mr-2" size={18} />
                        Register for Programs
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="/contact">
                        <Bell className="mr-2" size={18} />
                        Contact Us
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {user.role === 'admin' && (
                  <Card className="bg-primary/10 border-primary">
                    <CardHeader>
                      <CardTitle className="text-foreground">Admin Access</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        You have admin privileges
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Admin features coming soon. You'll be able to manage programs, announcements, and view submissions.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Upcoming Schedule */}
            <div className="mt-8">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-primary" size={24} />
                    <CardTitle className="text-foreground">Upcoming Schedule</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    Your registered programs and sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {schedulesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                  ) : schedules && schedules.length > 0 ? (
                    <div className="space-y-4">
                      {schedules.map((schedule) => (
                        <div key={schedule.id} className="border border-border rounded-lg p-4">
                          <h3 className="font-semibold text-foreground mb-2">{schedule.title}</h3>
                          {schedule.description && (
                            <p className="text-muted-foreground text-sm mb-2">{schedule.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>
                              {new Date(schedule.startTime).toLocaleDateString()} at{' '}
                              {new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {schedule.location && <span>📍 {schedule.location}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        No upcoming sessions scheduled. Register for programs to see your schedule here.
                      </p>
                      <Button asChild>
                        <a href="/signup">Browse Programs</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
