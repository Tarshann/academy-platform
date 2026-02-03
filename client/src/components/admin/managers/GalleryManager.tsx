import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Image, Eye, EyeOff, Upload, Loader2 } from "lucide-react";

type PhotoCategory = "training" | "highlights";

interface PhotoForm {
  title: string;
  description: string;
  category: PhotoCategory;
}

const defaultForm: PhotoForm = {
  title: "",
  description: "",
  category: "training",
};

export function GalleryManager() {
  const toast = ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    if (variant === "destructive") {
      alert(`Error: ${title}${description ? ` - ${description}` : ""}`);
    } else {
      console.log(title);
    }
  };
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PhotoForm>(defaultForm);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: photos, isLoading } = trpc.gallery.admin.list.useQuery();

  const uploadMutation = trpc.gallery.admin.upload.useMutation({
    onSuccess: () => {
      utils.gallery.admin.list.invalidate();
      utils.gallery.list.invalidate();
      setIsAddOpen(false);
      setForm(defaultForm);
      setPreviewUrl(null);
      setSelectedFile(null);
      toast({ title: "Photo added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error adding photo", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = trpc.gallery.admin.update.useMutation({
    onSuccess: () => {
      utils.gallery.admin.list.invalidate();
      utils.gallery.list.invalidate();
      setIsEditOpen(false);
      setEditingId(null);
      setForm(defaultForm);
      toast({ title: "Photo updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating photo", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = trpc.gallery.admin.delete.useMutation({
    onSuccess: () => {
      utils.gallery.admin.list.invalidate();
      utils.gallery.list.invalidate();
      toast({ title: "Photo deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting photo", description: error.message, variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !selectedFile) {
      toast({ title: "Please fill in required fields and select an image", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Upload to S3 via API
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      const { url, key } = await response.json();
      
      uploadMutation.mutate({
        title: form.title,
        description: form.description || undefined,
        imageUrl: url,
        imageKey: key,
        category: form.category,
      });
    } catch (error) {
      toast({ title: "Error uploading image", description: String(error), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = () => {
    if (!editingId || !form.title) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    updateMutation.mutate({
      id: editingId,
      title: form.title,
      description: form.description || undefined,
      category: form.category,
    });
  };

  const openEditDialog = (photo: any) => {
    setEditingId(photo.id);
    setForm({
      title: photo.title || "",
      description: photo.description || "",
      category: photo.category || "training",
    });
    setIsEditOpen(true);
  };

  const toggleVisibility = (photo: any) => {
    updateMutation.mutate({
      id: photo.id,
      isVisible: !photo.isVisible,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this photo?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Photo Gallery
        </CardTitle>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setForm(defaultForm);
            setPreviewUrl(null);
            setSelectedFile(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(defaultForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Photo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Photo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Image *</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="relative">
                      <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded" />
                      <p className="text-sm text-muted-foreground mt-2">Click to change image</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload an image</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Photo title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(value: PhotoCategory) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="highlights">Highlights</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={uploading || uploadMutation.isPending} 
                className="w-full"
              >
                {uploading || uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Add Photo"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!photos || photos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No photos yet. Add your first photo!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              {photos.length} photo{photos.length !== 1 ? "s" : ""} in gallery
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo: any) => (
                <div
                  key={photo.id}
                  className={`relative group rounded-lg overflow-hidden border ${
                    !photo.isVisible ? "opacity-60" : ""
                  }`}
                >
                  {/* Image */}
                  <div className="aspect-square bg-muted">
                    {photo.imageUrl ? (
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20"
                        onClick={() => toggleVisibility(photo)}
                        title={photo.isVisible ? "Hide" : "Show"}
                      >
                        {photo.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20"
                        onClick={() => openEditDialog(photo)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-red-500/50"
                        onClick={() => handleDelete(photo.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-white">
                      <p className="font-medium text-sm truncate">{photo.title}</p>
                      <p className="text-xs text-white/70 capitalize">{photo.category}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  {!photo.isVisible && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded">
                      Hidden
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                placeholder="Photo title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={form.category}
                onValueChange={(value: PhotoCategory) => setForm({ ...form, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="highlights">Highlights</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="flex-1">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
