import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye, EyeOff, ExternalLink, Share2, Search, Filter, Pencil, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

type SocialPlatform = "instagram" | "tiktok" | "twitter" | "facebook" | "youtube";

interface PostForm {
  platform: SocialPlatform;
  postUrl: string;
  thumbnailUrl: string;
  caption: string;
  embedHtml: string;
  postedAt: string;
}

const defaultForm: PostForm = {
  platform: "instagram",
  postUrl: "",
  thumbnailUrl: "",
  caption: "",
  embedHtml: "",
  postedAt: "",
};

const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; color: string; bgClass: string }> = {
  instagram: { label: "Instagram", color: "#E4405F", bgClass: "bg-gradient-to-r from-purple-500 to-pink-500 text-white" },
  tiktok: { label: "TikTok", color: "#000000", bgClass: "bg-black text-white" },
  twitter: { label: "X / Twitter", color: "#1DA1F2", bgClass: "bg-sky-500 text-white" },
  facebook: { label: "Facebook", color: "#1877F2", bgClass: "bg-blue-600 text-white" },
  youtube: { label: "YouTube", color: "#FF0000", bgClass: "bg-red-600 text-white" },
};

function detectPlatform(url: string): SocialPlatform | null {
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("facebook.com") || url.includes("fb.com")) return "facebook";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return null;
}

