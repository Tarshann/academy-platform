import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Activity, TrendingUp, Search, User, Filter } from "lucide-react";

type MetricCategory = "speed" | "power" | "agility" | "endurance" | "strength" | "flexibility";

interface MetricForm {
  athleteId: string;
  metricName: string;
  category: MetricCategory;
  value: string;
  unit: string;
  notes: string;
  sessionDate: string;
}

const defaultForm: MetricForm = {
  athleteId: "",
  metricName: "",
  category: "speed",
  value: "",
  unit: "",
  notes: "",
  sessionDate: new Date().toISOString().slice(0, 16),
};

const METRIC_PRESETS: Record<string, { category: MetricCategory; unit: string }> = {
  "Vertical Jump": { category: "power", unit: "inches" },
  "40-Yard Dash": { category: "speed", unit: "seconds" },
  "Pro Agility (5-10-5)": { category: "agility", unit: "seconds" },
  "Broad Jump": { category: "power", unit: "inches" },
  "10-Yard Split": { category: "speed", unit: "seconds" },
  "L-Drill": { category: "agility", unit: "seconds" },
  "Bench Press": { category: "strength", unit: "reps" },
  "Squat Max": { category: "strength", unit: "lbs" },
  "Mile Run": { category: "endurance", unit: "minutes" },
  "Beep Test": { category: "endurance", unit: "level" },
  "Sit & Reach": { category: "flexibility", unit: "inches" },
  "Sprint Speed": { category: "speed", unit: "mph" },
};

const CATEGORY_CONFIG: Record<MetricCategory, { label: string; colorClass: string }> = {
  speed: { label: "Speed", colorClass: "bg-blue-100 text-blue-700" },
  power: { label: "Power", colorClass: "bg-red-100 text-red-700" },
  agility: { label: "Agility", colorClass: "bg-green-100 text-green-700" },
  endurance: { label: "Endurance", colorClass: "bg-purple-100 text-purple-700" },
  strength: { label: "Strength", colorClass: "bg-orange-100 text-orange-700" },
  flexibility: { label: "Flexibility", colorClass: "bg-teal-100 text-teal-700" },
};

