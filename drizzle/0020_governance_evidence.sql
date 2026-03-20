-- Migration 0020: Governance Evidence (Embedded Kernel)
-- Append-only audit trail for all governance decisions.
-- Every governed mutation and cron job writes evidence locally.

CREATE TABLE IF NOT EXISTS "governance_evidence" (
  "id"                    SERIAL PRIMARY KEY,
  "capability_id"         VARCHAR(120) NOT NULL,
  "actor_id"              VARCHAR(100) NOT NULL,
  "actor_role"            VARCHAR(50) NOT NULL,
  "actor_email"           VARCHAR(255),
  "action"                VARCHAR(20) NOT NULL,
  "reason"                TEXT,
  "source"                VARCHAR(20) NOT NULL DEFAULT 'trpc',
  "external_decision_id"  VARCHAR(200),
  "metadata"              JSONB,
  "created_at"            TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for common query patterns (dashboard, filtering, audit)
CREATE INDEX IF NOT EXISTS "idx_governance_evidence_capability" ON "governance_evidence" ("capability_id");
CREATE INDEX IF NOT EXISTS "idx_governance_evidence_actor" ON "governance_evidence" ("actor_id");
CREATE INDEX IF NOT EXISTS "idx_governance_evidence_created_at" ON "governance_evidence" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_governance_evidence_action" ON "governance_evidence" ("action");
