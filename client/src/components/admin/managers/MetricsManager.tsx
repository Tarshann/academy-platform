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
import { Plus, Trash2, Activity, TrendingUp, TrendingDown, Search, User, Filter, ChevronRight, X } from "lucide-react";

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

const CATEGORY_CONFIG: Record<MetricCategory, { label: string; colorClass: string; barColor: string }> = {
  speed: { label: "Speed", colorClass: "bg-blue-100 text-blue-700", barColor: "#3b82f6" },
  power: { label: "Power", colorClass: "bg-red-100 text-red-700", barColor: "#ef4444" },
  agility: { label: "Agility", colorClass: "bg-green-100 text-green-700", barColor: "#22c55e" },
  endurance: { label: "Endurance", colorClass: "bg-purple-100 text-purple-700", barColor: "#a855f7" },
  strength: { label: "Strength", colorClass: "bg-orange-100 text-orange-700", barColor: "#f97316" },
  flexibility: { label: "Flexibility", colorClass: "bg-teal-100 text-teal-700", barColor: "#14b8a6" },
};

// For metrics where lower = better (times)
const LOWER_IS_BETTER = new Set(["40-Yard Dash", "Pro Agility (5-10-5)", "10-Yard Split", "L-Drill", "Mile Run"]);

function TrendChart({ data, metricName, barColor }: { data: any[]; metricName: string; barColor: string }) {
  if (data.length < 2) return null;

  const values = data.map((d) => parseFloat(d.value));
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  const first = values[0];
  const last = values[values.length - 1];
  const lowerBetter = LOWER_IS_BETTER.has(metricName);
  const improved = lowerBetter ? last < first : last > first;
  const changePercent = first !== 0 ? Math.abs(((last - first) / first) * 100).toFixed(1) : "0";

  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          Trend ({data.length} recordings)
        </span>
        <span className={`text-xs font-medium flex items-center gap-1 ${improved ? "text-green-600" : "text-red-500"}`}>
          {improved ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {changePercent}% {improved ? "improved" : "declined"}
        </span>
      </div>
      <div className="flex items-end gap-1 h-16">
        {values.map((val, i) => {
          const height = ((val - minVal) / range) * 100;
          const normalizedHeight = Math.max(height, 8);
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all hover:opacity-80 relative group"
              style={{
                height: `${normalizedHeight}%`,
                backgroundColor: barColor,
                opacity: 0.4 + (i / values.length) * 0.6,
              }}
              title={`${val} (${new Date(data[i].sessionDate).toLocaleDateString()})`}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                {val}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">
          {new Date(data[0].sessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(data[data.length - 1].sessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}

function TrendPanel({ athleteId, metricName, category, onClose }: {
  athleteId: number;
  metricName: string;
  category: MetricCategory;
  onClose: () => void;
}) {
  const { data: trendData, isLoading } = trpc.metrics.getTrend.useQuery(
    { athleteId, metricName },
    { enabled: !!athleteId && !!metricName }
  );

  const catConfig = CATEGORY_CONFIG[category];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {metricName} Trend
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !trendData || trendData.length < 2 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Not enough data points for a trend. Need at least 2 recordings.</p>
          </div>
        ) : (
          <div>
            <TrendChart
              data={trendData}
              metricName={metricName}
              barColor={catConfig?.barColor || "#888"}
            />
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {[...trendData].reverse().map((entry: any, i: number) => (
                <div key={entry.id || i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span className="text-muted-foreground">
                    {new Date(entry.sessionDate).toLocaleDateString()}
                  </span>
                  <span className="font-medium tabular-nums">
                    {entry.value} {entry.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MetricsManager() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<MetricForm>(defaultForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<MetricCategory | "all">("all");
  const [filterAthleteId, setFilterAthleteId] = useState<string>("all");
  const [trendView, setTrendView] = useState<{ athleteId: number; metricName: string; category: MetricCategory } | null>(null);

  const utils = trpc.useUtils();
  const { data: metrics, isLoading } = trpc.metrics.admin.list.useQuery();
  const { data: members } = trpc.admin.members.list.useQuery();

  const recordMutation = trpc.metrics.admin.record.useMutation({
    onSuccess: () => {
      utils.metrics.admin.list.invalidate();
      setIsAddOpen(false);
      setForm(defaultForm);
      toast.success("Metric recorded successfully");
    },
    onError: (error) => {
      toast.error("Error recording metric", { description: error.message });
    },
  });

  const deleteMutation = trpc.metrics.admin.delete.useMutation({
    onSuccess: () => {
      utils.metrics.admin.list.invalidate();
      toast.success("Metric deleted");
    },
    onError: (error) => {
      toast.error("Error deleting metric", { description: error.message });
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
      toast.error("Please fill in all required fields");
      return;
    }
    const numValue = parseFloat(form.value);
    if (isNaN(numValue)) {
      toast.error("Value must be a number");
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

  // Group metrics by athlete + metricName for trend indicators
  const metricGroups = new Map<string, number>();
  for (const m of metrics ?? []) {
    const key = `${(m as any).athleteId}-${(m as any).metricName}`;
    metricGroups.set(key, (metricGroups.get(key) || 0) + 1);
  }

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
                const groupKey = `${metric.athleteId}-${metric.metricName}`;
                const groupCount = metricGroups.get(groupKey) || 1;
                const hasTrend = groupCount >= 2;

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
                        {hasTrend && (
                          <Badge
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-muted"
                            onClick={() => setTrendView({
                              athleteId: metric.athleteId,
                              metricName: metric.metricName,
                              category: metric.category,
                            })}
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {groupCount} pts
                            <ChevronRight className="h-3 w-3 ml-0.5" />
                          </Badge>
                        )}
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

      {/* Trend Dialog */}
      {trendView && (
        <TrendPanel
          athleteId={trendView.athleteId}
          metricName={trendView.metricName}
          category={trendView.category}
          onClose={() => setTrendView(null)}
        />
      )}
    </Card>
  );
}
