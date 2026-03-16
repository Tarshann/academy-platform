-- Migration: Add unique index on pushSubscriptions(userId, deviceId) for safe upserts

-- Step 1: Remove duplicate (userId, deviceId) rows, keeping only the most recently updated
DELETE FROM "pushSubscriptions" a
  USING "pushSubscriptions" b
  WHERE a."userId" = b."userId"
    AND a."deviceId" = b."deviceId"
    AND a."deviceId" IS NOT NULL
    AND a.id < b.id;

-- Step 2: Partial unique index — only enforced where deviceId IS NOT NULL.
-- Web Push subscriptions (deviceId = NULL) are excluded since NULL != NULL in indexes.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pushSubscriptions_user_device"
  ON "pushSubscriptions" ("userId", "deviceId")
  WHERE "deviceId" IS NOT NULL;

-- Step 3: Remove duplicate endpoint rows for web push, keeping most recent
DELETE FROM "pushSubscriptions" a
  USING "pushSubscriptions" b
  WHERE a."endpoint" = b."endpoint"
    AND a."endpoint" IS NOT NULL
    AND a.id < b.id;

-- Step 4: Create unique index on endpoint for web push atomic upserts
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pushSubscriptions_endpoint"
  ON "pushSubscriptions" ("endpoint")
  WHERE "endpoint" IS NOT NULL;
