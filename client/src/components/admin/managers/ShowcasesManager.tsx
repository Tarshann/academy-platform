import { useState } from "react";
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
import { Plus, Trash2, Pencil, Star, Eye, EyeOff, Trophy, CalendarDays, User } from "lucide-react";

type Sport = "basketball" | "football" | "flag_football" | "soccer" | "multi_sport" | "saq";

interface ShowcaseForm {
  athleteId: string;
  title: string;
  description: string;
  imageUrl: string;
  sport: Sport | "";
  achievements: string;
  stats: string;
  featuredFrom: string;
  featuredUntil: string;
}

const defaultForm: ShowcaseForm = {
  athleteId: "",
  title: "",
  description: "",
  imageUrl: "",
  sport: "",
  achievements: "",
  stats: "",
  featuredFrom: new Date().toISOString().slice(0, 16),
  featuredUntil: "",
};

const SPORT_CONFIG: Record<Sport, { label: string; emoji: string }> = {
  basketball: { label: "Basketball", emoji: "🏀" },
  football: { label: "Football", emoji: "🏈" },
  flag_football: { label: "Flag Football", emoji: "🚩" },
  soccer: { label: "Soccer", emoji: "⚽" },
  multi_sport: { label: "Multi-Sport", emoji: "🏅" },
  saq: { label: "SAQ", emoji: "⚡" },
};

