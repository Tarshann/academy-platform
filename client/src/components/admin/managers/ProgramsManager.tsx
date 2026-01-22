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
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

export function ProgramsManager() {
  const { data: programs, isLoading, refetch } = trpc.admin.programs.list.useQuery();
  const createProgram = trpc.admin.programs.create.useMutation();
  const updateProgram = trpc.admin.programs.update.useMutation();
  const deleteProgram = trpc.admin.programs.delete.useMutation();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    category: "group" as "group" | "individual" | "shooting" | "league" | "camp" | "membership",
    sport: "" as "" | "basketball" | "football" | "soccer" | "multi_sport" | "saq",
    ageMin: "8",
    ageMax: "18",
    maxParticipants: "",
  });

  const handleCreate = async () => {
    try {
      await createProgram.mutateAsync({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        sport: formData.sport || undefined,
        ageMin: parseInt(formData.ageMin),
        ageMax: parseInt(formData.ageMax),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
      });
      toast.success("Program created successfully");
      setIsCreateOpen(false);
      setFormData({ name: "", slug: "", description: "", price: "", category: "group", sport: "", ageMin: "8", ageMax: "18", maxParticipants: "" });
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create program");
    }
  };

  const handleToggleVisibility = async (id: number, currentStatus: number) => {
    try {
      await updateProgram.mutateAsync({ id, isActive: !currentStatus });
      toast.success("Program visibility updated");
      refetch();
    } catch (error: any) {
      toast.error("Failed to update program");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this program?")) return;
    try {
      await deleteProgram.mutateAsync({ id });
      toast.success("Program deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error("Failed to delete program");
    }
  };

  if (isLoading) return <div>Loading programs...</div>;

  const sportLabels: Record<string, string> = {
    basketball: "Basketball",
    football: "Football",
    soccer: "Soccer",
    multi_sport: "Multi-Sport",
    saq: "SAQ Training",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Program Management</CardTitle>
            <CardDescription>Manage training programs and their visibility</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Program
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Program</DialogTitle>
                <DialogDescription>Add a new training program</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Program Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      setFormData({ ...formData, name, slug });
                    }}
                    placeholder="e.g., Group Training Session"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g., group-training-session"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Program description"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g., 25.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="shooting">Shooting</SelectItem>
                        <SelectItem value="league">League</SelectItem>
                        <SelectItem value="camp">Camp</SelectItem>
                        <SelectItem value="membership">Membership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sport">Sport Focus (Optional)</Label>
                  <Select value={formData.sport} onValueChange={(value: any) => setFormData({ ...formData, sport: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport focus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None / General</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="soccer">Soccer</SelectItem>
                      <SelectItem value="multi_sport">Multi-Sport</SelectItem>
                      <SelectItem value="saq">SAQ Training</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the primary sport focus or choose "Multi-Sport" / "SAQ Training" for cross-sport programs
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ageMin">Min Age</Label>
                    <Input
                      id="ageMin"
                      type="number"
                      value={formData.ageMin}
                      onChange={(e) => setFormData({ ...formData, ageMin: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ageMax">Max Age</Label>
                    <Input
                      id="ageMax"
                      type="number"
                      value={formData.ageMax}
                      onChange={(e) => setFormData({ ...formData, ageMax: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxParticipants">Max Participants</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!formData.name || !formData.slug || !formData.description || !formData.price}>
                  Create Program
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
              <TableHead>Category</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No programs yet. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              programs?.map((program: any) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell className="capitalize">{program.category}</TableCell>
                  <TableCell>
                    {program.sport ? (
                      <Badge variant="outline">{sportLabels[program.sport] || program.sport}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>${program.price}</TableCell>
                  <TableCell>
                    <Badge variant={program.isActive ? "default" : "secondary"}>
                      {program.isActive ? "Visible" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleToggleVisibility(program.id, program.isActive)}
                      >
                        {program.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(program.id)}>
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
  );
}
