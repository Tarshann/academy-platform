/**
 * Strix Governance SDK Client
 *
 * Lazy-loaded singleton. Returns null when not configured.
 * The SDK is only initialized when STRIX_GOVERNANCE_ENABLED=true
 * AND STRIX_API_KEY is set.
 */

import { logger } from "./logger";

interface StrixEvaluateParams {
  capabilityId: string;
  actor: {
    id: string;
    role: string;
    email?: string;
  };
  context?: Record<string, unknown>;
}

interface StrixDecision {
  id: string;
  action: "allow" | "deny" | "escalate";
  reason?: string;
  evidence?: {
    hash: string;
    timestamp: string;
  };
}

interface StrixClient {
  evaluate(params: StrixEvaluateParams): Promise<StrixDecision>;
  getEvidenceTrail(options?: {
    capabilityId?: string;
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<any[]>;
  getStats(): Promise<Record<string, number>>;
  listCapabilities(): Promise<any[]>;
}

let client: StrixClient | null = null;
let initialized = false;

export function getStrixClient(): StrixClient | null {
  if (initialized) return client;
  initialized = true;

  const apiKey = process.env.STRIX_API_KEY;
  const tenantId = process.env.STRIX_TENANT_ID;
  const apiUrl = process.env.STRIX_API_URL ?? "https://api.strix.dev/v1";

  if (!apiKey || !tenantId) {
    logger.info("[strix] SDK not configured (missing STRIX_API_KEY or STRIX_TENANT_ID)");
    return null;
  }

  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "X-Tenant-Id": tenantId,
    "Content-Type": "application/json",
  };

  client = {
    async evaluate(params: StrixEvaluateParams): Promise<StrixDecision> {
      const res = await fetch(`${apiUrl}/evaluate`, {
        method: "POST",
        headers,
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        throw new Error(`Strix API error: ${res.status} ${res.statusText}`);
      }
      return await res.json() as StrixDecision;
    },

    async getEvidenceTrail(options = {}): Promise<any[]> {
      const params = new URLSearchParams();
      if (options.capabilityId) params.set("capabilityId", options.capabilityId);
      if (options.limit) params.set("limit", String(options.limit));
      if (options.offset) params.set("offset", String(options.offset));
      if (options.status) params.set("status", options.status);
      const res = await fetch(`${apiUrl}/evidence?${params}`, { headers });
      if (!res.ok) return [];
      return await res.json() as any[];
    },

    async getStats(): Promise<Record<string, number>> {
      const res = await fetch(`${apiUrl}/stats`, { headers });
      if (!res.ok) return {};
      return await res.json() as Record<string, number>;
    },

    async listCapabilities(): Promise<any[]> {
      const res = await fetch(`${apiUrl}/capabilities`, { headers });
      if (!res.ok) return [];
      return await res.json() as any[];
    },
  };

  logger.info(`[strix] SDK initialized for tenant ${tenantId}`);
  return client;
}
