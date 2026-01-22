import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, Users, MessageSquare, Settings, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("schedules");

  // Redirect non-admin users
  if (!loading && (!user || user.role !== 'admin')) {
    setLocation('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      
      <main id="main-content" className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage schedules, programs, announcements, and more</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="schedules" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Schedules</span>
              </TabsTrigger>
              <TabsTrigger value="programs" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Programs</span>
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Announcements</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Contacts</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedules">
              <SchedulesManager />
            </TabsContent>

            <TabsContent value="programs">
              <ProgramsManager />
            </TabsContent>

            <TabsContent value="announcements">
              <AnnouncementsManager />
            </TabsContent>

            <TabsContent value="contacts">
              <ContactsManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Schedules Manager Component
function SchedulesManager() {
  const { data: schedules, isLoading, refetch } = trpc.admin.schedules.list.useQuery();
  const { data: programs } = trpc.programs.list.useQuery();
  const createSchedule = trpc.admin.schedules.create.useMutation();
  const updateSchedule = trpc.admin.schedules.update.useMutation();
  const deleteSchedule = trpc.admin.schedules.delete.useMutation();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [formData, setFormData] = useState({
    programId: "",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    maxParticipants: "",
  });

  const handleCreate = async () => {
    try {
      await createSchedule.mutateAsync({
        programId: parseInt(formData.programId),
        title: formData.title,
        description: formData.description || undefined,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        location: formData.location,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
      });
      toast.success("Schedule created successfully");
      setIsCreateOpen(false);
      setFormData({ programId: "", title: "", description: "", startTime: "", endTime: "", location: "", maxParticipants: "" });
      refetch();
    } catch (error) {
      toast.error("Failed to create schedule");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await deleteSchedule.mutateAsync({ id });
      toast.success("Schedule deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete schedule");
    }
  };

  if (isLoading) return <div>Loading schedules...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Schedule Management</CardTitle>
            <CardDescription>Create and manage training sessions and events</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Schedule</DialogTitle>
                <DialogDescription>Add a new training session or event</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="program">Program</Label>
                  <Select value={formData.programId} onValueChange={(value) => setFormData({ ...formData, programId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs?.map((program) => (
                        <SelectItem key={program.id} value={program.id.toString()}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Session title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Session description (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Training location"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxParticipants">Max Participants (optional)</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!formData.programId || !formData.title || !formData.startTime || !formData.endTime || !formData.location}>
                  Create Schedule
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
              <TableHead>Program</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No schedules yet. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              schedules?.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">{schedule.title}</TableCell>
                  <TableCell>{programs?.find(p => p.id === schedule.programId)?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(schedule.startTime).toLocaleString()}</TableCell>
                  <TableCell>{schedule.location}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule.id)}>
                      <Trash2 className="h-4 w-4" />
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

// Programs Manager Component
function ProgramsManager() {
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
        ageMin: parseInt(formData.ageMin),
        ageMax: parseInt(formData.ageMax),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
      });
      toast.success("Program created successfully");
      setIsCreateOpen(false);
      setFormData({ name: "", slug: "", description: "", price: "", category: "group", ageMin: "8", ageMax: "18", maxParticipants: "" });
      refetch();
    } catch (error) {
      toast.error("Failed to create program");
    }
  };

  const handleToggleVisibility = async (id: number, currentStatus: number) => {
    try {
      await updateProgram.mutateAsync({ id, isActive: !currentStatus });
      toast.success("Program visibility updated");
      refetch();
    } catch (error) {
      toast.error("Failed to update program");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this program?")) return;
    try {
      await deleteProgram.mutateAsync({ id });
      toast.success("Program deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete program");
    }
  };

  if (isLoading) return <div>Loading programs...</div>;

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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Program</DialogTitle>
                <DialogDescription>Add a new training program</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Program Name</Label>
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
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g., group-training-session"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Program description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g., $50/session"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
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
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No programs yet. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              programs?.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell className="capitalize">{program.category}</TableCell>
                  <TableCell>{program.price}</TableCell>
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

// Announcements Manager Component
function AnnouncementsManager() {
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
    } catch (error) {
      toast.error("Failed to create announcement");
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await publishAnnouncement.mutateAsync({ id });
      toast.success("Announcement published");
      refetch();
    } catch (error) {
      toast.error("Failed to publish announcement");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteAnnouncement.mutateAsync({ id });
      toast.success("Announcement deleted successfully");
      refetch();
    } catch (error) {
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
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Announcement title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
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
              announcements?.map((announcement) => (
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
                      {announcement.isPublished === 0 && (
                        <Button variant="ghost" size="sm" onClick={() => handlePublish(announcement.id)}>
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

// Contacts Manager Component
function ContactsManager() {
  const { data: contacts, isLoading, refetch } = trpc.contact.list.useQuery();
  const markAsRead = trpc.admin.contacts.markRead.useMutation();
  const markAsResponded = trpc.admin.contacts.markResponded.useMutation();

  const handleMarkRead = async (id: number) => {
    try {
      await markAsRead.mutateAsync({ id });
      toast.success("Marked as read");
      refetch();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleMarkResponded = async (id: number) => {
    try {
      await markAsResponded.mutateAsync({ id });
      toast.success("Marked as responded");
      refetch();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (isLoading) return <div>Loading contacts...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Submissions</CardTitle>
        <CardDescription>View and manage contact form submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No contact submissions yet
                </TableCell>
              </TableRow>
            ) : (
              contacts?.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell className="capitalize">{contact.type}</TableCell>
                  <TableCell>
                    <Badge variant={
                      contact.status === 'new' ? 'default' : 
                      contact.status === 'read' ? 'secondary' : 
                      'outline'
                    }>
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(contact.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {contact.status === 'new' && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkRead(contact.id)}>
                          Mark Read
                        </Button>
                      )}
                      {contact.status === 'read' && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkResponded(contact.id)}>
                          Mark Responded
                        </Button>
                      )}
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
