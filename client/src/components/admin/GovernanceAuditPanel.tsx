/**
 * GovernanceAuditPanel — Strix Evidence Viewer for Admin Dashboard
 *
 * Displays the list of governed capabilities and recent governance
 * events. This is the "investor demo" component — it shows that
 * every destructive action is tracked and auditable.
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, ShieldCheck, ShieldAlert, Lock } from "lucide-react";

const riskColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function GovernanceAuditPanel() {
  const { data: capabilities, isLoading } = trpc.governance.listCapabilities.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Governance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading governance data...</p>
        </CardContent>
      </Card>
    );
  }

  const capabilityList = capabilities || [];
  const criticalCount = capabilityList.filter((c: any) => c.riskLevel === "critical").length;
  const highCount = capabilityList.filter((c: any) => c.riskLevel === "high").length;
  const totalGoverned = capabilityList.length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{totalGoverned}</p>
                <p className="text-xs text-muted-foreground">Governed Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{criticalCount}</p>
                <p className="text-xs text-muted-foreground">Critical Risk Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{highCount}</p>
                <p className="text-xs text-muted-foreground">High Risk Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capability Registry */}
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
              {capabilityList.map((cap: any) => (
                <TableRow key={cap.capabilityId}>
                  <TableCell className="font-mono text-sm">
                    {cap.capabilityId}
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
                  <TableCell>{cap.approvalsRequired}</TableCell>
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
    </div>
  );
}
