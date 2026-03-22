/**
 * Strix Governance SDK Client
 *
 * Lazy-loaded singleton. Returns null when not configured.
 * The SDK is only initialized when STRIX_GOVERNANCE_ENABLED=true
 * AND STRIX_API_KEY is set.
 *
 * CIRCUIT BREAKER (added 2026-03-21):
 *   After CIRCUIT_BREAKER_THRESHOLD consecutive failures, the SDK
 *   short-circuits to null for CIRCUIT_BREAKER_COOLDOWN_MS, preventing
 *   log spam and unnecessary network calls. Resets automatically after cooldown.
 *
 * FETCH TIMEOUT:
 *   All SDK calls have a 3-second AbortController timeout to prevent
 *   slow DNS / unreachable hosts from blocking serverless functions.
 */

import { logger } from "./logger";

// ---- Circuit breaker state ----
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes (was 5min — reduced log noise)
const FETCH_TIMEOUT_MS = 3_000; // 3 seconds

let consecutiveFailures = 0;
let circuitOpenUntil = 0;
let lastCircuitOpenLogAt = 0; // Dedup: only log circuit-open once per period

function isCircuitOpen(): boolean {
  if (consecutiveFailures < CIRCUIT_BREAKER_THRESHOLD) return false;
  if (Date.now() > circuitOpenUntil) {
    // Cooldown expired — half-open: allow one attempt
    consecutiveFailures = CIRCUIT_BREAKER_THRESHOLD - 1;
    // Reset the singleton so the next getStrixClient() re-initializes
    // a fresh client instead of reusing the stale one
    client = null;
    initialized = false;
    return false;
  }
  return true;
}

function recordSuccess() {
  consecutiveFailures = 0;
  lastCircuitOpenLogAt = 0;
}

function recordFailure() {
  consecutiveFailures++;
  if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
    // Only log the circuit-open warning once per open period to reduce noise
    if (Date.now() - lastCircuitOpenLogAt > CIRCUIT_BREAKER_COOLDOWN_MS) {
      logger.warn(
        `[strix] Circuit breaker OPEN — ${consecutiveFailures} consecutive failures. ` +
        `SDK calls suppressed for ${CIRCUIT_BREAKER_COOLDOWN_MS / 1000}s.`
      );
      lastCircuitOpenLogAt = Date.now();
    }
  }
}

/** Export for governance-procedure to check before even importing the client */
export function isStrixCircuitOpen(): boolean {
  return isCircuitOpen();
}

// ---- Types ----

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

// ---- Timeout helper ----

function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeout)
  );
}

// ---- Singleton client ----

let client: StrixClient | null = null;
let initialized = false;

export function getStrixClient(): StrixClient | null {
  // Circuit breaker — short-circuit without even trying
  if (isCircuitOpen()) return null;

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
      if (isCircuitOpen()) throw new Error("Strix circuit breaker open");
      try {
        const res = await fetchWithTimeout(`${apiUrl}/evaluate`, {
          method: "POST",
          headers,
          body: JSON.stringify(params),
        });
        if (!res.ok) {
          recordFailure();
          throw new Error(`Strix API error: ${res.status} ${res.statusText}`);
        }
        const result = await res.json() as StrixDecision;
        recordSuccess();
        return result;
      } catch (err: any) {
        recordFailure();
        // Provide actionable context for common failure modes
        if (err?.name === "AbortError") {
          throw new Error(`Strix SDK timeout (${FETCH_TIMEOUT_MS}ms) — API may be unreachable`);
        }
        if (err?.cause?.code === "ENOTFOUND" || err?.cause?.code === "ECONNREFUSED") {
          throw new Error(`Strix SDK DNS/connection failure — ${apiUrl} unreachable`);
        }
        throw err;
      }
    },

    async getEvidenceTrail(options = {}): Promise<any[]> {
      if (isCircuitOpen()) return [];
      const params = new URLSearchParams();
      if (options.capabilityId) params.set("capabilityId", options.capabilityId);
      if (options.limit) params.set("limit", String(options.limit));
      if (options.offset) params.set("offset", String(options.offset));
      if (options.status) params.set("status", options.status);
      try {
        const res = await fetchWithTimeout(`${apiUrl}/evidence?${params}`, { headers });
        if (!res.ok) { recordFailure(); return []; }
        recordSuccess();
        return await res.json() as any[];
      } catch { recordFailure(); return []; }
    },

    async getStats(): Promise<Record<string, number>> {
      if (isCircuitOpen()) return {};
      try {
        const res = await fetchWithTimeout(`${apiUrl}/stats`, { headers });
        if (!res.ok) { recordFailure(); return {}; }
        recordSuccess();
        return await res.json() as Record<string, number>;
      } catch { recordFailure(); return {}; }
    },

    async listCapabilities(): Promise<any[]> {
      if (isCircuitOpen()) return [];
      try {
        const res = await fetchWithTimeout(`${apiUrl}/capabilities`, { headers });
        if (!res.ok) { recordFailure(); return []; }
        recordSuccess();
        return await res.json() as any[];
      } catch { recordFailure(); return []; }
    },
  };

  logger.info(`[strix] SDK initialized for tenant ${tenantId}`);
  return client;
}

// =============================================================================
// Evidence Push — Sends evidence to Strix Platform API for Console visibility
//
// Fire-and-forget: local evidence is the source of truth.
// This push makes evidence visible in Console /proof and /api/evidence/verify.
// Uses the same circuit breaker and timeout patterns as the SDK client.
// =============================================================================

interface EvidencePushRecord {
  capabilityId: string;
  actorId: string;
  actorRole: string;
  actorEmail?: string;
  action: string;
  reason?: string;
  source: string;
  riskLevel?: string;
  externalDecisionId?: string;
  evidenceHash: string;
  metadata?: Record<string, unknown>;
  occurredAt: string; // ISO 8601
}

/**
 * Push governance evidence to Strix Platform API.
 *
 * - Non-blocking (fire-and-forget in caller)
 * - Fail-open (catch silently — local evidence is source of truth)
 * - 3s timeout via AbortController
 * - HMAC-SHA256 signature for payload integrity
 */
export async function pushEvidenceToStrix(records: EvidencePushRecord[]): Promise<void> {
  const platformUrl = process.env.STRIX_PLATFORM_API_URL;
  const apiKey = process.env.STRIX_API_KEY;
  const tenantId = process.env.STRIX_TENANT_ID;

  if (!platformUrl || !apiKey || !tenantId) return;

  // Don't push if circuit breaker is open (avoid piling onto a dead endpoint)
  if (isCircuitOpen()) return;

  const body = JSON.stringify({
    tenantId,
    sourceApp: 'academy-platform',
    records,
  });

  const timestamp = String(Date.now());

  // HMAC signature: HMAC-SHA256(timestamp.body, secret)
  const { createHmac } = await import('crypto');
  const internalToken = process.env.STRIX_INTERNAL_TOKEN ?? apiKey;
  const signature = createHmac('sha256', internalToken)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  try {
    await fetchWithTimeout(`${platformUrl}/api/evidence/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Strix-Auth': apiKey,
        'X-Strix-Signature': signature,
        'X-Strix-Timestamp': timestamp,
      },
      body,
    });
    // Don't call recordSuccess() — this is a different endpoint than the SDK
  } catch {
    // Fire-and-forget — local evidence is the source of truth
    logger.warn('[strix] Evidence push to Platform API failed (non-blocking)');
  }
}
