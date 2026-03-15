/**
 * GovernanceEvidencePane — Minimal Evidence Viewer for Academy Admin
 *
 * This is the "proof surface" — the admin tab that shows governance
 * is real and active. It displays:
 *
 *   1. Summary stats (total decisions, approved, denied, pending)
 *   2. Risk distribution (how many actions at each risk level)
 *   3. Recent evidence trail (chronological audit log)
 *   4. Capability registry (all governed actions and their policies)
 *
 * This component is designed to be embedded in the Academy admin
 * dashboard as a tab alongside existing managers (Members, Programs, etc.)
 *
 * For investor demos and compliance audits, this is the component
 * that proves the governance layer is structural, not cosmetic.
 */

import { useState } from "react";
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
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldBan,
  Lock,
  Clock,
  Activity,
  FileText,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
} from "lucide-react";

// ─── Risk Level Colors ──────────────────────────────────────────────

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
};

// ─── Sub-tabs ───────────────────────────────────────────────────────

type EvidenceTab = "overview" | "trail" | "registry";

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

// ─── Risk Distribution Bar ──────────────────────────────────────────

function RiskDistribution({
  capabilities,
}: {
  capabilities: Array<{ id: string; riskLevel: string }>;
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
          {(["low", "medium", "high", "critical"] as const).map((level) => (
            <div
              key={level}
              className={`${barColors[level]} transition-all`}
              style={{ width: `${(counts[level] / total) * 100}%` }}
            />
          ))}
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

// ─── Evidence Trail Table ───────────────────────────────────────────

function EvidenceTrailTable() {
  const { data, isLoading } = trpc.governance.evidenceTrail.useQuery({
    limit: 50,
    offset: 0,
    statusFilter: "all",
  });

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading evidence trail...
      </div>
    );
  }

  const records = data?.records || [];

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold">No Evidence Records Yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Evidence records are generated automatically when governed actions
              are proposed, approved, denied, or executed. Perform a governed
              action to see the first record appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
            {records.map((record: any) => (
              <TableRow key={record.evidenceId || record.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(record.createdAt || record.timestamp).toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {record.capabilityId}
                </TableCell>
                <TableCell className="text-xs">{record.actorId}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      statusColors[record.decisionStatus || record.status] ||
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {(record.decisionStatus || record.status || "").replace(
                      /_/g,
                      " "
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                  {Array.isArray(record.reasons)
                    ? record.reasons.join("; ")
                    : record.reason || "-"}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {(record.evidenceHash || record.hash || "").slice(0, 16)}...
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data?.hasMore && (
          <div className="text-center mt-4">
            <p className="text-xs text-muted-foreground">
              Showing {records.length} of {data.total} records
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Capability Registry Table ──────────────────────────────────────

function CapabilityRegistryTable({
  capabilities,
}: {
  capabilities: Array<{
    id: string;
    riskLevel: string;
    irreversible: boolean;
    approvalsRequired: number;
    allowedEnvironments: string[];
  }>;
}) {
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
                <TableCell className="font-mono text-sm">{cap.id}</TableCell>
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
                    <Badge className="bg-amber-100 text-amber-800">
                      {cap.approvalsRequired} required
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Auto (dev)
                    </span>
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
      </CardContent>
    </Card>
  );
}

// ─── Main Evidence Pane ─────────────────────────────────────────────

export function GovernanceEvidencePane() {
  const [activeTab, setActiveTab] = useState<EvidenceTab>("overview");

  const { data: capData, isLoading: capsLoading } =
    trpc.governance.capabilities.useQuery();
  const { data: statsData, isLoading: statsLoading } =
    trpc.governance.stats.useQuery();

  const capabilities = capData?.capabilities || [];
  const stats = statsData || {
    totalDecisions: 0,
    approved: 0,
    denied: 0,
    pendingApproval: 0,
  };

  const isLoading = capsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Governance</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading governance data...
          </CardContent>
        </Card>
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

          {/* Risk Distribution */}
          <RiskDistribution capabilities={capabilities} />

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

      {activeTab === "trail" && <EvidenceTrailTable />}

      {activeTab === "registry" && (
        <CapabilityRegistryTable capabilities={capabilities} />
      )}
    </div>
  );
}

export default GovernanceEvidencePane;
