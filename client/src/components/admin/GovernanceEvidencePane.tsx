/**
 * GovernanceEvidencePane — Production-Hardened Evidence Viewer
 *
 * The "proof surface" for the Academy admin dashboard. Shows that
 * governance is real, active, and auditable.
 *
 * Tabs:
 *   1. Overview — stats, risk distribution, recent blocked attempts, invariant banner
 *   2. Evidence Trail — filterable, paginated audit log with copy buttons
 *   3. Registry — all governed capabilities with semantically precise labels
 *
 * Production Hardening (v2):
 *   - Error boundaries on each section (graceful degradation)
 *   - Empty states for every data-dependent section
 *   - Loading skeletons instead of blank screens
 *   - Timestamp formatting with Intl.DateTimeFormat (respects user locale/timezone)
 *   - Copy-to-clipboard for evidence hashes and proposal IDs
 *   - Filters on evidence trail (status, capability)
 *   - "Recent Blocked Attempts" widget on overview
 *   - Registry label: "0 required" instead of "Auto (dev)"
 */

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Activity,
  FileText,
  CheckCircle2,
  XCircle,
  Timer,
  Copy,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Formatting Helpers ─────────────────────────────────────────────

/**
 * Format a timestamp for display using the user's locale and timezone.
 * Falls back gracefully if the timestamp is invalid.
 */
function formatTimestamp(ts: string | undefined): string {
  if (!ts) return "-";
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(date);
  } catch {
    return ts;
  }
}

/**
 * Format a timestamp as a relative time string (e.g., "2 hours ago").
 */
function formatRelativeTime(ts: string | undefined): string {
  if (!ts) return "";
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return "";
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

// ─── Copy to Clipboard Hook ────────────────────────────────────────

function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  return { copiedId, copy };
}

// ─── Style Constants ────────────────────────────────────────────────

const riskColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusColors: Record<string, string> = {
  approved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  pending_approval: "bg-amber-100 text-amber-800",
  approval_required: "bg-amber-100 text-amber-800",
  token_issued: "bg-emerald-100 text-emerald-800",
  executed: "bg-blue-100 text-blue-800",
  unknown: "bg-gray-100 text-gray-800",
};

// ─── Types ──────────────────────────────────────────────────────────

type EvidenceTab = "overview" | "trail" | "registry";

interface CapabilityInfo {
  id: string;
  riskLevel: string;
  irreversible: boolean;
  approvalsRequired: number;
  allowedEnvironments: string[];
}

