-- Vision Capture Phase A: voice + photo metric extraction
-- Adds 'skill' category to metric enum and vision_captures table

ALTER TYPE metric_category ADD VALUE IF NOT EXISTS 'skill';

CREATE TABLE IF NOT EXISTS "vision_captures" (
  "id" serial PRIMARY KEY,
  "schedule_id" integer REFERENCES "schedules"("id"),
  "captured_by" integer NOT NULL REFERENCES "users"("id"),
  "mode" varchar(20) NOT NULL,
  "media_url" text NOT NULL,
  "media_type" varchar(30) NOT NULL,
  "extraction_json" jsonb,
  "status" varchar(20) DEFAULT 'processing' NOT NULL,
  "athlete_count" integer DEFAULT 0,
  "metric_count" integer DEFAULT 0,
  "processing_time_ms" integer,
  "ai_observations" text,
  "error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "confirmed_at" timestamp
);

CREATE INDEX "vision_captures_status_idx" ON "vision_captures" ("status");
CREATE INDEX "vision_captures_captured_by_idx" ON "vision_captures" ("captured_by");
CREATE INDEX "vision_captures_created_idx" ON "vision_captures" ("created_at");
