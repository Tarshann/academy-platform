import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar } from "lucide-react";

export function SchedulesManager() {
  const { data: schedules, isLoading, refetch } = trpc.admin.schedules.list.useQuery();
  const { data: programs } = trpc.programs.list.useQuery();
  const { data: locations } = trpc.locations.list.useQuery();
  const createSchedule = trpc.admin.schedules.create.useMutation();
  const updateSchedule = trpc.admin.schedules.update.useMutation();
  const deleteSchedule = trpc.admin.schedules.delete.useMutation();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    programId: "",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    dayOfWeek: "",
    locationId: "",
    location: "",
    maxParticipants: "",
    sessionType: "regular" as "regular" | "open_gym" | "special",
  });

  // Helper to get day of week from date
  const getDayOfWeek = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return days[date.getDay()];
  };

  const handleCreate = async () => {
    try {
      const dayOfWeek = formData.startTime ? getDayOfWeek(formData.startTime) : undefined;
      await createSchedule.mutateAsync({
        programId: formData.programId ? parseInt(formData.programId) : undefined,
        title: formData.title,
        description: formData.description || undefined,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        location: formData.location || undefined,
        locationId: formData.locationId ? parseInt(formData.locationId) : undefined,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        sessionType: formData.sessionType,
        dayOfWeek: dayOfWeek as any,
      });
      toast.success("Schedule created successfully");
      setIsCreateOpen(false);
      setFormData({ programId: "", title: "", description: "", startTime: "", endTime: "", dayOfWeek: "", locationId: "", location: "", maxParticipants: "", sessionType: "regular" });
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create schedule");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await deleteSchedule.mutateAsync({ id });
      toast.success("Schedule deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error("Failed to delete schedule");
    }
  };

  if (isLoading) return <div>Loading schedules...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Schedule Management</CardTitle>
            <CardDescription>Create and manage training sessions and events</CardDescription>
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
                <DialogDescription>Add a new training session or event</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="program">Program</Label>
                  <Select value={formData.programId} onValueChange={(value) => setFormData({ ...formData, programId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select program (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {programs?.map((program) => (
                        <SelectItem key={program.id} value={program.id.toString()}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Session title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Session description (optional)"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => {
                        const dayOfWeek = getDayOfWeek(e.target.value);
                        setFormData({ ...formData, startTime: e.target.value, dayOfWeek });
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
                {formData.dayOfWeek && (
                  <div className="grid gap-2">
                    <Label>Day of Week (auto-detected)</Label>
                    <Badge variant="outline" className="w-fit capitalize">
                      {formData.dayOfWeek}
                    </Badge>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="locationId">Location</Label>
                  <Select value={formData.locationId} onValueChange={(value) => setFormData({ ...formData, locationId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {locations?.map((location: any) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location (Text Fallback)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Training location (if not using location dropdown)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sessionType">Session Type</Label>
                  <Select value={formData.sessionType || "regular"} onValueChange={(v: any) => setFormData({ ...formData, sessionType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular Training</SelectItem>
                      <SelectItem value="open_gym">Open Gym</SelectItem>
                      <SelectItem value="special">Special Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxParticipants">Max Participants (optional)</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
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
              <TableHead>Program</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No schedules yet. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              schedules?.map((schedule: any) => {
                const dayOfWeek = schedule.startTime ? getDayOfWeek(schedule.startTime.toString()) : null;
                return (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.title}</TableCell>
                    <TableCell>{programs?.find(p => p.id === schedule.programId)?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {dayOfWeek && <Badge variant="outline" className="capitalize">{dayOfWeek}</Badge>}
                    </TableCell>
                    <TableCell>{new Date(schedule.startTime).toLocaleString()}</TableCell>
                    <TableCell>{schedule.location || 'TBA'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {schedule.sessionType || 'regular'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
