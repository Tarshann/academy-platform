/**
 * GovernanceEvidencePane — Admin Governance Dashboard
 *
 * Three-tab evidence viewer for the Academy admin:
 * 1. Overview: stats summary + recent blocked attempts
 * 2. Evidence Trail: paginated, filterable audit log
 * 3. Capability Registry: all governed capabilities with risk levels
 *
 * Feature-flagged: when governance is disabled server-side, shows
 * a "not enabled" banner with the registry still visible.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

// ─── Icons (inline SVG to avoid lucide-react version issues) ─────────

function ShieldIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function CheckIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CopyIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function AlertIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  );
}

function InfoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function riskColor(level: string): string {
  switch (level) {
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isLoading, error } = trpc.governance.stats.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertIcon className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
          <p>Unable to load governance statistics.</p>
          <p className="text-sm mt-1">This is expected if governance has not been activated yet.</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats?.governanceEnabled) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <InfoIcon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <p className="font-medium">Governance Not Enabled</p>
          <p className="text-sm text-muted-foreground mt-1">
            Set <code className="bg-muted px-1 rounded">STRIX_GOVERNANCE_ENABLED=true</code> to activate runtime governance.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            All governed routes are wired and ready. Current behavior is unchanged.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Decisions</p>
            <p className="text-2xl font-bold">{stats.totalDecisions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Denied</p>
            <p className="text-2xl font-bold text-red-600">{stats.denied}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Last 24h</p>
            <p className="text-2xl font-bold">{stats.last24Hours}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Decisions by Risk Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {(["critical", "high", "medium", "low"] as const).map((level) => (
              <div key={level} className="text-center">
                <Badge className={riskColor(level)}>{level}</Badge>
                <p className="text-lg font-semibold mt-1">
                  {stats.byRiskLevel?.[level] ?? 0}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Evidence Trail Tab ──────────────────────────────────────────────

function EvidenceTrailTab() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "denied">("all");
  const pageSize = 20;

  const { data, isLoading, error } = trpc.governance.evidenceTrail.useQuery({
    limit: pageSize,
    offset: page * pageSize,
    statusFilter,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertIcon className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
          <p>Unable to load evidence trail.</p>
        </CardContent>
      </Card>
    );
  }

  const records = data?.records ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as "all" | "approved" | "denied");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Decisions</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {total} record{total !== 1 ? "s" : ""}
        </span>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <ShieldIcon className="h-8 w-8 mx-auto mb-2" />
            <p>No governance decisions recorded yet.</p>
            <p className="text-sm mt-1">
              Evidence will appear here after governed actions are executed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map((record: any, idx: number) => (
            <Card key={record.executionId || idx}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                        {record.capabilityId}
                      </code>
                      <CopyButton text={record.capabilityId} />
                      <Badge
                        variant={
                          record.decisionStatus === "approved"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {record.decisionStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Actor: {record.actorId} | {formatTimestamp(record.createdAt)}
                    </p>
                    {record.evidenceHash && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Hash: <code className="font-mono">{record.evidenceHash.slice(0, 16)}...</code>
                        <CopyButton text={record.evidenceHash} />
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {total > pageSize && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {Math.ceil(total / pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Capability Registry Tab ─────────────────────────────────────────

function CapabilityRegistryTab() {
  const { data, isLoading, error } = trpc.governance.capabilities.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertIcon className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
          <p>Unable to load capability registry.</p>
        </CardContent>
      </Card>
    );
  }

  const capabilities = data?.capabilities ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {capabilities.length} governed capabilities registered
        </p>
        {data?.governanceEnabled === false && (
          <Badge variant="outline" className="text-xs">
            Governance OFF — routes fall through to adminProcedure
          </Badge>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Capability ID</th>
              <th className="text-left p-3 font-medium">Risk</th>
              <th className="text-left p-3 font-medium">Approvals</th>
              <th className="text-left p-3 font-medium">Irreversible</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {capabilities.map((cap: any) => (
              <tr key={cap.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <code className="font-mono text-xs">{cap.capabilityId}</code>
                    <CopyButton text={cap.capabilityId} />
                  </div>
                </td>
                <td className="p-3">
                  <Badge className={riskColor(cap.riskLevel)}>
                    {cap.riskLevel}
                  </Badge>
                </td>
                <td className="p-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-xs">
                          {cap.approvalsRequired === 0
                            ? "0 required"
                            : `${cap.approvalsRequired} required`}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {cap.approvalsRequired === 0
                          ? "Policy auto-approve: no human approval needed"
                          : `${cap.approvalsRequired} human approval(s) required before execution`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                <td className="p-3">
                  {cap.irreversible ? (
                    <Badge variant="destructive" className="text-xs">Yes</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">No</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function GovernanceEvidencePane() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShieldIcon className="h-6 w-6" />
          Governance
        </h2>
        <p className="text-muted-foreground mt-1">
          Runtime governance enforcement for destructive admin actions
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trail">Evidence Trail</TabsTrigger>
          <TabsTrigger value="registry">Registry</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="trail">
          <EvidenceTrailTab />
        </TabsContent>
        <TabsContent value="registry">
          <CapabilityRegistryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
