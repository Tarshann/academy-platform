import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, Bell, Users, Clock, MapPin, Settings } from "lucide-react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { ScheduleItemSkeleton } from "@/components/skeletons/ScheduleItemSkeleton";

// Helper to get day of week from schedule
const getDayOfWeek = (schedule: any): string | null => {
  if (schedule.dayOfWeek) return schedule.dayOfWeek;
  if (schedule.startTime) {
    const date = new Date(schedule.startTime);
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return days[date.getDay()];
  }
  return null;
};

const buildDirectionsUrl = (location: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  name?: string | null;
}) => {
  if (location.latitude && location.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }

  const addressParts = [
    location.address,
    location.city,
    location.state,
    location.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  const query = addressParts || location.name;
  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

export default function MemberDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: schedules, isLoading: schedulesLoading, refetch: refetchSchedules } = trpc.schedules.upcoming.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: locations } = trpc.locations.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myAttendance, isLoading: attendanceLoading } = trpc.attendance.getMyAttendance.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: attendanceStats } = trpc.attendance.getMyStats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const registerForSession = trpc.schedules.register.useMutation();
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const locationLookup = useMemo(() => {
    const lookup = new Map<number, any>();
    locations?.forEach((location: any) => {
      lookup.set(location.id, location);
    });
    return lookup;
  }, [locations]);

  // Group schedules by day of week
  const schedulesByDay = useMemo(() => {
    if (!schedules) return {};
    const grouped: Record<string, any[]> = {};
    schedules
      .filter((schedule: any) => {
        if (selectedLocation === "all") return true;
        const locationId = schedule.locationId?.toString();
        if (locationId) {
          return locationId === selectedLocation;
        }
        return schedule.location === selectedLocation;
      })
      .forEach((schedule: any) => {
      const day = getDayOfWeek(schedule);
      if (day) {
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(schedule);
      } else {
        if (!grouped['other']) grouped['other'] = [];
        grouped['other'].push(schedule);
      }
    });
    return grouped;
  }, [schedules, selectedLocation]);

  const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'other'];
  const dayLabels: Record<string, string> = {
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    other: 'Other',
  };

  const handleRegister = async (scheduleId: number) => {
    try {
      await registerForSession.mutateAsync({ scheduleId });
      toast.success("Successfully registered for session!");
      refetchSchedules();
    } catch (error: any) {
      toast.error(error?.message || "Failed to register for session");
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, loading]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      <main id="main-content" className="flex-1 py-12">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">Member Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name || 'Member'}!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/programs">
                      <Users className="mr-2" size={18} />
                      Browse Programs
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/chat">
                      <Users className="mr-2" size={18} />
                      Member Chat
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/settings">
                      <Settings className="mr-2" size={18} />
                      Notification Settings
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Attendance Stats */}
              {attendanceStats && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Attendance Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Sessions:</span>
                        <span className="font-semibold">{attendanceStats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Present:</span>
                        <span className="font-semibold text-green-600">{attendanceStats.present}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Attendance Rate:</span>
                        <span className="font-semibold">{attendanceStats.attendanceRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {user.role === 'admin' && (
                <Card className="bg-primary/10 border-primary">
                  <CardHeader>
                    <CardTitle className="text-foreground">Admin Access</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      You have admin privileges
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" asChild>
                      <a href="/admin">Go to Admin Dashboard</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Upcoming Schedule - Grouped by Day */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-primary" size={24} />
                    <CardTitle className="text-foreground">Upcoming Schedule</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    Your registered programs and sessions, organized by day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {locations && locations.length > 0 && (
                    <div className="mb-6">
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Filter by location
                      </label>
                      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="w-full sm:w-[320px]">
                          <SelectValue placeholder="All locations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All locations</SelectItem>
                          {locations.map((location: any) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {schedulesLoading ? (
                    <div className="space-y-4">
                      <ScheduleItemSkeleton />
                      <ScheduleItemSkeleton />
                      <ScheduleItemSkeleton />
                    </div>
                  ) : schedules && schedules.length > 0 ? (
                    <div className="space-y-6">
                      {dayOrder.map((day) => {
                        const daySchedules = schedulesByDay[day];
                        if (!daySchedules || daySchedules.length === 0) return null;
                        
                        return (
                          <div key={day} className="space-y-3">
                            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                              {dayLabels[day]}
                              {day === 'sunday' && (
                                <Badge variant="secondary" className="ml-2">Open Gym Day</Badge>
                              )}
                              {(day === 'tuesday' || day === 'thursday') && (
                                <Badge variant="outline" className="ml-2">Regular Training</Badge>
                              )}
                            </h3>
                            {daySchedules.map((schedule: any) => {
                              const isOpenGym = schedule.sessionType === 'open_gym' || (day === 'sunday' && !schedule.sessionType);
                              const locationDetails = schedule.locationId
                                ? locationLookup.get(schedule.locationId)
                                : null;
                              const addressParts = [
                                locationDetails?.address,
                                locationDetails?.city,
                                locationDetails?.state,
                                locationDetails?.zipCode,
                              ]
                                .filter(Boolean)
                                .join(", ");
                              const directionsUrl = buildDirectionsUrl({
                                ...locationDetails,
                                name: schedule.location,
                              });
                              return (
                                <div key={schedule.id} className="border border-border rounded-lg p-4 hover:bg-card/50 transition-colors">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-foreground mb-2">{schedule.title}</h4>
                                      {schedule.description && (
                                        <p className="text-muted-foreground text-sm mb-3">{schedule.description}</p>
                                      )}
                                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-2">
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-4 w-4" />
                                          {new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(schedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {(schedule.location || locationDetails?.name) && (
                                          <span className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {locationDetails?.name || schedule.location}
                                            {addressParts ? ` · ${addressParts}` : ""}
                                          </span>
                                        )}
                                        {schedule.sessionType && (
                                          <Badge variant={isOpenGym ? "default" : "outline"} className="capitalize">
                                            {schedule.sessionType === 'open_gym' ? '🏀 Open Gym' : 
                                             schedule.sessionType === 'special' ? '⭐ Special Event' : 'Regular Training'}
                                          </Badge>
                                        )}
                                        {schedule.maxParticipants && (
                                          <span className="text-xs">
                                            Capacity: {schedule.maxParticipants}
                                          </span>
                                        )}
                                      </div>
                                      {directionsUrl && (
                                        <a
                                          href={directionsUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                                        >
                                          Get directions
                                        </a>
                                      )}
                                      {myAttendance && myAttendance.find((a: any) => a.scheduleId === schedule.id) && (
                                        <div className="mt-2">
                                          <Badge variant="secondary" className="text-xs">
                                            {myAttendance.find((a: any) => a.scheduleId === schedule.id)?.status === 'present' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                            {myAttendance.find((a: any) => a.scheduleId === schedule.id)?.status === 'absent' && <XCircle className="h-3 w-3 mr-1" />}
                                            Attendance: {myAttendance.find((a: any) => a.scheduleId === schedule.id)?.status || 'Not marked'}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleRegister(schedule.id)}
                                      disabled={registerForSession.isPending}
                                    >
                                      Register
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        No upcoming sessions scheduled. Register for programs to see your schedule here.
                      </p>
                      <Button asChild>
                        <a href="/programs">Browse Programs</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attendance History */}
              {myAttendance && myAttendance.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Attendance History</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Your attendance record for training sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {myAttendance.slice(0, 10).map((record: any) => (
                        <div key={record.id} className="flex items-center justify-between border-b border-border pb-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {new Date(record.markedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Session ID: {record.scheduleId}</p>
                          </div>
                          <Badge variant={
                            record.status === 'present' ? 'default' :
                            record.status === 'absent' ? 'destructive' :
                            record.status === 'late' ? 'secondary' : 'outline'
                          }>
                            {record.status === 'present' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {record.status === 'absent' && <XCircle className="h-3 w-3 mr-1" />}
                            {record.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
