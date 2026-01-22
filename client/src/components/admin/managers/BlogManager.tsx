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
import { Plus, Edit, Trash2, Eye, EyeOff, FileText } from "lucide-react";

const categoryLabels: Record<string, string> = {
  training_tips: "Training Tips",
  athlete_spotlight: "Athlete Spotlight",
  news: "News",
  events: "Events",
  other: "Other",
};

export function BlogManager() {
  const { data: posts, isLoading, refetch } = trpc.blogAdmin.list.useQuery();
  const createPost = trpc.blogAdmin.create.useMutation();
  const updatePost = trpc.blogAdmin.update.useMutation();
  const publishPost = trpc.blogAdmin.publish.useMutation();
  const deletePost = trpc.blogAdmin.delete.useMutation();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    category: "training_tips" as "training_tips" | "athlete_spotlight" | "news" | "events" | "other",
    tags: "",
  });

  const handleCreate = async () => {
    try {
      await createPost.mutateAsync({
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || undefined,
        content: formData.content,
        featuredImage: formData.featuredImage || undefined,
        category: formData.category,
        tags: formData.tags || undefined,
      });
      toast.success("Blog post created successfully");
      setIsCreateOpen(false);
      setFormData({ title: "", slug: "", excerpt: "", content: "", featuredImage: "", category: "training_tips", tags: "" });
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create blog post");
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      featuredImage: post.featuredImage || "",
      category: post.category || "training_tips",
      tags: post.tags || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingPost) return;
    try {
      await updatePost.mutateAsync({
        id: editingPost.id,
        title: formData.title || undefined,
        slug: formData.slug || undefined,
        excerpt: formData.excerpt || undefined,
        content: formData.content || undefined,
        featuredImage: formData.featuredImage || undefined,
        category: formData.category || undefined,
        tags: formData.tags || undefined,
      });
      toast.success("Blog post updated successfully");
      setEditingPost(null);
      setFormData({ title: "", slug: "", excerpt: "", content: "", featuredImage: "", category: "training_tips", tags: "" });
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update blog post");
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await publishPost.mutateAsync({ id });
      toast.success("Blog post published");
      refetch();
    } catch (error: any) {
      toast.error("Failed to publish blog post");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      await deletePost.mutateAsync({ id });
      toast.success("Blog post deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error("Failed to delete blog post");
    }
  };

  if (isLoading) return <div>Loading blog posts...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Blog Management</CardTitle>
              <CardDescription>Create and manage blog posts and news articles</CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Blog Post</DialogTitle>
                  <DialogDescription>Draft a new blog post or news article</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Blog post title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="url-friendly-slug"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(v: any) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="training_tips">Training Tips</SelectItem>
                        <SelectItem value="athlete_spotlight">Athlete Spotlight</SelectItem>
                        <SelectItem value="news">News</SelectItem>
                        <SelectItem value="events">Events</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Short excerpt for preview"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Blog post content (HTML supported)"
                      rows={10}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="featuredImage">Featured Image URL</Label>
                    <Input
                      id="featuredImage"
                      value={formData.featuredImage}
                      onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="basketball, training, saq"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!formData.title || !formData.slug || !formData.content}>
                    Create Draft
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
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!posts || posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No blog posts yet. Create your first one!
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post: any) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoryLabels[post.category] || post.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.isPublished ? "default" : "secondary"}>
                        {post.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!post.isPublished && (
                          <Button variant="ghost" size="sm" onClick={() => handlePublish(post.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
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
      {editingPost && (
        <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Blog Post</DialogTitle>
              <DialogDescription>Update blog post information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Blog post title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="url-friendly-slug"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(v: any) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training_tips">Training Tips</SelectItem>
                    <SelectItem value="athlete_spotlight">Athlete Spotlight</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-excerpt">Excerpt</Label>
                <Textarea
                  id="edit-excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Short excerpt for preview"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Blog post content (HTML supported)"
                  rows={10}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-featuredImage">Featured Image URL</Label>
                <Input
                  id="edit-featuredImage"
                  value={formData.featuredImage}
                  onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="basketball, training, saq"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPost(null)}>Cancel</Button>
              <Button onClick={handleUpdate}>Update Post</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
