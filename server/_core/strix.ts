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
const CIRCUIT_BREAKER_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT_MS = 3_000; // 3 seconds

let consecutiveFailures = 0;
let circuitOpenUntil = 0;

function isCircuitOpen(): boolean {
  if (consecutiveFailures < CIRCUIT_BREAKER_THRESHOLD) return false;
  if (Date.now() > circuitOpenUntil) {
    // Cooldown expired — half-open: allow one attempt
    consecutiveFailures = CIRCUIT_BREAKER_THRESHOLD - 1;
    return false;
  }
  return true;
}

function recordSuccess() {
  consecutiveFailures = 0;
}

function recordFailure() {
  consecutiveFailures++;
  if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
    logger.warn(
      `[strix] Circuit breaker OPEN — ${consecutiveFailures} consecutive failures. ` +
      `SDK calls suppressed for ${CIRCUIT_BREAKER_COOLDOWN_MS / 1000}s.`
    );
  }
}

/** Export for governance-procedure to check before even importing the client */
export function isStrixCircuitOpen(): boolean {
  return isCircuitOpen();
}

/**
 * Returns true if the Strix SDK has the minimum configuration required to
 * make API calls (API key + tenant ID). This is a pure env-var check —
 * it does NOT initialize the client or make any network calls.
 *
 * Use this in governed-procedure.ts to skip SDK attempts entirely when
 * credentials are missing, avoiding unnecessary error logs in serverless
 * environments where the circuit breaker state resets per invocation.
 */
export function isStrixConfigured(): boolean {
  return !!(process.env.STRIX_API_KEY && process.env.STRIX_TENANT_ID);
}

// ---- Startup validation (runs once per cold start) ----
let _startupValidated = false;

/**
 * Logs a one-time warning if STRIX_GOVERNANCE_ENABLED=true but the SDK
 * is missing required configuration. Called lazily on first SDK access.
 */
function validateStrixConfig(): void {
  if (_startupValidated) return;
  _startupValidated = true;

  const governanceEnabled = process.env.STRIX_GOVERNANCE_ENABLED === "true";
  if (!governanceEnabled) return;

  const apiKey = process.env.STRIX_API_KEY;
  const tenantId = process.env.STRIX_TENANT_ID;

  if (!apiKey || !tenantId) {
    logger.error(
      "[strix] STRIX_GOVERNANCE_ENABLED=true but SDK credentials are missing " +
      `(STRIX_API_KEY=${apiKey ? "set" : "MISSING"}, STRIX_TENANT_ID=${tenantId ? "set" : "MISSING"}). ` +
      "External SDK calls will be skipped. Set credentials or disable governance to silence this warning."
    );
  }
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
  // One-time startup validation (logs warning if misconfigured)
  validateStrixConfig();

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
      } catch (err) {
        recordFailure();
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

// ---- Evidence Push to Strix Platform API ----

const PLATFORM_API_URL = process.env.STRIX_PLATFORM_API_URL; // e.g. https://strix-platform-api.vercel.app
const INTERNAL_TOKEN = process.env.STRIX_INTERNAL_TOKEN;

/**
 * Pushes a governance evidence record to the Strix Platform API.
 * Fire-and-forget — never blocks the calling mutation or cron job.
 *
 * Signs the payload with HMAC-SHA256 using STRIX_INTERNAL_TOKEN for
 * tamper-proof ingestion. The Platform API verifies this signature
 * before accepting evidence.
 *
 * Skips silently when STRIX_PLATFORM_API_URL or STRIX_INTERNAL_TOKEN
 * are not configured.
 */
export async function pushEvidenceToStrix(evidence: {
  capabilityId: string;
  actorId: string;
  actorRole: string;
  actorEmail?: string | null;
  action: string;
  reason?: string | null;
  source: string;
  evidenceHash: string;
  externalDecisionId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  if (!PLATFORM_API_URL || !INTERNAL_TOKEN) return;

  try {
    const { createHmac } = await import("crypto");

    const payload = JSON.stringify({
      records: [
        {
          tenantId: process.env.STRIX_TENANT_ID ?? "academy",
          capabilityId: evidence.capabilityId,
          actorId: evidence.actorId,
          actorRole: evidence.actorRole,
          actorEmail: evidence.actorEmail ?? undefined,
          decision: evidence.action,
          reason: evidence.reason ?? undefined,
          source: evidence.source,
          evidenceHash: evidence.evidenceHash,
          externalDecisionId: evidence.externalDecisionId ?? undefined,
          metadata: evidence.metadata ?? undefined,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    const signature = createHmac("sha256", INTERNAL_TOKEN)
      .update(payload)
      .digest("hex");

    await fetchWithTimeout(`${PLATFORM_API_URL}/api/evidence/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INTERNAL_TOKEN}`,
        "X-Signature": signature,
      },
      body: payload,
    });
  } catch (err) {
    // Fire-and-forget — never block the mutation
    logger.warn("[strix] Evidence push to Platform API failed:", err);
  }
}
