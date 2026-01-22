import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

export function CoachesManager() {
  const { data: coaches, isLoading, refetch } = trpc.coaches.admin.list.useQuery();
  const createCoach = trpc.coaches.admin.create.useMutation();
  const updateCoach = trpc.coaches.admin.update.useMutation();
  const deleteCoach = trpc.coaches.admin.delete.useMutation();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<any>(null);
  const [formData, setFormData] = useState({
    userId: "",
    bio: "",
    specialties: "",
    certifications: "",
  });

  const handleCreate = async () => {
    try {
      if (!formData.userId) {
        toast.error("User ID is required");
        return;
      }
      await createCoach.mutateAsync({
        userId: parseInt(formData.userId),
        bio: formData.bio || undefined,
        specialties: formData.specialties || undefined,
        certifications: formData.certifications || undefined,
      });
      toast.success("Coach created successfully");
      setIsCreateOpen(false);
      setFormData({ userId: "", bio: "", specialties: "", certifications: "" });
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create coach");
    }
  };

  const handleEdit = (coach: any) => {
    setEditingCoach(coach);
    setFormData({
      userId: coach.coaches?.userId?.toString() || "",
      bio: coach.coaches?.bio || "",
      specialties: coach.coaches?.specialties || "",
      certifications: coach.coaches?.certifications || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingCoach) return;
    try {
      await updateCoach.mutateAsync({
        id: editingCoach.coaches.id,
        bio: formData.bio || undefined,
        specialties: formData.specialties || undefined,
        certifications: formData.certifications || undefined,
      });
      toast.success("Coach updated successfully");
      setEditingCoach(null);
      setFormData({ userId: "", bio: "", specialties: "", certifications: "" });
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update coach");
    }
  };

  const handleToggleActive = async (coach: any) => {
    try {
      await updateCoach.mutateAsync({
        id: coach.coaches.id,
        isActive: !coach.coaches.isActive,
      });
      toast.success("Coach status updated");
      refetch();
    } catch (error: any) {
      toast.error("Failed to update coach status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this coach? This will deactivate them.")) return;
    try {
      await deleteCoach.mutateAsync({ id });
      toast.success("Coach deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error("Failed to delete coach");
    }
  };

  if (isLoading) return <div>Loading coaches...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Coach Management</CardTitle>
              <CardDescription>Manage coaching staff and their assignments</CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Coach
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Coach</DialogTitle>
                  <DialogDescription>Assign a user as a coach</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="userId">User ID *</Label>
                    <Input
                      id="userId"
                      type="number"
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      placeholder="Enter user ID"
                    />
                    <p className="text-xs text-muted-foreground">The ID of the user to assign as a coach</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Coach biography"
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="specialties">Specialties</Label>
                    <Input
                      id="specialties"
                      value={formData.specialties}
                      onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                      placeholder="e.g., Basketball, SAQ Training, Strength Conditioning"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="certifications">Certifications</Label>
                    <Input
                      id="certifications"
                      value={formData.certifications}
                      onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                      placeholder="e.g., Certified Strength Coach, USA Basketball"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!formData.userId}>
                    Create Coach
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
                <TableHead>Specialties</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!coaches || coaches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No coaches yet. Add your first coach!
                  </TableCell>
                </TableRow>
              ) : (
                coaches.map((coach: any) => (
                  <TableRow key={coach.coaches.id}>
                    <TableCell className="font-medium">
                      {coach.users?.name || `User ${coach.coaches.userId}`}
                    </TableCell>
                    <TableCell>{coach.users?.email || "N/A"}</TableCell>
                    <TableCell>
                      {coach.coaches?.specialties ? (
                        <div className="flex flex-wrap gap-1">
                          {coach.coaches.specialties.split(',').map((s: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {s.trim()}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coach.coaches?.isActive ? "default" : "secondary"}>
                        {coach.coaches?.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(coach)}
                        >
                          {coach.coaches?.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(coach)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(coach.coaches.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingCoach && (
        <Dialog open={!!editingCoach} onOpenChange={() => setEditingCoach(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Coach</DialogTitle>
              <DialogDescription>Update coach information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-bio">Bio</Label>
                <Textarea
                  id="edit-bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Coach biography"
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-specialties">Specialties</Label>
                <Input
                  id="edit-specialties"
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  placeholder="e.g., Basketball, SAQ Training, Strength Conditioning"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-certifications">Certifications</Label>
                <Input
                  id="edit-certifications"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  placeholder="e.g., Certified Strength Coach, USA Basketball"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCoach(null)}>Cancel</Button>
              <Button onClick={handleUpdate}>Update Coach</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
