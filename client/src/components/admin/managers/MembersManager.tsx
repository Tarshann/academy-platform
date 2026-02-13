import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Shield, ShieldCheck } from "lucide-react";

export function MembersManager() {
  const { data: members, isLoading, refetch } = trpc.admin.members.list.useQuery();
  const { data: programs } = trpc.admin.programs.list.useQuery();
  const assignProgram = trpc.admin.members.assignProgram.useMutation();
  const removeProgram = trpc.admin.members.removeProgram.useMutation();
  const updateRole = trpc.admin.members.updateRole.useMutation();
  const createMember = trpc.admin.members.create.useMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [assignUserId, setAssignUserId] = useState<number | null>(null);
  const [assignProgramId, setAssignProgramId] = useState<string>("");

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    try {
      await createMember.mutateAsync({ name: newName.trim(), email: newEmail.trim() });
      toast.success("Member added successfully");
      setIsCreateOpen(false);
      setNewName("");
      setNewEmail("");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to add member");
    }
  };

  const handleAssignProgram = async (userId: number) => {
    if (!assignProgramId) return;
    try {
      await assignProgram.mutateAsync({ userId, programId: parseInt(assignProgramId) });
      toast.success("Program assigned successfully");
      setAssignUserId(null);
      setAssignProgramId("");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to assign program");
    }
  };

  const handleRemoveProgram = async (enrollmentId: number) => {
    try {
      await removeProgram.mutateAsync({ enrollmentId });
      toast.success("Program removed");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove program");
    }
  };

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (newRole === "admin" && !confirm("Grant admin access to this user?")) return;
    try {
      await updateRole.mutateAsync({ userId, role: newRole as "user" | "admin" });
      toast.success(`Role updated to ${newRole}`);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update role");
    }
  };

  if (isLoading) return <div>Loading members...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Members & Roster</CardTitle>
            <CardDescription>Manage members and their program assignments</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member Manually</DialogTitle>
                <DialogDescription>
                  Create a placeholder account for a parent who hasn't signed up yet.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="memberName">Name *</Label>
                  <Input
                    id="memberName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Parent name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="memberEmail">Email *</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="parent@email.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleCreate}
                  disabled={!newName.trim() || !newEmail.trim() || createMember.isPending}
                >
                  Add Member
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Programs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No members yet.
                </TableCell>
              </TableRow>
            ) : (
              members?.map((member: any) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.name || "—"}
                    {member.loginMethod === "placeholder" && (
                      <Badge variant="outline" className="ml-2 text-xs">Placeholder</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                      {member.role === "admin" ? (
                        <><ShieldCheck className="h-3 w-3 mr-1" />Admin</>
                      ) : (
                        "Member"
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.programs?.length > 0 ? (
                        member.programs.map((p: any) => (
                          <Badge key={p.enrollmentId} variant="outline" className="text-xs gap-1">
                            {p.programName}
                            <button
                              onClick={() => handleRemoveProgram(p.enrollmentId)}
                              className="ml-1 hover:text-destructive"
                              title="Remove from program"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No programs</span>
                      )}
                    </div>
                    {/* Inline assign form */}
                    {assignUserId === member.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <Select value={assignProgramId} onValueChange={setAssignProgramId}>
                          <SelectTrigger className="h-8 w-48">
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            {programs?.map((p: any) => (
                              <SelectItem key={p.id} value={p.id.toString()}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8"
                          onClick={() => handleAssignProgram(member.id)}
                          disabled={!assignProgramId || assignProgram.isPending}
                        >
                          Assign
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={() => { setAssignUserId(null); setAssignProgramId(""); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs mt-1"
                        onClick={() => setAssignUserId(member.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Assign Program
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleRole(member.id, member.role)}
                      title={member.role === "admin" ? "Demote to member" : "Promote to admin"}
                    >
                      <Shield className="h-4 w-4" />
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
