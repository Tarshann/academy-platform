/**
 * Strix Governance SDK Client
 *
 * Lazy-initialized singleton. Only loads when STRIX_GOVERNANCE_ENABLED=true.
 * Returns null when governance is disabled — callers must handle this.
 */

import { logger } from "./logger";

// Type-only interface — the actual SDK is loaded dynamically
interface StrixClient {
  authorize(params: {
    capabilityId: string;
    actor: { id: string; role: string; type: string };
    context: Record<string, unknown>;
  }): Promise<{ allowed: boolean; reason?: string; evidenceHash?: string }>;

  logEvidence(params: {
    capabilityId: string;
    actor: { id: string; role: string; type: string };
    decision: string;
    timestamp: string;
  }): Promise<void>;

  listCapabilities(): Promise<Array<{
    id: string;
    name: string;
    riskLevel: string;
    approvalsRequired: number;
  }>>;

  getEvidenceTrail(params: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<Array<{
    id: string;
    capabilityId: string;
    actor: string;
    decision: string;
    timestamp: string;
    evidenceHash?: string;
  }>>;

  getStats(): Promise<{
    totalDecisions: number;
    allowedCount: number;
    deniedCount: number;
    pendingCount: number;
    recentBlocked: Array<{
      capabilityId: string;
      actor: string;
      reason: string;
      timestamp: string;
    }>;
  }>;
}

let client: StrixClient | null = null;
let initialized = false;

export function getStrixClient(): StrixClient | null {
  if (initialized) return client;
  initialized = true;

  if (process.env.STRIX_GOVERNANCE_ENABLED !== "true") {
    logger.info("[Strix] Governance disabled — SDK not loaded");
    return null;
  }

  const apiKey = process.env.STRIX_API_KEY;
  const tenantId = process.env.STRIX_TENANT_ID;

  if (!apiKey || !tenantId) {
    logger.warn("[Strix] STRIX_API_KEY or STRIX_TENANT_ID not set — governance disabled");
    return null;
  }

  try {
    const baseUrl = process.env.STRIX_API_URL ?? "https://api.strix.dev/v1";

    client = {
      async authorize(params) {
        const res = await fetch(`${baseUrl}/authorize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "X-Tenant-ID": tenantId,
          },
          body: JSON.stringify(params),
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) {
          throw new Error(`Strix authorize failed: ${res.status}`);
        }
        return res.json();
      },

      async logEvidence(params) {
        await fetch(`${baseUrl}/evidence`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "X-Tenant-ID": tenantId,
          },
          body: JSON.stringify(params),
          signal: AbortSignal.timeout(5000),
        }).catch((err) => {
          logger.error("[Strix] Evidence log failed:", err);
        });
      },

      async listCapabilities() {
        const res = await fetch(`${baseUrl}/capabilities`, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "X-Tenant-ID": tenantId,
          },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return [];
        return res.json();
      },

      async getEvidenceTrail(params) {
        const qs = new URLSearchParams();
        if (params.limit) qs.set("limit", String(params.limit));
        if (params.offset) qs.set("offset", String(params.offset));
        if (params.status) qs.set("status", params.status);
        const res = await fetch(`${baseUrl}/evidence?${qs}`, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "X-Tenant-ID": tenantId,
          },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return [];
        return res.json();
      },

      async getStats() {
        const res = await fetch(`${baseUrl}/stats`, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "X-Tenant-ID": tenantId,
          },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
          return {
            totalDecisions: 0,
            allowedCount: 0,
            deniedCount: 0,
            pendingCount: 0,
            recentBlocked: [],
          };
        }
        return res.json();
      },
    };

    logger.info(`[Strix] Governance SDK initialized for tenant ${tenantId}`);
    return client;
  } catch (err) {
    logger.error("[Strix] SDK initialization failed:", err);
    return null;
  }
}
