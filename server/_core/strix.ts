/**
 * Academy Platform — Strix Governance Initialization
 *
 * Initializes the @strix/governance-sdk with the Academy's capability
 * registry and exports the governed procedure builder for use in routers.
 *
 * This file is the single integration point between the Academy app
 * and the Strix governance kernel.
 */

import {
  StrixGovernance,
  LocalPolicyEngine,
} from "@strix/governance-sdk";
import { ACADEMY_CAPABILITIES } from "./strix-capabilities";

// ─── Environment Configuration ──────────────────────────────────────

const STRIX_SIGNING_KEY = process.env.STRIX_SIGNING_KEY ?? "";
const STRIX_PUBLIC_KEY = process.env.STRIX_PUBLIC_KEY ?? "";
const STRIX_EVIDENCE_PATH = process.env.STRIX_EVIDENCE_PATH ?? "./evidence/audit.jsonl";
const NODE_ENV = process.env.NODE_ENV ?? "development";

// ─── Policy Engine Setup ────────────────────────────────────────────

/**
 * Create the policy engine based on environment.
 *
 * In development/staging: use the local engine (air-gapped, in-memory).
 * In production: can be swapped to remote engine pointing at Strix SaaS.
 */
const localEngine = new LocalPolicyEngine({
  capabilities: ACADEMY_CAPABILITIES,
  signingKey: STRIX_SIGNING_KEY,
  tokenTtlSeconds: 3600,
});

// ─── Strix SDK Instance ─────────────────────────────────────────────

export const strix = new StrixGovernance({
  policyEngine: {
    type: "custom",
    engine: localEngine,
  },
  evidenceSink: {
    type: "file",
    path: STRIX_EVIDENCE_PATH,
  },
  verificationKey: STRIX_PUBLIC_KEY,
  defaultEnvironment: NODE_ENV,
  debug: NODE_ENV === "development",
});

// ─── Re-export for convenience ──────────────────────────────────────

export { localEngine };
