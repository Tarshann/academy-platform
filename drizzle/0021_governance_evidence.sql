-- Migration 0021: Governance Evidence (local audit trail)
-- Every governed mutation and cron execution is recorded here.

CREATE TABLE IF NOT EXISTS "governance_evidence" (
  "id" serial PRIMARY KEY,
  "capability_id" varchar(120) NOT NULL,
  "actor_id" varchar(100) NOT NULL,
  "actor_role" varchar(50) NOT NULL,
  "actor_email" varchar(255),
  "action" varchar(20) NOT NULL,
  "reason" text,
  "source" varchar(20) NOT NULL,
  "external_decision_id" varchar(200),
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Index for evidence trail queries (most recent first, filterable by capability and action)
CREATE INDEX IF NOT EXISTS "idx_governance_evidence_created" ON "governance_evidence" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_governance_evidence_capability" ON "governance_evidence" ("capability_id");
CREATE INDEX IF NOT EXISTS "idx_governance_evidence_action" ON "governance_evidence" ("action");
