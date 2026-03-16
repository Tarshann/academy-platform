-- Migration 0016: Strategic audit features
-- Family accounts, waitlist, referrals, onboarding, RBAC, billing reminders, schedule templates

-- ============================================================================
-- RBAC: Extended user roles
-- ============================================================================
-- Note: schema uses varchar(30) for extendedRole, not a custom enum type
-- Fix any existing enum-typed column by dropping and re-adding as varchar
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'extendedRole'
    AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE "users" DROP COLUMN "extendedRole";
  END IF;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "extendedRole" varchar(30) DEFAULT 'athlete';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboardingCompleted" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sport" varchar(50);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dateOfBirth" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "goals" text;

-- ============================================================================
-- WAITLIST TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "waitlist" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "scheduleId" integer,
  "programId" integer,
  "position" integer NOT NULL DEFAULT 0,
  "status" varchar(30) NOT NULL DEFAULT 'waiting',
  "notifiedAt" timestamp,
  "expiresAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- REFERRALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "referrals" (
  "id" serial PRIMARY KEY,
  "referrerId" integer NOT NULL,
  "referredEmail" varchar(320) NOT NULL,
  "referredUserId" integer,
  "referralCode" varchar(20) NOT NULL UNIQUE,
  "status" varchar(30) NOT NULL DEFAULT 'pending',
  "pointsAwarded" integer NOT NULL DEFAULT 0,
  "discountPercent" decimal(5, 2),
  "convertedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- Add referral code to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referralCode" varchar(20) UNIQUE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referredBy" integer;

-- ============================================================================
-- SCHEDULE TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "scheduleTemplates" (
  "id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "programId" integer,
  "dayOfWeek" "day_of_week" NOT NULL,
  "startHour" integer NOT NULL,
  "startMinute" integer NOT NULL DEFAULT 0,
  "endHour" integer NOT NULL,
  "endMinute" integer NOT NULL DEFAULT 0,
  "location" varchar(255),
  "maxParticipants" integer,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdBy" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- BILLING REMINDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "billingReminders" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "subscriptionId" integer,
  "stripeInvoiceId" varchar(255),
  "reminderType" varchar(50) NOT NULL DEFAULT 'payment_failed',
  "reminderCount" integer NOT NULL DEFAULT 1,
  "lastSentAt" timestamp DEFAULT now() NOT NULL,
  "nextSendAt" timestamp,
  "status" varchar(30) NOT NULL DEFAULT 'active',
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- ONBOARDING STEPS TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS "onboardingSteps" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "step" varchar(50) NOT NULL,
  "completedAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- USER RELATIONS (Family accounts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "userRelations" (
  "id" serial PRIMARY KEY,
  "parentId" integer NOT NULL,
  "childId" integer NOT NULL,
  "relationshipType" varchar(50) NOT NULL DEFAULT 'parent',
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_waitlist_schedule" ON "waitlist" ("scheduleId", "status");
CREATE INDEX IF NOT EXISTS "idx_waitlist_program" ON "waitlist" ("programId", "status");
CREATE INDEX IF NOT EXISTS "idx_waitlist_user" ON "waitlist" ("userId");
CREATE INDEX IF NOT EXISTS "idx_referrals_referrer" ON "referrals" ("referrerId");
CREATE INDEX IF NOT EXISTS "idx_referrals_code" ON "referrals" ("referralCode");
CREATE INDEX IF NOT EXISTS "idx_referrals_email" ON "referrals" ("referredEmail");
CREATE INDEX IF NOT EXISTS "idx_billing_reminders_user" ON "billingReminders" ("userId", "status");
CREATE INDEX IF NOT EXISTS "idx_onboarding_steps_user" ON "onboardingSteps" ("userId");
CREATE INDEX IF NOT EXISTS "idx_user_relations_parent" ON "userRelations" ("parentId");
CREATE INDEX IF NOT EXISTS "idx_user_relations_child" ON "userRelations" ("childId");
CREATE INDEX IF NOT EXISTS "idx_schedule_templates_day" ON "scheduleTemplates" ("dayOfWeek", "isActive");
