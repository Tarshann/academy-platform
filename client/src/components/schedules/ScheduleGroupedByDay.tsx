import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { CheckCircle2, XCircle } from "lucide-react";

interface Schedule {
  id: number;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  location?: string;
  sessionType?: string;
  maxParticipants?: number;
  dayOfWeek?: string;
}

interface ScheduleGroupedByDayProps {
  schedules: Schedule[];
  myAttendance?: Array<{ scheduleId: number; status: string }>;
  onRegister?: (scheduleId: number) => void;
  showRegisterButton?: boolean;
}

const dayLabels: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const getDayOfWeek = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[d.getDay()];
};

export function ScheduleGroupedByDay({ schedules, myAttendance, onRegister, showRegisterButton = false }: ScheduleGroupedByDayProps) {
  // Group schedules by day of week
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const dayOfWeek = schedule.dayOfWeek || getDayOfWeek(schedule.startTime);
    if (!acc[dayOfWeek]) {
      acc[dayOfWeek] = [];
    }
    acc[dayOfWeek].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  // Order days: Tuesday, Thursday, Sunday first (per vision), then others
  const dayOrder = ['tuesday', 'thursday', 'sunday', 'monday', 'wednesday', 'friday', 'saturday'];
  const orderedDays = dayOrder.filter(day => groupedSchedules[day]?.length > 0)
    .concat(Object.keys(groupedSchedules).filter(day => !dayOrder.includes(day)));

  if (orderedDays.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          No upcoming sessions scheduled. Register for programs to see your schedule here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orderedDays.map((day) => (
        <Card key={day} className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {dayLabels[day] || day.charAt(0).toUpperCase() + day.slice(1)}
              {day === 'sunday' && (
                <Badge variant="secondary" className="ml-2">Open Gym Day</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupedSchedules[day].map((schedule) => {
                const attendance = myAttendance?.find((a: any) => a.scheduleId === schedule.id);
                const isOpenGym = day === 'sunday' && schedule.sessionType === 'open_gym';
                
                return (
                  <div key={schedule.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{schedule.title}</h3>
                        {schedule.description && (
                          <p className="text-muted-foreground text-sm mb-2">{schedule.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {isOpenGym && (
                          <Badge variant="default" className="bg-primary">Open Gym</Badge>
                        )}
                        {schedule.sessionType && !isOpenGym && (
                          <Badge variant="outline" className="capitalize">
                            {schedule.sessionType === 'open_gym' ? 'Open Gym' : 
                             schedule.sessionType === 'special' ? 'Special Event' : 'Regular Training'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {' '}
                        {new Date(schedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {schedule.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {schedule.location}
                        </span>
                      )}
                      {schedule.maxParticipants && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {schedule.maxParticipants} max
                        </span>
                      )}
                    </div>

                    {attendance && (
                      <div className="mt-2">
                        <Badge variant={
                          attendance.status === 'present' ? 'default' :
                          attendance.status === 'absent' ? 'destructive' :
                          attendance.status === 'late' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {attendance.status === 'present' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {attendance.status === 'absent' && <XCircle className="h-3 w-3 mr-1" />}
                          Attendance: {attendance.status}
                        </Badge>
                      </div>
                    )}

                    {showRegisterButton && onRegister && (
                      <div className="mt-3">
                        <Button size="sm" onClick={() => onRegister(schedule.id)}>
                          Register
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
