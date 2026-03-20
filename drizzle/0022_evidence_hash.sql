-- Migration 0022: Add evidence_hash column for tamper-proof audit trail
-- SHA-256 hex digest of the decision payload (capabilityId, actor, action, reason, source, timestamp)

ALTER TABLE "governance_evidence" ADD COLUMN IF NOT EXISTS "evidence_hash" varchar(64);
