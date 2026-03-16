import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Bell, BellRing, Clock, Zap, Package, BookOpen, Film, CalendarDays, Send, Pencil, Eye, MousePointerClick, BarChart3, Copy, Loader2 } from "lucide-react";

type DropType = "product" | "program" | "content" | "event";

interface DropForm {
  title: string;
  description: string;
  dropType: DropType;
  imageUrl: string;
  scheduledAt: string;
}

const defaultForm: DropForm = {
  title: "",
  description: "",
  dropType: "product",
  imageUrl: "",
  scheduledAt: "",
};

const DROP_TYPE_CONFIG: Record<DropType, { label: string; icon: typeof Package; colorClass: string }> = {
  product: { label: "Product", icon: Package, colorClass: "bg-red-100 text-red-700 border-red-200" },
  program: { label: "Program", icon: BookOpen, colorClass: "bg-blue-100 text-blue-700 border-blue-200" },
  content: { label: "Content", icon: Film, colorClass: "bg-green-100 text-green-700 border-green-200" },
  event: { label: "Event", icon: CalendarDays, colorClass: "bg-orange-100 text-orange-700 border-orange-200" },
};

function formatCountdown(scheduledAt: Date): string {
  const now = new Date();
  const diff = scheduledAt.getTime() - now.getTime();
  if (diff <= 0) return "LIVE NOW";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function CountdownBadge({ scheduledAt }: { scheduledAt: Date }) {
  const [text, setText] = useState(() => formatCountdown(scheduledAt));

  useEffect(() => {
    setText(formatCountdown(scheduledAt));
    const interval = setInterval(() => {
      setText(formatCountdown(scheduledAt));
    }, 60000);
    return () => clearInterval(interval);
  }, [scheduledAt]);

  const isLive = new Date() >= scheduledAt;

  return (
    <Badge
      variant="outline"
      className={isLive
        ? "bg-green-100 text-green-700 border-green-300 animate-pulse"
        : "bg-amber-50 text-amber-700 border-amber-200"
      }
    >
      {isLive ? <Zap className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
      {text}
    </Badge>
  );
}

function DropFormFields({
  form,
  setForm,
}: {
  form: DropForm;
  setForm: (f: DropForm) => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input
          placeholder="e.g., New Academy Hoodie Drop"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Details about this drop..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Type *</Label>
        <Select
          value={form.dropType}
          onValueChange={(value: DropType) => setForm({ ...form, dropType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DROP_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Drop Date & Time *</Label>
        <Input
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Cover Image URL</Label>
        <Input
          placeholder="https://... (optional)"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
        />
      </div>
    </div>
  );
}

export function MerchDropsManager() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DropForm>(defaultForm);
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "sent">("all");

  const utils = trpc.useUtils();
  const { data: drops, isLoading } = trpc.merchDrops.admin.list.useQuery();

  const createMutation = trpc.merchDrops.admin.create.useMutation({
    onSuccess: () => {
      utils.merchDrops.admin.list.invalidate();
      utils.merchDrops.upcoming.invalidate();
      setIsAddOpen(false);
      setForm(defaultForm);
      toast.success("Drop created successfully");
    },
    onError: (error) => {
      toast.error("Error creating drop", { description: error.message });
    },
  });

  const updateMutation = trpc.merchDrops.admin.update.useMutation({
    onSuccess: () => {
      utils.merchDrops.admin.list.invalidate();
      utils.merchDrops.upcoming.invalidate();
      setIsEditOpen(false);
      setEditingId(null);
      setForm(defaultForm);
      toast.success("Drop updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating drop", { description: error.message });
    },
  });

  const sendNowMutation = trpc.merchDrops.admin.sendNow.useMutation({
    onSuccess: () => {
      utils.merchDrops.admin.list.invalidate();
      utils.merchDrops.upcoming.invalidate();
      toast.success("Drop sent!");
    },
    onError: (error) => {
      toast.error("Error sending drop", { description: error.message });
    },
  });

  const deleteMutation = trpc.merchDrops.admin.delete.useMutation({
    onSuccess: () => {
      utils.merchDrops.admin.list.invalidate();
      utils.merchDrops.upcoming.invalidate();
      toast.success("Drop deleted");
    },
    onError: (error) => {
      toast.error("Error deleting drop", { description: error.message });
    },
  });

  const handleSubmit = () => {
    if (!form.title || !form.scheduledAt) {
      toast.error("Please fill in the title and schedule date");
      return;
    }
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      dropType: form.dropType,
      imageUrl: form.imageUrl || undefined,
      scheduledAt: form.scheduledAt,
    });
  };

  const handleUpdate = () => {
    if (!editingId || !form.title) {
      toast.error("Please fill in the title");
      return;
    }
    updateMutation.mutate({
      id: editingId,
      title: form.title,
      description: form.description || undefined,
      dropType: form.dropType,
      imageUrl: form.imageUrl || undefined,
      scheduledAt: form.scheduledAt || undefined,
    });
  };

  const openEditDialog = (drop: any) => {
    setEditingId(drop.id);
    setForm({
      title: drop.title || "",
      description: drop.description || "",
      dropType: drop.dropType || "product",
      imageUrl: drop.imageUrl || "",
      scheduledAt: drop.scheduledAt ? new Date(drop.scheduledAt).toISOString().slice(0, 16) : "",
    });
    setIsEditOpen(true);
  };

  const handleSendNow = (id: number, title: string) => {
    if (confirm(`Send "${title}" notification now?`)) {
      sendNowMutation.mutate({ id });
    }
  };

  const handleDuplicate = (drop: any) => {
    setForm({
      title: `${drop.title} (Copy)`,
      description: drop.description || "",
      dropType: drop.dropType || "product",
      imageUrl: drop.imageUrl || "",
      scheduledAt: "",
    });
    setIsAddOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this drop?")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredDrops = (drops ?? []).filter((drop: any) => {
    if (filterStatus === "upcoming") return !drop.isSent;
    if (filterStatus === "sent") return drop.isSent;
    return true;
  });

  const upcomingCount = (drops ?? []).filter((d: any) => !d.isSent).length;
  const sentCount = (drops ?? []).filter((d: any) => d.isSent).length;
  const totalViews = (drops ?? []).reduce((sum: number, d: any) => sum + (d.viewCount || 0), 0);
  const totalClicks = (drops ?? []).reduce((sum: number, d: any) => sum + (d.clickCount || 0), 0);

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
            <BellRing className="h-5 w-5" />
            Merch Drops
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule product launches, events, and content releases
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setForm(defaultForm);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Drop
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule New Drop</DialogTitle>
            </DialogHeader>
            <DropFormFields form={form} setForm={setForm} />
            <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? "Creating..." : "Schedule Drop"}
            </Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Engagement Stats */}
        {drops && drops.length > 0 && (totalViews > 0 || totalClicks > 0) && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold tabular-nums">{drops.length}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <BarChart3 className="h-3 w-3" /> Total Drops
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold tabular-nums">{totalViews}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Eye className="h-3 w-3" /> Views
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold tabular-nums">{totalClicks}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <MousePointerClick className="h-3 w-3" /> Clicks
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        {drops && drops.length > 0 && (
          <div className="flex gap-2 mb-4">
            <Badge
              variant={filterStatus === "all" ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => setFilterStatus("all")}
            >
              All ({drops.length})
            </Badge>
            <Badge
              variant={filterStatus === "upcoming" ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => setFilterStatus("upcoming")}
            >
              <Clock className="h-3 w-3 mr-1" />
              Upcoming ({upcomingCount})
            </Badge>
            <Badge
              variant={filterStatus === "sent" ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => setFilterStatus("sent")}
            >
              <Bell className="h-3 w-3 mr-1" />
              Sent ({sentCount})
            </Badge>
          </div>
        )}

        {!drops || drops.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BellRing className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No drops scheduled</p>
            <p className="text-sm mt-1">Create your first drop to engage members with upcoming releases</p>
          </div>
        ) : filteredDrops.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No drops match this filter</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredDrops.map((drop: any) => {
              const typeConfig = DROP_TYPE_CONFIG[drop.dropType as DropType];
              const TypeIcon = typeConfig?.icon || Package;
              const scheduledDate = new Date(drop.scheduledAt);
              const hasEngagement = (drop.viewCount || 0) > 0 || (drop.clickCount || 0) > 0;

              return (
                <div
                  key={drop.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-colors hover:bg-muted/30 ${
                    drop.isSent ? "opacity-70" : ""
                  }`}
                >
                  {/* Image/Icon */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {drop.imageUrl ? (
                      <img
                        src={drop.imageUrl}
                        alt={drop.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-50">
                        <TypeIcon className="h-6 w-6 text-amber-600" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-medium truncate">{drop.title}</h4>
                      <Badge variant="outline" className={`text-xs ${typeConfig?.colorClass || ""}`}>
                        {typeConfig?.label || drop.dropType}
                      </Badge>
                      {drop.isSent ? (
                        <Badge variant="secondary" className="text-xs">
                          <Bell className="h-3 w-3 mr-1" />
                          Sent {drop.sentAt ? new Date(drop.sentAt).toLocaleDateString() : ""}
                        </Badge>
                      ) : (
                        <CountdownBadge scheduledAt={scheduledDate} />
                      )}
                    </div>
                    {drop.description && (
                      <p className="text-sm text-muted-foreground truncate">{drop.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        <CalendarDays className="inline h-3 w-3 mr-1" />
                        {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {hasEngagement && (
                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="flex items-center gap-0.5">
                            <Eye className="h-3 w-3" /> {drop.viewCount || 0}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MousePointerClick className="h-3 w-3" /> {drop.clickCount || 0}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!drop.isSent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendNow(drop.id, drop.title)}
                        disabled={sendNowMutation.isPending}
                        title="Send now"
                        className="gap-1"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Send</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicate(drop)}
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(drop)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(drop.id)}
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
            <DialogTitle>Edit Drop</DialogTitle>
          </DialogHeader>
          <DropFormFields form={form} setForm={setForm} />
          <div className="flex gap-2">
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="flex-1">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
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
