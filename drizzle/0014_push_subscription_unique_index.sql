-- Migration: Add unique index on pushSubscriptions(userId, deviceId) for safe upserts
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pushSubscriptions_user_device"
  ON "pushSubscriptions" ("userId", "deviceId");
