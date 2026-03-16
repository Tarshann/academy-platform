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
