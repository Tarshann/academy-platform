import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Bell, BellRing, Clock, Zap, Package, BookOpen, Film, CalendarDays, Send } from "lucide-react";

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

export function MerchDropsManager() {
  const toast = ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    if (variant === "destructive") {
      alert(`Error: ${title}${description ? ` - ${description}` : ""}`);
    } else {
      console.log(title);
    }
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
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
      toast({ title: "Drop created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating drop", description: error.message, variant: "destructive" });
    },
  });

  const sendNowMutation = trpc.merchDrops.admin.sendNow.useMutation({
    onSuccess: () => {
      utils.merchDrops.admin.list.invalidate();
      utils.merchDrops.upcoming.invalidate();
      toast({ title: "Drop sent!" });
    },
    onError: (error) => {
      toast({ title: "Error sending drop", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = trpc.merchDrops.admin.delete.useMutation({
    onSuccess: () => {
      utils.merchDrops.admin.list.invalidate();
      utils.merchDrops.upcoming.invalidate();
      toast({ title: "Drop deleted" });
    },
    onError: (error) => {
      toast({ title: "Error deleting drop", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!form.title || !form.scheduledAt) {
      toast({ title: "Please fill in the title and schedule date", variant: "destructive" });
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

  const handleSendNow = (id: number, title: string) => {
    if (confirm(`Send "${title}" notification now?`)) {
      sendNowMutation.mutate({ id });
    }
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
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., New Academy Hoodie Drop"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Details about this drop..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dropType">Type *</Label>
                <Select
                  value={form.dropType}
                  onValueChange={(value: DropType) => setForm({ ...form, dropType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DROP_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          {config.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Drop Date & Time *</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Cover Image URL</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://... (optional)"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Creating..." : "Schedule Drop"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
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
              const isPast = scheduledDate <= new Date();

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
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <CalendarDays className="inline h-3 w-3 mr-1" />
                      {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
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
    </Card>
  );
}
