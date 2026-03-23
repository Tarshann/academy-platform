-- Migration 0026: Ensure core v1.6 tables exist
-- Root cause: migration journal was stuck on mysql dialect with only 4 legacy entries.
-- Migrations 0008–0025 (all PostgreSQL) were never tracked, so drizzle-kit migrate
-- would skip them on fresh or refreshed Neon databases.
-- This migration idempotently re-creates the athleteMetrics and athleteShowcases
-- tables (from 0013) plus their enums and indexes, so any environment that
-- missed migration 0013 will self-heal on the next drizzle-kit migrate run.

-- ============================================================================
-- ENUMS (idempotent)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "metric_category" AS ENUM ('speed', 'power', 'agility', 'endurance', 'strength', 'flexibility');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add 'skill' value if it doesn't exist (originally in 0020_vision_capture.sql)
ALTER TYPE metric_category ADD VALUE IF NOT EXISTS 'skill';

DO $$ BEGIN
  CREATE TYPE "drop_type" AS ENUM ('product', 'program', 'content', 'event');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "game_type" AS ENUM ('spin_wheel', 'trivia', 'scratch_card');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "reward_type" AS ENUM ('points', 'discount', 'merch', 'badge', 'none');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "social_platform" AS ENUM ('instagram', 'tiktok', 'twitter', 'facebook', 'youtube');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLES (idempotent — IF NOT EXISTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "athleteMetrics" (
  "id" serial PRIMARY KEY,
  "athleteId" integer NOT NULL,
  "recordedBy" integer NOT NULL,
  "metricName" varchar(100) NOT NULL,
  "category" "metric_category" NOT NULL,
  "value" decimal(10, 2) NOT NULL,
  "unit" varchar(20) NOT NULL,
  "notes" text,
  "sessionDate" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "athleteShowcases" (
  "id" serial PRIMARY KEY,
  "athleteId" integer NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text NOT NULL,
  "imageUrl" varchar(500),
  "imageKey" varchar(500),
  "sport" varchar(50),
  "achievements" text,
  "stats" text,
  "isActive" boolean NOT NULL DEFAULT true,
  "featuredFrom" timestamp NOT NULL,
  "featuredUntil" timestamp,
  "createdBy" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "merchDrops" (
  "id" serial PRIMARY KEY,
  "title" varchar(255) NOT NULL,
  "description" text,
  "dropType" "drop_type" NOT NULL,
  "referenceId" integer,
  "imageUrl" varchar(500),
  "scheduledAt" timestamp NOT NULL,
  "isSent" boolean NOT NULL DEFAULT false,
  "sentAt" timestamp,
  "createdBy" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "userPoints" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL UNIQUE,
  "totalPoints" integer NOT NULL DEFAULT 0,
  "lifetimePoints" integer NOT NULL DEFAULT 0,
  "currentStreak" integer NOT NULL DEFAULT 0,
  "longestStreak" integer NOT NULL DEFAULT 0,
  "lastPlayedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "gameEntries" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "gameType" "game_type" NOT NULL,
  "rewardType" "reward_type" NOT NULL DEFAULT 'none',
  "rewardValue" varchar(255),
  "pointsEarned" integer NOT NULL DEFAULT 0,
  "metadata" text,
  "playedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "triviaQuestions" (
  "id" serial PRIMARY KEY,
  "question" text NOT NULL,
  "optionA" varchar(255) NOT NULL,
  "optionB" varchar(255) NOT NULL,
  "optionC" varchar(255) NOT NULL,
  "optionD" varchar(255) NOT NULL,
  "correctOption" varchar(1) NOT NULL,
  "category" varchar(100),
  "difficulty" varchar(20) NOT NULL DEFAULT 'medium',
  "pointValue" integer NOT NULL DEFAULT 10,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "socialPosts" (
  "id" serial PRIMARY KEY,
  "socialPlatform" "social_platform" NOT NULL,
  "postUrl" varchar(500) NOT NULL,
  "embedHtml" text,
  "thumbnailUrl" varchar(500),
  "caption" text,
  "postedAt" timestamp,
  "isVisible" boolean NOT NULL DEFAULT true,
  "addedBy" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- INDEXES (idempotent — IF NOT EXISTS)
-- ============================================================================

CREATE INDEX IF NOT EXISTS "idx_gameEntries_user_type_date"
  ON "gameEntries" ("userId", "gameType", "playedAt");

CREATE INDEX IF NOT EXISTS "idx_athleteMetrics_athlete_metric"
  ON "athleteMetrics" ("athleteId", "metricName");

CREATE INDEX IF NOT EXISTS "idx_athleteShowcases_active_from"
  ON "athleteShowcases" ("isActive", "featuredFrom");

CREATE INDEX IF NOT EXISTS "idx_merchDrops_sent_scheduled"
  ON "merchDrops" ("isSent", "scheduledAt");

CREATE INDEX IF NOT EXISTS "idx_socialPosts_visible_created"
  ON "socialPosts" ("isVisible", "createdAt");

CREATE INDEX IF NOT EXISTS "idx_gameEntries_user_played"
  ON "gameEntries" ("userId", "playedAt");
