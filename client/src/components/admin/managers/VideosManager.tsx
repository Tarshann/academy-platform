import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, ExternalLink, Video, Eye, EyeOff } from "lucide-react";
// Simple toast replacement using alerts

type VideoCategory = "training" | "highlights";
type VideoPlatform = "tiktok" | "instagram";

interface VideoForm {
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  category: VideoCategory;
  platform: VideoPlatform;
}

const defaultForm: VideoForm = {
  title: "",
  description: "",
  url: "",
  thumbnail: "",
  category: "training",
  platform: "tiktok",
};

export function VideosManager() {
  const toast = ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    if (variant === "destructive") {
      alert(`Error: ${title}${description ? ` - ${description}` : ""}`);
    } else {
      // Use console for success messages to avoid blocking
      console.log(title);
    }
  };
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<VideoForm>(defaultForm);

  const utils = trpc.useUtils();
  const { data: videos, isLoading } = trpc.videos.admin.list.useQuery();

  const createMutation = trpc.videos.admin.create.useMutation({
    onSuccess: () => {
      utils.videos.admin.list.invalidate();
      utils.videos.list.invalidate();
      setIsAddOpen(false);
      setForm(defaultForm);
      toast({ title: "Video added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error adding video", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = trpc.videos.admin.update.useMutation({
    onSuccess: () => {
      utils.videos.admin.list.invalidate();
      utils.videos.list.invalidate();
      setIsEditOpen(false);
      setEditingId(null);
      setForm(defaultForm);
      toast({ title: "Video updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating video", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = trpc.videos.admin.delete.useMutation({
    onSuccess: () => {
      utils.videos.admin.list.invalidate();
      utils.videos.list.invalidate();
      toast({ title: "Video deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting video", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!form.title || !form.url) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    // Auto-detect platform from URL
    let platform = form.platform;
    if (form.url.includes("tiktok.com")) {
      platform = "tiktok";
    } else if (form.url.includes("instagram.com")) {
      platform = "instagram";
    }

    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      url: form.url,
      thumbnail: form.thumbnail || undefined,
      category: form.category,
      platform: platform,
    });
  };

  const handleUpdate = () => {
    if (!editingId || !form.title || !form.url) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    // Auto-detect platform from URL
    let platform = form.platform;
    if (form.url.includes("tiktok.com")) {
      platform = "tiktok";
    } else if (form.url.includes("instagram.com")) {
      platform = "instagram";
    }

    updateMutation.mutate({
      id: editingId,
      title: form.title,
      description: form.description || undefined,
      url: form.url,
      thumbnail: form.thumbnail || undefined,
      category: form.category,
      platform: platform,
    });
  };

  const openEditDialog = (video: any) => {
    setEditingId(video.id);
    setForm({
      title: video.title || "",
      description: video.description || "",
      url: video.url || "",
      thumbnail: video.thumbnail || "",
      category: video.category || "training",
      platform: video.platform || "tiktok",
    });
    setIsEditOpen(true);
  };

  const togglePublished = (video: any) => {
    updateMutation.mutate({
      id: video.id,
      isPublished: !video.isPublished,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this video?")) {
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
          <Video className="h-5 w-5" />
          Video Library
        </CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(defaultForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url">Video URL *</Label>
                <Input
                  id="url"
                  placeholder="https://www.tiktok.com/@... or https://www.instagram.com/reel/..."
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Paste a TikTok or Instagram video/reel URL. Platform will be auto-detected.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Video title"
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
                  onValueChange={(value: VideoCategory) => setForm({ ...form, category: value })}
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
              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  placeholder="https://... (optional)"
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Optional custom thumbnail image URL. Leave blank to use platform-branded placeholder (TikTok/Instagram logo).
                </p>
              </div>
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Adding..." : "Add Video"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!videos || videos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No videos yet. Add your first video!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              {videos.length} video{videos.length !== 1 ? "s" : ""} in library
            </p>
            <div className="grid gap-4">
              {videos.map((video: any) => (
                <div
                  key={video.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg ${
                    !video.isPublished ? "opacity-60 bg-muted/50" : ""
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-24 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{video.title}</h4>
                      {!video.isPublished && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        video.platform === "tiktok" 
                          ? "bg-black text-white" 
                          : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      }`}>
                        {video.platform === "tiktok" ? "TikTok" : "Instagram"}
                      </span>
                      <span className="capitalize">{video.category}</span>
                      {video.viewCount > 0 && (
                        <span>• {video.viewCount} views</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePublished(video)}
                      title={video.isPublished ? "Unpublish" : "Publish"}
                    >
                      {video.isPublished ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(video)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(video.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-url">Video URL *</Label>
                <Input
                  id="edit-url"
                  placeholder="https://www.tiktok.com/@... or https://www.instagram.com/reel/..."
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  placeholder="Video title"
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
                  onValueChange={(value: VideoCategory) => setForm({ ...form, category: value })}
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
              <div className="space-y-2">
                <Label htmlFor="edit-thumbnail">Thumbnail URL</Label>
                <Input
                  id="edit-thumbnail"
                  placeholder="https://... (optional)"
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                />
              </div>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
