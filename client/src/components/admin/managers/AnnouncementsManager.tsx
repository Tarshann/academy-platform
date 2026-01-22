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
import { Plus, Edit, Trash2, Eye, MessageSquare } from "lucide-react";

export function AnnouncementsManager() {
  const { data: announcements, isLoading, refetch } = trpc.admin.announcements.list.useQuery();
  const createAnnouncement = trpc.admin.announcements.create.useMutation();
  const publishAnnouncement = trpc.admin.announcements.publish.useMutation();
  const deleteAnnouncement = trpc.admin.announcements.delete.useMutation();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const handleCreate = async () => {
    try {
      await createAnnouncement.mutateAsync({
        title: formData.title,
        content: formData.content,
      });
      toast.success("Announcement created successfully");
      setIsCreateOpen(false);
      setFormData({ title: "", content: "" });
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create announcement");
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await publishAnnouncement.mutateAsync({ id });
      toast.success("Announcement published");
      refetch();
    } catch (error: any) {
      toast.error("Failed to publish announcement");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteAnnouncement.mutateAsync({ id });
      toast.success("Announcement deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error("Failed to delete announcement");
    }
  };

  if (isLoading) return <div>Loading announcements...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Announcement Management</CardTitle>
            <CardDescription>Create and publish announcements for members</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>Draft an announcement for members</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Announcement title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Announcement content"
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!formData.title || !formData.content}>
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
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No announcements yet. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              announcements?.map((announcement: any) => (
                <TableRow key={announcement.id}>
                  <TableCell className="font-medium">{announcement.title}</TableCell>
                  <TableCell>
                    <Badge variant={announcement.isPublished ? "default" : "secondary"}>
                      {announcement.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(announcement.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!announcement.isPublished && (
                        <Button variant="ghost" size="sm" onClick={() => handlePublish(announcement.id)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Publish
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(announcement.id)}>
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
