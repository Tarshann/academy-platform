import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";

type LocationFormState = {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  description: string;
  latitude: string;
  longitude: string;
};

const initialForm: LocationFormState = {
  name: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  description: "",
  latitude: "",
  longitude: "",
};

export function LocationsManager() {
  const { data: locations, isLoading, refetch } = trpc.locations.admin.list.useQuery();
  const createLocation = trpc.locations.admin.create.useMutation();
  const updateLocation = trpc.locations.admin.update.useMutation();
  const deleteLocation = trpc.locations.admin.delete.useMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<LocationFormState>(initialForm);

  const resetForm = () => setFormData(initialForm);

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Location name is required.");
      return;
    }

    try {
      await createLocation.mutateAsync({
        name: formData.name,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        description: formData.description || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
      });
      toast.success("Location created successfully.");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create location.");
    }
  };

  const handleToggleVisibility = async (id: number, currentStatus: boolean) => {
    try {
      await updateLocation.mutateAsync({ id, isActive: !currentStatus });
      toast.success("Location visibility updated.");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update location.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    try {
      await deleteLocation.mutateAsync({ id });
      toast.success("Location deleted.");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete location.");
    }
  };

  if (isLoading) return <div>Loading locations...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Location Management</CardTitle>
            <CardDescription>Manage training locations and availability</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Location</DialogTitle>
                <DialogDescription>Add a new training location</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="location-name">Name *</Label>
                  <Input
                    id="location-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Main Gym"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location-address">Address</Label>
                  <Input
                    id="location-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>State</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Zip Code</Label>
                    <Input
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Latitude</Label>
                    <Input
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Longitude</Label>
                    <Input
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.name}>
                  Create Location
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
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No locations yet. Add your first location.
                </TableCell>
              </TableRow>
            ) : (
              locations?.map((location: any) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>
                    {[location.address, location.city, location.state].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell>{location.isActive ? "Active" : "Hidden"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(location.id, location.isActive)}
                      >
                        {location.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(location.id)}>
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
