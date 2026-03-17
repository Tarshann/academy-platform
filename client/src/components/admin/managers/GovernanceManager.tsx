import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTrpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const RISK_ICONS: Record<string, typeof Shield> = {
  critical: ShieldAlert,
  high: ShieldX,
  medium: Shield,
  low: ShieldCheck,
};

function formatTimestamp(ts: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return ts;
  }
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copied to clipboard`);
  });
}

export function GovernanceManager() {
  const trpc = useTrpc();

  const statusQuery = useQuery(
    trpc.governance.status.queryOptions()
  );

  const statsQuery = useQuery(
    trpc.governance.stats.queryOptions()
  );

  const capabilitiesQuery = useQuery(
    trpc.governance.listCapabilities.queryOptions()
  );

  const [trailPage, setTrailPage] = useState(0);
  const [trailFilter, setTrailFilter] = useState<string>("all");
  const PAGE_SIZE = 25;

  const trailQuery = useQuery(
    trpc.governance.evidenceTrail.queryOptions({
      limit: PAGE_SIZE,
      offset: trailPage * PAGE_SIZE,
      status: trailFilter as "all" | "allowed" | "denied" | "pending",
    })
  );

  const isEnabled = statusQuery.data?.governanceEnabled ?? false;
  const isUiEnabled = statusQuery.data?.uiEnabled ?? false;

  // Loading state
  if (statusQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Error state
  if (statusQuery.isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Failed to load governance status.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => statusQuery.refetch()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Not enabled banner
  if (!isEnabled || !isUiEnabled) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-medium text-amber-900">
                  Governance {!isEnabled ? "Not Enabled" : "UI Not Enabled"}
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  {!isEnabled
                    ? "Set STRIX_GOVERNANCE_ENABLED=true to activate governance enforcement."
                    : "Set STRIX_GOVERNANCE_UI_ENABLED=true to show the governance dashboard."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Still show the capability registry even when disabled */}
        <CapabilityRegistry
          capabilities={capabilitiesQuery.data ?? []}
          isLoading={capabilitiesQuery.isLoading}
        />
      </div>
    );
  }

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Capabilities"
          value={stats?.totalCapabilities ?? 0}
          icon={Shield}
          loading={statsQuery.isLoading}
        />
        <StatCard
          title="Decisions"
          value={stats?.totalDecisions ?? 0}
          icon={CheckCircle2}
          loading={statsQuery.isLoading}
        />
        <StatCard
          title="Denied"
          value={stats?.deniedCount ?? 0}
          icon={XCircle}
          loading={statsQuery.isLoading}
          variant={
            (stats?.deniedCount ?? 0) > 0 ? "destructive" : "default"
          }
        />
        <StatCard
          title="Pending"
          value={stats?.pendingCount ?? 0}
          icon={Clock}
          loading={statsQuery.isLoading}
          variant={
            (stats?.pendingCount ?? 0) > 0 ? "warning" : "default"
          }
        />
      </div>

      {/* Risk Level Breakdown */}
      {stats?.byRiskLevel && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Capabilities by Risk Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {(
                ["critical", "high", "medium", "low"] as const
              ).map((level) => (
                <Badge
                  key={level}
                  variant="outline"
                  className={RISK_COLORS[level]}
                >
                  {level}: {stats.byRiskLevel[level]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Blocked Attempts */}
      {stats?.recentBlocked && stats.recentBlocked.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Recent Blocked Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentBlocked.map((blocked, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm p-2 bg-red-50 rounded"
                >
                  <div>
                    <span className="font-mono text-xs">
                      {blocked.capabilityId}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      by {blocked.actor}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(blocked.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Evidence Trail / Capability Registry */}
      <Tabs defaultValue="trail">
        <TabsList>
          <TabsTrigger value="trail">Evidence Trail</TabsTrigger>
          <TabsTrigger value="registry">Capability Registry</TabsTrigger>
        </TabsList>

        <TabsContent value="trail" className="mt-4">
          <EvidenceTrail
            data={trailQuery.data}
            isLoading={trailQuery.isLoading}
            page={trailPage}
            onPageChange={setTrailPage}
            filter={trailFilter}
            onFilterChange={(f) => {
              setTrailFilter(f);
              setTrailPage(0);
            }}
          />
        </TabsContent>

        <TabsContent value="registry" className="mt-4">
          <CapabilityRegistry
            capabilities={capabilitiesQuery.data ?? []}
            isLoading={capabilitiesQuery.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  variant = "default",
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  variant?: "default" | "destructive" | "warning";
}) {
  const colorClass =
    variant === "destructive"
      ? "text-red-600"
      : variant === "warning"
        ? "text-amber-600"
        : "text-foreground";

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
            )}
          </div>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceTrail({
  data,
  isLoading,
  page,
  onPageChange,
  filter,
  onFilterChange,
}: {
  data?: { items: any[]; total: number; hasMore: boolean };
  isLoading: boolean;
  page: number;
  onPageChange: (p: number) => void;
  filter: string;
  onFilterChange: (f: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="allowed">Allowed</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No evidence records found.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any, i: number) => (
                <TableRow key={item.id ?? i}>
                  <TableCell className="font-mono text-xs">
                    {item.capabilityId}
                  </TableCell>
                  <TableCell className="text-sm">{item.actor}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.decision === "allowed"
                          ? "bg-green-50 text-green-700"
                          : item.decision === "denied"
                            ? "bg-red-50 text-red-700"
                            : "bg-yellow-50 text-yellow-700"
                      }
                    >
                      {item.decision}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatTimestamp(item.timestamp)}
                  </TableCell>
                  <TableCell>
                    {item.evidenceHash && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                copyToClipboard(
                                  item.evidenceHash,
                                  "Evidence hash"
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Copy evidence hash
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Page {page + 1}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data?.hasMore}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CapabilityRegistry({
  capabilities,
  isLoading,
}: {
  capabilities: Array<{
    id: string;
    name: string;
    description: string;
    riskLevel: string;
    routerPath: string;
    routerLine: number;
  }>;
  isLoading: boolean;
}) {
  const [riskFilter, setRiskFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  const filtered =
    riskFilter === "all"
      ? capabilities
      : capabilities.filter((c) => c.riskLevel === riskFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} capabilities registered
        </p>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Capability</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Router Path</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((cap) => {
              const RiskIcon = RISK_ICONS[cap.riskLevel] ?? Shield;
              return (
                <TableRow key={cap.id}>
                  <TableCell className="font-mono text-xs">
                    {cap.id}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-sm text-left">
                          {cap.name}
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          {cap.description}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${RISK_COLORS[cap.riskLevel]} flex items-center gap-1 w-fit`}
                    >
                      <RiskIcon className="h-3 w-3" />
                      {cap.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {cap.routerPath}
                    <span className="ml-1 opacity-50">
                      L{cap.routerLine}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() =>
                        copyToClipboard(cap.id, "Capability ID")
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