function PostFormFields({
  form,
  setForm,
  onUrlChange,
}: {
  form: PostForm;
  setForm: (f: PostForm) => void;
  onUrlChange?: (url: string) => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Post URL *</Label>
        <Input
          placeholder="https://www.instagram.com/p/... or https://www.tiktok.com/@..."
          value={form.postUrl}
          onChange={(e) => onUrlChange ? onUrlChange(e.target.value) : setForm({ ...form, postUrl: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Paste a social media post URL. Platform will be auto-detected.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Platform *</Label>
        <Select
          value={form.platform}
          onValueChange={(value: SocialPlatform) => setForm({ ...form, platform: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Caption</Label>
        <Textarea
          placeholder="Optional caption or description"
          value={form.caption}
          onChange={(e) => setForm({ ...form, caption: e.target.value })}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Thumbnail URL</Label>
        <Input
          placeholder="https://... (optional preview image)"
          value={form.thumbnailUrl}
          onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Original Post Date</Label>
        <Input
          type="datetime-local"
          value={form.postedAt}
          onChange={(e) => setForm({ ...form, postedAt: e.target.value })}
        />
      </div>
    </div>
  );
}

export function SocialPostsManager() {
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
  const [form, setForm] = useState<PostForm>(defaultForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState<SocialPlatform | "all">("all");

  const utils = trpc.useUtils();
  const { data: posts, isLoading } = trpc.socialPosts.admin.list.useQuery();

  const createMutation = trpc.socialPosts.admin.create.useMutation({
    onSuccess: () => {
      utils.socialPosts.admin.list.invalidate();
      utils.socialPosts.list.invalidate();
      setIsAddOpen(false);
      setForm(defaultForm);
      toast({ title: "Social post added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error adding post", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = trpc.socialPosts.admin.update.useMutation({
    onSuccess: () => {
      utils.socialPosts.admin.list.invalidate();
      utils.socialPosts.list.invalidate();
      setIsEditOpen(false);
      setEditingId(null);
      setForm(defaultForm);
      toast({ title: "Post updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating post", description: error.message, variant: "destructive" });
    },
  });

  const toggleMutation = trpc.socialPosts.admin.toggleVisibility.useMutation({
    onSuccess: () => {
      utils.socialPosts.admin.list.invalidate();
      utils.socialPosts.list.invalidate();
    },
    onError: (error) => {
      toast({ title: "Error updating visibility", description: error.message, variant: "destructive" });
    },
  });

  const reorderMutation = trpc.socialPosts.admin.reorder.useMutation({
    onSuccess: () => {
      utils.socialPosts.admin.list.invalidate();
      utils.socialPosts.list.invalidate();
    },
    onError: (error) => {
      toast({ title: "Error reordering", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = trpc.socialPosts.admin.delete.useMutation({
    onSuccess: () => {
      utils.socialPosts.admin.list.invalidate();
      utils.socialPosts.list.invalidate();
      toast({ title: "Post deleted" });
    },
    onError: (error) => {
      toast({ title: "Error deleting post", description: error.message, variant: "destructive" });
    },
  });

  const handleUrlChange = (url: string) => {
    const detected = detectPlatform(url);
    setForm({
      ...form,
      postUrl: url,
      ...(detected ? { platform: detected } : {}),
    });
  };

  const handleSubmit = () => {
    if (!form.postUrl) {
      toast({ title: "Please provide a post URL", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      platform: form.platform,
      postUrl: form.postUrl,
      thumbnailUrl: form.thumbnailUrl || undefined,
      caption: form.caption || undefined,
      embedHtml: form.embedHtml || undefined,
      postedAt: form.postedAt || undefined,
    });
  };

  const handleUpdate = () => {
    if (!editingId || !form.postUrl) {
      toast({ title: "Please fill in the post URL", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      id: editingId,
      platform: form.platform,
      postUrl: form.postUrl,
      thumbnailUrl: form.thumbnailUrl || undefined,
      caption: form.caption || undefined,
    });
  };

  const openEditDialog = (post: any) => {
    setEditingId(post.id);
    setForm({
      platform: post.platform || "instagram",
      postUrl: post.postUrl || "",
      thumbnailUrl: post.thumbnailUrl || "",
      caption: post.caption || "",
      embedHtml: post.embedHtml || "",
      postedAt: post.postedAt ? new Date(post.postedAt).toISOString().slice(0, 16) : "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this social post?")) {
      deleteMutation.mutate({ id });
    }
  };

  const movePost = useCallback((index: number, direction: "up" | "down") => {
    if (!posts) return;
    const ids = posts.map((p: any) => p.id);
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= ids.length) return;
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    reorderMutation.mutate({ orderedIds: ids });
  }, [posts, reorderMutation]);

  const filteredPosts = (posts ?? []).filter((post: any) => {
    const matchesPlatform = filterPlatform === "all" || post.platform === filterPlatform;
    const matchesSearch = !searchQuery ||
      (post.caption?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      post.postUrl.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const platformCounts = (posts ?? []).reduce((acc: Record<string, number>, post: any) => {
    acc[post.platform] = (acc[post.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
        <div>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Gallery
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Manage social media posts displayed in the member gallery. Drag to reorder.
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setForm(defaultForm);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Social Media Post</DialogTitle>
            </DialogHeader>
            <PostFormFields form={form} setForm={setForm} onUrlChange={handleUrlChange} />
            <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? "Adding..." : "Add Post"}
            </Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        {posts && posts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
              const count = platformCounts[key] || 0;
              if (count === 0) return null;
              return (
                <Badge
                  key={key}
                  variant="outline"
                  className="cursor-pointer select-none"
                  onClick={() => setFilterPlatform(filterPlatform === key ? "all" : key as SocialPlatform)}
                  style={{
                    borderColor: filterPlatform === key ? config.color : undefined,
                    backgroundColor: filterPlatform === key ? `${config.color}15` : undefined,
                  }}
                >
                  {config.label}: {count}
                </Badge>
              );
            })}
            <Badge
              variant="outline"
              className="cursor-pointer select-none"
              onClick={() => setFilterPlatform("all")}
              style={{
                borderColor: filterPlatform === "all" ? "hsl(var(--primary))" : undefined,
              }}
            >
              All: {posts.length}
            </Badge>
          </div>
        )}

        {/* Search */}
        {posts && posts.length > 3 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by caption or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {!posts || posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No social posts yet</p>
            <p className="text-sm mt-1">Add posts from Instagram, TikTok, X, Facebook, or YouTube</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No posts match your filters</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredPosts.map((post: any, index: number) => {
              const config = PLATFORM_CONFIG[post.platform as SocialPlatform];
              return (
                <div
                  key={post.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg transition-colors hover:bg-muted/30 ${
                    !post.isVisible ? "opacity-60 bg-muted/50" : ""
                  }`}
                >
                  {/* Reorder Controls */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => movePost(index, "up")}
                      disabled={index === 0 || reorderMutation.isPending}
                      title="Move up"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <GripVertical className="h-4 w-4 text-muted-foreground mx-auto" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => movePost(index, "down")}
                      disabled={index === filteredPosts.length - 1 || reorderMutation.isPending}
                      title="Move down"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                    {post.thumbnailUrl ? (
                      <img
                        src={post.thumbnailUrl}
                        alt={post.caption || "Social post"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: config?.color || "#666" }}
                      >
                        {config?.label?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${config?.bgClass || "bg-gray-500 text-white"}`}>
                        {config?.label || post.platform}
                      </span>
                      {!post.isVisible && (
                        <Badge variant="secondary" className="text-xs">Hidden</Badge>
                      )}
                    </div>
                    {post.caption && (
                      <p className="text-sm truncate max-w-md">{post.caption}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">{post.postUrl}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleMutation.mutate({ id: post.id })}
                      title={post.isVisible ? "Hide" : "Show"}
                    >
                      {post.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(post)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent"
                      title="Open original post"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setEditingId(null);
          setForm(defaultForm);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Social Post</DialogTitle>
          </DialogHeader>
          <PostFormFields form={form} setForm={setForm} />
          <div className="flex gap-2">
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="flex-1">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
