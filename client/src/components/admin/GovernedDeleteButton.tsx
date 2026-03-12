/**
 * GovernedDeleteButton — Strix-Governed Destructive Action UI
 *
 * A drop-in replacement for delete buttons in admin managers.
 * Shows a confirmation dialog that explains governance, requests
 * a token, and executes the action only when approved.
 *
 * Usage:
 *   <GovernedDeleteButton
 *     capabilityId="academy.program.delete"
 *     resourceName="Group Training Session"
 *     resourceId={42}
 *     onSuccess={() => refetch()}
 *     mutation={trpc.admin.programs.delete}
 *   />
 */

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldCheck, Loader2, Trash2 } from "lucide-react";

type GovernedDeleteButtonProps = {
  /** Strix capability ID for this action */
  capabilityId: string;
  /** Human-readable name of the resource being deleted */
  resourceName: string;
  /** The ID to pass to the delete mutation */
  resourceId: number;
  /** Called after successful deletion */
  onSuccess?: () => void;
  /** The tRPC mutation to call (e.g., trpc.admin.programs.delete) */
  mutation: any;
  /** Optional: variant for the trigger button */
  variant?: "ghost" | "outline" | "destructive" | "default";
  /** Optional: size for the trigger button */
  size?: "sm" | "default" | "lg" | "icon";
  /** Optional: show only icon */
  iconOnly?: boolean;
};

type FlowState =
  | "idle"
  | "simulating"
  | "requesting_token"
  | "executing"
  | "success"
  | "denied"
  | "requires_approval"
  | "error";

export function GovernedDeleteButton({
  capabilityId,
  resourceName,
  resourceId,
  onSuccess,
  mutation,
  variant = "ghost",
  size = "icon",
  iconOnly = true,
}: GovernedDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [executionId, setExecutionId] = useState<string | null>(null);

  const requestToken = trpc.governance.requestToken.useMutation();
  const simulateDecision = trpc.governance.simulate.useMutation();
  const deleteMutation = mutation.useMutation();

  const handleOpen = async () => {
    setIsOpen(true);
    setFlowState("simulating");
    setStatusMessage("Checking governance policy...");

    try {
      const sim = await simulateDecision.mutateAsync({ capabilityId });

      if (sim.status === "DENIED") {
        setFlowState("denied");
        setStatusMessage(sim.reason || "This action is denied by governance policy.");
        return;
      }

      if (sim.status === "REQUIRES_APPROVAL") {
        setFlowState("requires_approval");
        setStatusMessage(
          `This action requires ${sim.missingApprovals} additional approval(s) before it can proceed.`
        );
        return;
      }

      setFlowState("idle");
      setStatusMessage("");
    } catch (err: any) {
      setFlowState("error");
      setStatusMessage(err?.message || "Failed to check governance policy");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      // Step 1: Request governance token
      setFlowState("requesting_token");
      setStatusMessage("Requesting governance authorization...");

      const decision = await requestToken.mutateAsync({
        capabilityId,
        resourceId: String(resourceId),
      });

      if (decision.status !== "ALLOWED" || !decision.token) {
        setFlowState("denied");
        setStatusMessage(decision.reason || "Governance token was not issued.");
        return;
      }

      // Step 2: Execute the governed mutation
      setFlowState("executing");
      setStatusMessage("Executing governed action...");

      const result = await deleteMutation.mutateAsync(
        { id: resourceId },
        {
          context: {
            strixToken: decision.token,
          },
        }
      );

      setFlowState("success");
      setExecutionId(result?.executionId || decision.decisionId);
      setStatusMessage("Action completed successfully.");

      toast.success(`Deleted "${resourceName}"`, {
        description: `Governance execution ID: ${result?.executionId || decision.decisionId}`,
      });

      onSuccess?.();

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        setFlowState("idle");
        setStatusMessage("");
        setExecutionId(null);
      }, 1500);
    } catch (err: any) {
      setFlowState("error");
      setStatusMessage(err?.message || "Governed action failed");
      toast.error(`Failed to delete "${resourceName}"`, {
        description: err?.message,
      });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFlowState("idle");
    setStatusMessage("");
    setExecutionId(null);
  };

  const getShieldIcon = () => {
    switch (flowState) {
      case "simulating":
      case "requesting_token":
      case "executing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "denied":
      case "requires_approval":
      case "error":
        return <ShieldAlert className="h-4 w-4 text-destructive" />;
      case "success":
        return <ShieldCheck className="h-4 w-4 text-green-600" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    switch (flowState) {
      case "simulating":
        return <Badge variant="secondary">Checking policy...</Badge>;
      case "requesting_token":
        return <Badge variant="secondary">Requesting token...</Badge>;
      case "executing":
        return <Badge variant="secondary">Executing...</Badge>;
      case "denied":
        return <Badge variant="destructive">Denied</Badge>;
      case "requires_approval":
        return <Badge className="bg-amber-500">Approval Required</Badge>;
      case "success":
        return <Badge className="bg-green-600 text-white">Authorized</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Governed Action</Badge>;
    }
  };

  const canConfirm = flowState === "idle";
  const isProcessing =
    flowState === "simulating" ||
    flowState === "requesting_token" ||
    flowState === "executing";

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} onClick={handleOpen}>
          <Trash2 className="h-4 w-4 text-destructive" />
          {!iconOnly && <span className="ml-2">Delete</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {getShieldIcon()}
            <span>Governed Action: Delete</span>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                You are about to delete <strong>"{resourceName}"</strong>. This action
                is governed by the Strix Runtime Governance Kernel and requires
                cryptographic authorization.
              </p>

              <div className="flex items-center gap-2 rounded-md border p-3 bg-muted/50">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Capability
                  </p>
                  <p className="text-sm font-mono">{capabilityId}</p>
                </div>
                <div>{getStatusBadge()}</div>
              </div>

              {statusMessage && (
                <p
                  className={`text-sm ${
                    flowState === "denied" || flowState === "error"
                      ? "text-destructive"
                      : flowState === "requires_approval"
                      ? "text-amber-600"
                      : flowState === "success"
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {statusMessage}
                </p>
              )}

              {executionId && (
                <div className="rounded-md border p-2 bg-green-50 dark:bg-green-950/20">
                  <p className="text-xs text-muted-foreground">Execution ID</p>
                  <p className="text-xs font-mono break-all">{executionId}</p>
                </div>
              )}

              {flowState === "idle" && (
                <p className="text-sm text-muted-foreground">
                  This action is <strong>irreversible</strong>. A governance token will
                  be requested, and the execution will be recorded in the evidence
                  layer.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing} onClick={handleClose}>
            Cancel
          </AlertDialogCancel>
          {canConfirm && (
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Shield className="h-4 w-4 mr-2" />
              Authorize & Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
