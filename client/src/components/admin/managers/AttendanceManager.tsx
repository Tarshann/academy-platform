import { useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil } from "lucide-react";

type AttendanceStatus = "present" | "absent" | "excused" | "late";

const statusOptions: AttendanceStatus[] = ["present", "absent", "excused", "late"];

export function AttendanceManager() {
  const { data: schedules } = trpc.admin.schedules.list.useQuery();
  const markAttendance = trpc.attendance.markAttendance.useMutation();
  const updateAttendance = trpc.attendance.updateAttendance.useMutation();

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const scheduleId = selectedScheduleId ? parseInt(selectedScheduleId, 10) : null;

  const { data: attendanceRecords, refetch } = trpc.attendance.getBySchedule.useQuery(
    { scheduleId: scheduleId ?? 0 },
    { enabled: !!scheduleId }
  );

  const [userIdInput, setUserIdInput] = useState("");
  const [statusInput, setStatusInput] = useState<AttendanceStatus>("present");
  const [notesInput, setNotesInput] = useState("");

  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>("present");
  const [editNotes, setEditNotes] = useState("");

  const scheduleOptions = useMemo(() => schedules ?? [], [schedules]);

  const handleMarkAttendance = async () => {
    if (!scheduleId) {
      toast.error("Select a schedule first.");
      return;
    }
    if (!userIdInput) {
      toast.error("User ID is required.");
      return;
    }

    try {
      await markAttendance.mutateAsync({
        scheduleId,
        userId: parseInt(userIdInput, 10),
        status: statusInput,
        notes: notesInput || undefined,
      });
      toast.success("Attendance recorded.");
      setUserIdInput("");
      setNotesInput("");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to record attendance.");
    }
  };

  const openEditDialog = (record: any) => {
    setEditingRecord(record);
    setEditStatus(record.status);
    setEditNotes(record.notes || "");
  };

  const handleUpdateAttendance = async () => {
    if (!editingRecord) return;
    try {
      await updateAttendance.mutateAsync({
        id: editingRecord.id,
        status: editStatus,
        notes: editNotes || undefined,
      });
      toast.success("Attendance updated.");
      setEditingRecord(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update attendance.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Tracking</CardTitle>
        <CardDescription>Record attendance by schedule and review logs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Schedule</Label>
            <Select
              value={selectedScheduleId || "none"}
              onValueChange={(value) => setSelectedScheduleId(value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select schedule</SelectItem>
                {scheduleOptions.map((schedule: any) => (
                  <SelectItem key={schedule.id} value={String(schedule.id)}>
                    {schedule.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>User ID</Label>
            <Input
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              placeholder="Enter user id"
            />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={statusInput} onValueChange={(value) => setStatusInput(value as AttendanceStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Notes</Label>
          <Input
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Optional notes"
          />
        </div>
        <div>
          <Button onClick={handleMarkAttendance}>Record Attendance</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Marked At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!scheduleId ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Select a schedule to view attendance records.
                </TableCell>
              </TableRow>
            ) : attendanceRecords?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No attendance records yet.
                </TableCell>
              </TableRow>
            ) : (
              attendanceRecords?.map((record: any) => (
                <TableRow key={record.id}>
                  <TableCell>{record.userId}</TableCell>
                  <TableCell className="capitalize">{record.status}</TableCell>
                  <TableCell>{record.notes || "—"}</TableCell>
                  <TableCell>
                    {record.markedAt ? new Date(record.markedAt).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
            <DialogDescription>Update status or notes for this record.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(value) => setEditStatus(value as AttendanceStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAttendance}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
