-- Add deviceId column for multi-device push notification support
ALTER TABLE "pushSubscriptions" ADD COLUMN IF NOT EXISTS "deviceId" VARCHAR(255);

-- Create index for the (userId, deviceId) upsert pattern
CREATE UNIQUE INDEX IF NOT EXISTS "push_sub_user_device_idx"
  ON "pushSubscriptions" ("userId", "deviceId")
  WHERE "deviceId" IS NOT NULL;