function ShowcaseFormFields({
  form,
  setForm,
  members,
}: {
  form: ShowcaseForm;
  setForm: (f: ShowcaseForm) => void;
  members: any[] | undefined;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Athlete *</Label>
        <Select
          value={form.athleteId}
          onValueChange={(value) => setForm({ ...form, athleteId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select athlete" />
          </SelectTrigger>
          <SelectContent>
            {(members ?? []).map((member: any) => (
              <SelectItem key={member.id} value={String(member.id)}>
                {member.name || member.email || `User #${member.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input
          placeholder="e.g., Athlete of the Week"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea
          placeholder="Describe this athlete's achievements..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Sport</Label>
        <Select
          value={form.sport}
          onValueChange={(value: Sport) => setForm({ ...form, sport: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sport (optional)" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SPORT_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.emoji} {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input
          placeholder="https://... (optional athlete photo)"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Achievements</Label>
        <Textarea
          placeholder="One per line, e.g.:&#10;MVP of the week&#10;10+ points scored&#10;Perfect attendance"
          value={form.achievements}
          onChange={(e) => setForm({ ...form, achievements: e.target.value })}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">Enter each achievement on a new line</p>
      </div>
      <div className="space-y-2">
        <Label>Key Stats (JSON)</Label>
        <Textarea
          placeholder='e.g., {"Points": "25", "Assists": "8", "Rebounds": "12"}'
          value={form.stats}
          onChange={(e) => setForm({ ...form, stats: e.target.value })}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">JSON object of stat name → value pairs</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Featured From *</Label>
          <Input
            type="datetime-local"
            value={form.featuredFrom}
            onChange={(e) => setForm({ ...form, featuredFrom: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Featured Until</Label>
          <Input
            type="datetime-local"
            value={form.featuredUntil}
            onChange={(e) => setForm({ ...form, featuredUntil: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export function ShowcasesManager() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ShowcaseForm>(defaultForm);

  const utils = trpc.useUtils();
  const { data: showcases, isLoading } = trpc.showcases.admin.list.useQuery();
  const { data: members } = trpc.admin.members.list.useQuery();

  const athleteNameMap = new Map<number, string>();
  if (members) {
    for (const m of members as any[]) {
      athleteNameMap.set(m.id, m.name || m.email || `User #${m.id}`);
    }
  }

  const createMutation = trpc.showcases.admin.create.useMutation({
    onSuccess: () => {
      utils.showcases.admin.list.invalidate();
      utils.showcases.active.invalidate();
      setIsAddOpen(false);
      setForm(defaultForm);
      toast.success("Showcase created successfully");
    },
    onError: (error) => {
      toast.error("Error creating showcase", { description: error.message });
    },
  });

  const updateMutation = trpc.showcases.admin.update.useMutation({
    onSuccess: () => {
      utils.showcases.admin.list.invalidate();
      utils.showcases.active.invalidate();
      setIsEditOpen(false);
      setEditingId(null);
      setForm(defaultForm);
      toast.success("Showcase updated");
    },
    onError: (error) => {
      toast.error("Error updating showcase", { description: error.message });
    },
  });

  const deleteMutation = trpc.showcases.admin.delete.useMutation({
    onSuccess: () => {
      utils.showcases.admin.list.invalidate();
      utils.showcases.active.invalidate();
      toast.success("Showcase deleted");
    },
    onError: (error) => {
      toast.error("Error deleting showcase", { description: error.message });
    },
  });

  const parseAchievements = (text: string): string => {
    const lines = text.split("\n").filter((l) => l.trim());
    return lines.length > 0 ? JSON.stringify(lines) : "";
  };

  const formatAchievements = (json: string | null): string => {
    if (!json) return "";
    try {
      const arr = JSON.parse(json);
      return Array.isArray(arr) ? arr.join("\n") : json;
    } catch {
      return json;
    }
  };

  const handleSubmit = () => {
    if (!form.athleteId || !form.title || !form.description || !form.featuredFrom) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      athleteId: parseInt(form.athleteId),
      title: form.title,
      description: form.description,
      imageUrl: form.imageUrl || undefined,
      sport: (form.sport || undefined) as any,
      achievements: parseAchievements(form.achievements) || undefined,
      stats: form.stats || undefined,
      featuredFrom: form.featuredFrom,
      featuredUntil: form.featuredUntil || undefined,
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
      imageUrl: form.imageUrl || undefined,
      sport: (form.sport || undefined) as any,
      achievements: parseAchievements(form.achievements) || undefined,
      stats: form.stats || undefined,
      featuredUntil: form.featuredUntil || undefined,
    });
  };

  const openEditDialog = (showcase: any) => {
    setEditingId(showcase.id);
    setForm({
      athleteId: String(showcase.athleteId),
      title: showcase.title || "",
      description: showcase.description || "",
      imageUrl: showcase.imageUrl || "",
      sport: showcase.sport || "",
      achievements: formatAchievements(showcase.achievements),
      stats: showcase.stats || "",
      featuredFrom: showcase.featuredFrom ? new Date(showcase.featuredFrom).toISOString().slice(0, 16) : "",
      featuredUntil: showcase.featuredUntil ? new Date(showcase.featuredUntil).toISOString().slice(0, 16) : "",
    });
    setIsEditOpen(true);
  };

  const toggleActive = (showcase: any) => {
    updateMutation.mutate({
      id: showcase.id,
      isActive: !showcase.isActive,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this showcase?")) {
      deleteMutation.mutate({ id });
    }
  };

  const activeCount = (showcases ?? []).filter((s: any) => s.isActive).length;

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
            <Trophy className="h-5 w-5" />
            Athlete Showcases
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Feature weekly athlete spotlights with achievements and stats
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setForm(defaultForm);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Showcase
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Athlete Showcase</DialogTitle>
            </DialogHeader>
            <ShowcaseFormFields form={form} setForm={setForm} members={members as any[]} />
            <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? "Creating..." : "Create Showcase"}
            </Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {showcases && showcases.length > 0 && (
          <div className="flex gap-2 mb-4">
            <Badge variant="outline">
              {showcases.length} total
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Star className="h-3 w-3 mr-1" />
              {activeCount} active
            </Badge>
          </div>
        )}

        {!showcases || showcases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No showcases yet</p>
            <p className="text-sm mt-1">Create a showcase to spotlight an athlete's achievements</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {(showcases as any[]).map((showcase: any) => {
              const athleteName = athleteNameMap.get(showcase.athleteId) || `Athlete #${showcase.athleteId}`;
              const sportConfig = showcase.sport ? SPORT_CONFIG[showcase.sport as Sport] : null;
              const featuredFrom = new Date(showcase.featuredFrom);
              const featuredUntil = showcase.featuredUntil ? new Date(showcase.featuredUntil) : null;
              const now = new Date();
              const isCurrentlyFeatured = showcase.isActive && featuredFrom <= now && (!featuredUntil || featuredUntil >= now);

              let achievements: string[] = [];
              try {
                if (showcase.achievements) {
                  const parsed = JSON.parse(showcase.achievements);
                  if (Array.isArray(parsed)) achievements = parsed;
                }
              } catch { /* ignore */ }

              return (
                <div
                  key={showcase.id}
                  className={`p-4 border rounded-lg transition-colors hover:bg-muted/30 ${
                    !showcase.isActive ? "opacity-60 bg-muted/50" : ""
                  } ${isCurrentlyFeatured ? "border-amber-300 bg-amber-50/30" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {showcase.imageUrl ? (
                        <img src={showcase.imageUrl} alt={showcase.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-50">
                          <Trophy className="h-6 w-6 text-amber-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium">{showcase.title}</h4>
                        {isCurrentlyFeatured && (
                          <Badge className="bg-amber-500 text-white text-xs">
                            <Star className="h-3 w-3 mr-1" /> Featured
                          </Badge>
                        )}
                        {!showcase.isActive && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                        {sportConfig && (
                          <Badge variant="outline" className="text-xs">
                            {sportConfig.emoji} {sportConfig.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <User className="h-3 w-3" />
                        <span>{athleteName}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{showcase.description}</p>
                      {achievements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {achievements.slice(0, 3).map((a, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {a}
                            </Badge>
                          ))}
                          {achievements.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{achievements.length - 3} more</Badge>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        <CalendarDays className="inline h-3 w-3 mr-1" />
                        {featuredFrom.toLocaleDateString()}
                        {featuredUntil ? ` — ${featuredUntil.toLocaleDateString()}` : " — ongoing"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(showcase)}
                        title={showcase.isActive ? "Deactivate" : "Activate"}
                      >
                        {showcase.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(showcase)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(showcase.id)}
                        className="text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Showcase</DialogTitle>
          </DialogHeader>
          <ShowcaseFormFields form={form} setForm={setForm} members={members as any[]} />
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