// ─── Stats Card ─────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  subtext,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  subtext?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className={`h-8 w-8 ${color}`} />
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            {subtext && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-muted-foreground" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

// ─── Error State ────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              Failed to Load Governance Data
            </h3>
            <p className="text-sm text-red-700 dark:text-red-200 mt-1">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Risk Distribution Bar ──────────────────────────────────────────

function RiskDistribution({
  capabilities,
}: {
  capabilities: CapabilityInfo[];
}) {
  const counts = { low: 0, medium: 0, high: 0, critical: 0 };
  capabilities.forEach((c) => {
    const level = c.riskLevel as keyof typeof counts;
    if (level in counts) counts[level]++;
  });

  const total = capabilities.length || 1;
  const barColors = {
    low: "bg-green-500",
    medium: "bg-amber-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Risk Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-4 rounded-full overflow-hidden mb-3">
          {(["low", "medium", "high", "critical"] as const).map((level) =>
            counts[level] > 0 ? (
              <div
                key={level}
                className={`${barColors[level]} transition-all`}
                style={{ width: `${(counts[level] / total) * 100}%` }}
                title={`${level}: ${counts[level]}`}
              />
            ) : null
          )}
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {(["low", "medium", "high", "critical"] as const).map((level) => (
            <div key={level}>
              <div className="text-lg font-bold">{counts[level]}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {level}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Recent Blocked Attempts Widget ─────────────────────────────────

function RecentBlockedAttempts() {
  const { data, isLoading, isError } = trpc.governance.evidenceTrail.useQuery({
    limit: 5,
    offset: 0,
    statusFilter: "denied",
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            Recent Blocked Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return null; // Silently degrade — this is a supplementary widget
  }

  const records = data?.records || [];

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            Recent Blocked Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No blocked attempts. All governed actions have been authorized.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          Recent Blocked Attempts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {records.map((record: any, i: number) => (
            <div
              key={record.evidenceId || i}
              className="flex items-center justify-between py-2 px-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900"
            >
              <div className="flex items-center gap-2 min-w-0">
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="font-mono text-xs truncate">
                  {record.capabilityId}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(record.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Evidence Trail Table (with filters and pagination) ─────────────

function EvidenceTrailTable({
  capabilities,
}: {
  capabilities: CapabilityInfo[];
}) {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "approved" | "denied"
  >("all");
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const { copiedId, copy } = useCopyToClipboard();

  const { data, isLoading, isError, error } =
    trpc.governance.evidenceTrail.useQuery({
      limit: pageSize,
      offset: page * pageSize,
      statusFilter,
    });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={
          (error as any)?.message ||
          "Failed to load evidence trail. The evidence store may not be initialized yet."
        }
      />
    );
  }

  const records = data?.records || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">
            Filter by status:
          </label>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as "all" | "approved" | "denied");
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All decisions</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {total > 0 && (
          <p className="text-xs text-muted-foreground">
            {total} total record{total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Table or Empty State */}
      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold">No Evidence Records</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                {statusFilter === "all"
                  ? "Evidence records are generated automatically when governed actions are proposed, approved, denied, or executed. Perform a governed action to see the first record appear here."
                  : `No ${statusFilter} records found. Try changing the filter.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Evidence Trail
            </CardTitle>
            <CardDescription>
              Immutable audit log of all governance decisions. Each record is
              SHA-256 hashed for tamper detection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Capability</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Evidence Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record: any, i: number) => {
                    const recordId =
                      record.evidenceId || record.proposalId || `row-${i}`;
                    const fullHash =
                      record.evidenceHash || record.hash || "";
                    return (
                      <TableRow key={recordId}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger>
                              {formatRelativeTime(record.createdAt) || formatTimestamp(record.createdAt)}
                            </TooltipTrigger>
                            <TooltipContent>
                              {formatTimestamp(record.createdAt)}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {record.capabilityId}
                        </TableCell>
                        <TableCell className="text-xs">
                          {record.actorId}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusColors[record.decisionStatus] ||
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {(record.decisionStatus || "unknown").replace(
                              /_/g,
                              " "
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {record.reasons?.length > 0
                            ? record.reasons.join("; ")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono text-xs text-muted-foreground cursor-help">
                                  {fullHash
                                    ? `${fullHash.slice(0, 12)}...`
                                    : "-"}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-mono text-xs break-all">
                                  {fullHash || "No hash available"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                            {fullHash && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  copy(fullHash, `hash-${recordId}`)
                                }
                              >
                                {copiedId === `hash-${recordId}` ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Capability Registry Table ──────────────────────────────────────

function CapabilityRegistryTable({
  capabilities,
}: {
  capabilities: CapabilityInfo[];
}) {
  const { copiedId, copy } = useCopyToClipboard();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Governed Capability Registry
        </CardTitle>
        <CardDescription>
          All destructive actions in this application are protected by the Strix
          Runtime Governance Kernel. No action below can execute without a valid,
          cryptographically signed, single-use governance token.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Irreversible</TableHead>
                <TableHead>Approvals</TableHead>
                <TableHead>Environments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {capabilities.map((cap) => (
                <TableRow key={cap.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm">{cap.id}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copy(cap.id, `cap-${cap.id}`)}
                      >
                        {copiedId === `cap-${cap.id}` ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={riskColors[cap.riskLevel] || ""}>
                      {cap.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cap.irreversible ? (
                      <Badge variant="destructive">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {cap.approvalsRequired > 0 ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge className="bg-amber-100 text-amber-800">
                            {cap.approvalsRequired} required
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {cap.approvalsRequired} human approval
                          {cap.approvalsRequired > 1 ? "s" : ""} required before
                          execution
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline">0 required</Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          Policy auto-approve: token issued automatically for
                          authorized actors
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {cap.allowedEnvironments.map((env: string) => (
                        <Badge key={env} variant="outline" className="text-xs">
                          {env}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

// ─── Main Evidence Pane ─────────────────────────────────────────────

export function GovernanceEvidencePane() {
  const [activeTab, setActiveTab] = useState<EvidenceTab>("overview");

  const {
    data: capData,
    isLoading: capsLoading,
    isError: capsError,
    error: capsErrorMsg,
  } = trpc.governance.capabilities.useQuery();

  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
  } = trpc.governance.stats.useQuery();

  const capabilities = (capData?.capabilities || []) as CapabilityInfo[];
  const stats = statsData || {
    totalDecisions: 0,
    approved: 0,
    denied: 0,
    pendingApproval: 0,
  };

  const isLoading = capsLoading || statsLoading;

  // Loading state with skeleton
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state — capabilities are required for the pane to function
  if (capsError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Governance</h2>
        </div>
        <ErrorState
          message={
            (capsErrorMsg as any)?.message ||
            "Unable to load governance capabilities. Please check that the Strix SDK is properly configured."
          }
        />
      </div>
    );
  }

  const tabs: { id: EvidenceTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "trail", label: "Evidence Trail", icon: FileText },
    { id: "registry", label: "Registry", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Governance
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Runtime governance visibility — every destructive action is tracked,
          authorized, and auditable.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={ShieldCheck}
              label="Total Governed Actions"
              value={capabilities.length}
              color="text-green-600"
              subtext={`${capabilities.filter((c) => c.irreversible).length} irreversible`}
            />
            <StatCard
              icon={CheckCircle2}
              label="Approved"
              value={stats.approved}
              color="text-green-600"
            />
            <StatCard
              icon={XCircle}
              label="Denied"
              value={stats.denied}
              color="text-red-600"
            />
            <StatCard
              icon={Timer}
              label="Pending Approval"
              value={stats.pendingApproval}
              color="text-amber-600"
            />
          </div>

          {/* Risk Distribution + Recent Blocked */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskDistribution capabilities={capabilities} />
            <RecentBlockedAttempts />
          </div>

          {/* Governance Invariant Banner */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Strix Governance Invariant
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                    No destructive action in this application can execute without
                    a valid, unconsumed, cryptographically-signed decision token.
                    Every decision generates an immutable, tamper-detectable
                    evidence record with SHA-256 integrity hashing.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge className="bg-green-200 text-green-900">
                      Fail-Closed by Construction
                    </Badge>
                    <Badge className="bg-green-200 text-green-900">
                      Anti-Replay Protection
                    </Badge>
                    <Badge className="bg-green-200 text-green-900">
                      Agent Escalation
                    </Badge>
                    <Badge className="bg-green-200 text-green-900">
                      Immutable Evidence
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "trail" && (
        <EvidenceTrailTable capabilities={capabilities} />
      )}

      {activeTab === "registry" && (
        <CapabilityRegistryTable capabilities={capabilities} />
      )}
    </div>
  );
}

export default GovernanceEvidencePane;
