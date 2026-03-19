-- Migration 0020: Governance Evidence (Embedded Kernel)
-- Append-only audit trail for all governance decisions.
-- Every governed mutation and cron job writes evidence locally.

CREATE TABLE IF NOT EXISTS "governance_evidence" (
  "id"              SERIAL PRIMARY KEY,
  "decision_id"     VARCHAR(255),
  "capability_id"   VARCHAR(255) NOT NULL,
  "action"          VARCHAR(20) NOT NULL,
  "actor_id"        VARCHAR(255) NOT NULL,
  "actor_role"      VARCHAR(50),
  "actor_email"     VARCHAR(255),
  "source"          VARCHAR(20) NOT NULL DEFAULT 'trpc',
  "reason"          TEXT,
  "evidence_hash"   VARCHAR(255),
  "metadata"        TEXT,
  "created_at"      TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for common query patterns (dashboard, filtering, audit)
CREATE INDEX IF NOT EXISTS "idx_governance_evidence_capability" ON "governance_evidence" ("capability_id");
CREATE INDEX IF NOT EXISTS "idx_governance_evidence_actor" ON "governance_evidence" ("actor_id");
CREATE INDEX IF NOT EXISTS "idx_governance_evidence_created_at" ON "governance_evidence" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_governance_evidence_action" ON "governance_evidence" ("action");