export function MetricsManager() {
  const toast = ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    if (variant === "destructive") {
      alert(`Error: ${title}${description ? ` - ${description}` : ""}`);
    } else {
      console.log(title);
    }
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<MetricForm>(defaultForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<MetricCategory | "all">("all");
  const [filterAthleteId, setFilterAthleteId] = useState<string>("all");

  const utils = trpc.useUtils();
  const { data: metrics, isLoading } = trpc.metrics.admin.list.useQuery();
  const { data: members } = trpc.admin.members.list.useQuery();

  const recordMutation = trpc.metrics.admin.record.useMutation({
    onSuccess: () => {
      utils.metrics.admin.list.invalidate();
      setIsAddOpen(false);
      setForm(defaultForm);
      toast({ title: "Metric recorded successfully" });
    },
    onError: (error) => {
      toast({ title: "Error recording metric", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = trpc.metrics.admin.delete.useMutation({
    onSuccess: () => {
      utils.metrics.admin.list.invalidate();
      toast({ title: "Metric deleted" });
    },
    onError: (error) => {
      toast({ title: "Error deleting metric", description: error.message, variant: "destructive" });
    },
  });

  const handlePresetSelect = (presetName: string) => {
    const preset = METRIC_PRESETS[presetName];
    if (preset) {
      setForm({
        ...form,
        metricName: presetName,
        category: preset.category,
        unit: preset.unit,
      });
    }
  };

  const handleSubmit = () => {
    if (!form.athleteId || !form.metricName || !form.value || !form.unit || !form.sessionDate) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const numValue = parseFloat(form.value);
    if (isNaN(numValue)) {
      toast({ title: "Value must be a number", variant: "destructive" });
      return;
    }
    recordMutation.mutate({
      athleteId: parseInt(form.athleteId),
      metricName: form.metricName,
      category: form.category,
      value: numValue,
      unit: form.unit,
      notes: form.notes || undefined,
      sessionDate: form.sessionDate,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this metric entry?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Build athlete name lookup from members
  const athleteNameMap = new Map<number, string>();
  if (members) {
    for (const m of members as any[]) {
      athleteNameMap.set(m.id, m.name || m.email || `User #${m.id}`);
    }
  }

  const filteredMetrics = (metrics ?? []).filter((metric: any) => {
    const matchesCategory = filterCategory === "all" || metric.category === filterCategory;
    const matchesAthlete = filterAthleteId === "all" || String(metric.athleteId) === filterAthleteId;
    const matchesSearch = !searchQuery ||
      metric.metricName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athleteNameMap.get(metric.athleteId)?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesAthlete && matchesSearch;
  });

  // Get unique athlete IDs from metrics
  const uniqueAthleteIds = [...new Set((metrics ?? []).map((m: any) => m.athleteId))];

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
            <Activity className="h-5 w-5" />
            Athlete Metrics
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Record and track athlete performance measurements
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setForm(defaultForm);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Metric
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Athlete Metric</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Athlete Selection */}
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
                    {(members as any[] ?? []).map((member: any) => (
                      <SelectItem key={member.id} value={String(member.id)}>
                        {member.name || member.email || `User #${member.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-2">
                <Label>Quick Presets</Label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(METRIC_PRESETS).map((name) => (
                    <Button
                      key={name}
                      variant={form.metricName === name ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handlePresetSelect(name)}
                    >
                      {name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom metric name */}
              <div className="space-y-2">
                <Label htmlFor="metricName">Metric Name *</Label>
                <Input
                  id="metricName"
                  placeholder="e.g., Vertical Jump"
                  value={form.metricName}
                  onChange={(e) => setForm({ ...form, metricName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Value *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 32.5"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    placeholder="e.g., inches"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(value: MetricCategory) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionDate">Session Date *</Label>
                <Input
                  id="sessionDate"
                  type="datetime-local"
                  value={form.sessionDate}
                  onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Optional notes about this measurement..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <Button onClick={handleSubmit} disabled={recordMutation.isPending} className="w-full">
                {recordMutation.isPending ? "Recording..." : "Record Metric"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Filter Bar */}
        {metrics && metrics.length > 0 && (
          <div className="space-y-3 mb-4">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant={filterCategory === "all" ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => setFilterCategory("all")}
              >
                All Categories
              </Badge>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className={`cursor-pointer select-none ${filterCategory === key ? config.colorClass : ""}`}
                  onClick={() => setFilterCategory(filterCategory === key ? "all" : key as MetricCategory)}
                >
                  {config.label}
                </Badge>
              ))}
            </div>

            {/* Athlete Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by metric name or athlete..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {uniqueAthleteIds.length > 1 && (
                <Select
                  value={filterAthleteId}
                  onValueChange={setFilterAthleteId}
                >
                  <SelectTrigger className="w-48">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Athletes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Athletes</SelectItem>
                    {uniqueAthleteIds.map((id) => (
                      <SelectItem key={id as number} value={String(id)}>
                        {athleteNameMap.get(id as number) || `User #${id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        {!metrics || metrics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No metrics recorded yet</p>
            <p className="text-sm mt-1">Start recording athlete performance data to track progress</p>
          </div>
        ) : filteredMetrics.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No metrics match your filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {filteredMetrics.length} of {metrics.length} entries
            </p>
            <div className="grid gap-2">
              {filteredMetrics.map((metric: any) => {
                const catConfig = CATEGORY_CONFIG[metric.category as MetricCategory];
                const athleteName = athleteNameMap.get(metric.athleteId) || `Athlete #${metric.athleteId}`;

                return (
                  <div
                    key={metric.id}
                    className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    {/* Value Display */}
                    <div className="w-20 text-center flex-shrink-0">
                      <div className="text-xl font-bold tabular-nums">{metric.value}</div>
                      <div className="text-xs text-muted-foreground">{metric.unit}</div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-medium">{metric.metricName}</span>
                        <Badge variant="outline" className={`text-xs ${catConfig?.colorClass || ""}`}>
                          {catConfig?.label || metric.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{athleteName}</span>
                        <span>•</span>
                        <span>{new Date(metric.sessionDate).toLocaleDateString()}</span>
                      </div>
                      {metric.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{metric.notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(metric.id)}
                      className="text-destructive hover:text-destructive flex-shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
