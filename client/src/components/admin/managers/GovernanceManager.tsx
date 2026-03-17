import { useState } from "react";
import { trpc } from "@/_core/trpc-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Clock,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Timer,
} from "lucide-react";

const riskColor: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const riskDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center text-gray-400 hover:text-gray-600">
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = trpc.governance.stats.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!stats) return <p className="text-gray-500">Unable to load governance stats.</p>;

  return (
    <div className="space-y-6">
      {!stats.enabled && (
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Governance Not Active</AlertTitle>
          <AlertDescription>
            Set <code className="bg-gray-100 px-1 rounded text-sm">STRIX_GOVERNANCE_ENABLED=true</code> to
            activate enforcement. The registry below shows what <em>will</em> be governed.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalCapabilities}</div>
            <p className="text-xs text-gray-500">Total Capabilities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-2xl font-bold">{stats.critical}</span>
            </div>
            <p className="text-xs text-gray-500">Critical Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-2xl font-bold">{stats.high}</span>
            </div>
            <p className="text-xs text-gray-500">High Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{stats.cronJobs}</span>
            </div>
            <p className="text-xs text-gray-500">Cron Jobs Governed</p>
          </CardContent>
        </Card>
      </div>

      {stats.enabled && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">{stats.totalDecisions}</span>
              </div>
              <p className="text-xs text-gray-500">Total Decisions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold">{stats.totalDenied}</span>
              </div>
              <p className="text-xs text-gray-500">Blocked Actions</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function EvidenceTrailTab() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const PAGE_SIZE = 20;

  const { data: trail, isLoading } = trpc.governance.evidenceTrail.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="allowed">Allowed</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!trail || trail.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">
          {statusFilter !== "all"
            ? `No ${statusFilter} decisions found.`
            : "No governance decisions recorded yet. Activate governance to start collecting evidence."}
        </p>
      ) : (
        <div className="space-y-2">
          {trail.map((entry: any, i: number) => (
            <Card key={entry.id ?? i} className="p-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={entry.action === "deny" ? "border-red-300 text-red-700" : "border-green-300 text-green-700"}>
                      {entry.action}
                    </Badge>
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{entry.capabilityId}</code>
                    <CopyButton text={entry.capabilityId} />
                  </div>
                  <div className="text-xs text-gray-500">
                    Actor: {entry.actor?.id ?? "unknown"} &middot; {entry.timestamp ? formatTimestamp(entry.timestamp) : ""}
                  </div>
                  {entry.reason && <div className="text-xs text-gray-600">{entry.reason}</div>}
                </div>
                {entry.evidence?.hash && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <code className="truncate max-w-[100px]">{entry.evidence.hash.slice(0, 12)}...</code>
                    <CopyButton text={entry.evidence.hash} />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <span className="text-xs text-gray-500">Page {page + 1}</span>
        <Button variant="outline" size="sm" disabled={!trail || trail.length < PAGE_SIZE} onClick={() => setPage(page + 1)}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function RegistryTab() {
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const { data: capabilities, isLoading } = trpc.governance.listCapabilities.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!capabilities) return <p className="text-gray-500">Unable to load capability registry.</p>;

  const domains = [...new Set(capabilities.map((c: any) => c.domain))].sort();
  const filtered = capabilities.filter((c: any) => {
    if (domainFilter !== "all" && c.domain !== domainFilter) return false;
    if (riskFilter !== "all" && c.risk !== riskFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains ({capabilities.length})</SelectItem>
            {domains.map((d: string) => (
              <SelectItem key={d} value={d}>
                {d} ({capabilities.filter((c: any) => c.domain === d).length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Filter by risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-500">{filtered.length} capabilities</span>
      </div>

      <div className="space-y-1.5">
        {filtered.map((cap: any) => (
          <TooltipProvider key={cap.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-gray-50 cursor-default">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${riskDot[cap.risk] ?? "bg-gray-400"}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{cap.label}</div>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs text-gray-400">{cap.id}</code>
                        <CopyButton text={cap.id} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {cap.domain === "cron" && (
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                        <Timer className="h-3 w-3 mr-1" />
                        Cron
                      </Badge>
                    )}
                    <Badge variant="outline" className={`text-xs ${riskColor[cap.risk] ?? ""}`}>
                      {cap.risk}
                    </Badge>
                    <span className="text-xs text-gray-500 w-20 text-right">
                      {cap.approvalsRequired === 0 ? (
                        <span className="text-gray-400">0 required</span>
                      ) : (
                        <span>{cap.approvalsRequired} approval{cap.approvalsRequired > 1 ? "s" : ""}</span>
                      )}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>{cap.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}

export function GovernanceManager() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-indigo-600" />
        <div>
          <h2 className="text-xl font-semibold">Governance</h2>
          <p className="text-sm text-gray-500">
            Strix governance engine — capability registry, evidence trail, and enforcement status
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="evidence" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Evidence Trail
          </TabsTrigger>
          <TabsTrigger value="registry" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Registry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="evidence" className="mt-4">
          <EvidenceTrailTab />
        </TabsContent>
        <TabsContent value="registry" className="mt-4">
          <RegistryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
