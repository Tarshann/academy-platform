-- Migration 0019: Automation Infrastructure
-- Adds tables for cron job tracking, AI content generation, and digest logging

-- AI-generated progress reports (stored for history)
CREATE TABLE IF NOT EXISTS "progress_reports" (
  "id" serial PRIMARY KEY,
  "athlete_id" integer NOT NULL REFERENCES "users"("id"),
  "content" text NOT NULL,
  "generated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "progress_reports_athlete_idx" ON "progress_reports" ("athlete_id");

-- Re-engagement tracking (prevents notification spam)
CREATE TABLE IF NOT EXISTS "reengagement_log" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "type" varchar(20) NOT NULL,
  "sent_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "reengagement_log_user_idx" ON "reengagement_log" ("user_id");
CREATE INDEX "reengagement_log_sent_idx" ON "reengagement_log" ("sent_at");

-- AI-generated session recaps (feeds community feed)
CREATE TABLE IF NOT EXISTS "session_recaps" (
  "id" serial PRIMARY KEY,
  "schedule_id" integer NOT NULL REFERENCES "schedules"("id"),
  "content" text NOT NULL,
  "generated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "session_recaps_schedule_idx" ON "session_recaps" ("schedule_id");

-- AI-generated social content queue (coach reviews before posting)
CREATE TABLE IF NOT EXISTS "content_queue" (
  "id" serial PRIMARY KEY,
  "content" text NOT NULL,
  "platform" varchar(20) DEFAULT 'instagram',
  "status" varchar(20) DEFAULT 'draft' NOT NULL,
  "schedule_id" integer REFERENCES "schedules"("id"),
  "reviewed_by" integer REFERENCES "users"("id"),
  "reviewed_at" timestamp,
  "generated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "content_queue_status_idx" ON "content_queue" ("status");

-- Digest tracking (prevents duplicate sends)
CREATE TABLE IF NOT EXISTS "digest_log" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "type" varchar(30) NOT NULL,
  "week_key" varchar(10) NOT NULL,
  "sent_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "digest_log_user_week_idx" ON "digest_log" ("user_id", "type", "week_key");

-- Reminder dedup (prevents re-sending for same session)
CREATE TABLE IF NOT EXISTS "reminder_log" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "schedule_id" integer NOT NULL REFERENCES "schedules"("id"),
  "type" varchar(20) NOT NULL,
  "sent_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "reminder_log_dedup_idx" ON "reminder_log" ("user_id", "schedule_id", "type");
