import { useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";

type ScheduleFormState = {
  title: string;
  description: string;
  programId: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  location: string;
  locationId: string;
  maxParticipants: string;
  sessionType: string;
  isRecurring: boolean;
};

const initialForm: ScheduleFormState = {
  title: "",
  description: "",
  programId: "",
  startTime: "",
  endTime: "",
  dayOfWeek: "",
  location: "",
  locationId: "",
  maxParticipants: "",
  sessionType: "",
  isRecurring: false,
};

export function SchedulesManager() {
  const { data: schedules, isLoading, refetch } = trpc.admin.schedules.list.useQuery();
  const { data: programs } = trpc.admin.programs.list.useQuery();
  const { data: locations } = trpc.locations.admin.list.useQuery();
  const createSchedule = trpc.admin.schedules.create.useMutation();
  const deleteSchedule = trpc.admin.schedules.delete.useMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormState>(initialForm);

  const programOptions = useMemo(() => programs ?? [], [programs]);
  const locationOptions = useMemo(() => locations ?? [], [locations]);

  const resetForm = () => setFormData(initialForm);

  const handleCreate = async () => {
    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error("Title, start time, and end time are required.");
      return;
    }

    try {
      await createSchedule.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        programId: formData.programId ? parseInt(formData.programId, 10) : undefined,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        dayOfWeek: formData.dayOfWeek || undefined,
        location: formData.location || undefined,
        locationId: formData.locationId ? parseInt(formData.locationId, 10) : undefined,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants, 10) : null,
        sessionType: formData.sessionType || undefined,
        isRecurring: formData.isRecurring || undefined,
      });
      toast.success("Schedule created successfully.");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create schedule.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await deleteSchedule.mutateAsync({ id });
      toast.success("Schedule deleted successfully.");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete schedule.");
    }
  };

  if (isLoading) return <div>Loading schedules...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Schedule Management</CardTitle>
            <CardDescription>Manage upcoming sessions and recurring events</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Schedule</DialogTitle>
                <DialogDescription>Set up a training session or event</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="schedule-title">Title *</Label>
                  <Input
                    id="schedule-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Saturday Skills Session"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="schedule-description">Description</Label>
                  <Textarea
                    id="schedule-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional details"
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-start">Start Time *</Label>
                    <Input
                      id="schedule-start"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-end">End Time *</Label>
                    <Input
                      id="schedule-end"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Program</Label>
                    <Select
                      value={formData.programId || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, programId: value === "none" ? "" : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {programOptions.map((program: any) => (
                          <SelectItem key={program.id} value={String(program.id)}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Day of Week</Label>
                    <Select
                      value={formData.dayOfWeek || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, dayOfWeek: value === "none" ? "" : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Location (manual)</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Main Gym"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Location (saved)</Label>
                    <Select
                      value={formData.locationId || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, locationId: value === "none" ? "" : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {locationOptions.map((location: any) => (
                          <SelectItem key={location.id} value={String(location.id)}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Max Participants</Label>
                    <Input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Session Type</Label>
                    <Select
                      value={formData.sessionType || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, sessionType: value === "none" ? "" : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="open_gym">Open Gym</SelectItem>
                        <SelectItem value="special">Special</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Recurring</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.isRecurring}
                        onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.isRecurring ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.title || !formData.startTime || !formData.endTime}>
                  Create Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No schedules yet. Create your first session.
                </TableCell>
              </TableRow>
            ) : (
              schedules?.map((schedule: any) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">{schedule.title}</TableCell>
                  <TableCell>
                    {new Date(schedule.startTime).toLocaleString()} -{" "}
                    {new Date(schedule.endTime).toLocaleString()}
                  </TableCell>
                  <TableCell>{schedule.location || "—"}</TableCell>
                  <TableCell>{schedule.isRecurring ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
