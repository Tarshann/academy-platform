-- Migration 0025: Chat P1 Bundle — Reactions, Unread Badges, Room Notification Preferences
-- Additive only. No existing tables modified.

-- Chat message reactions (emoji reactions on room messages)
CREATE TABLE IF NOT EXISTS "chat_message_reactions" (
  "id" SERIAL PRIMARY KEY,
  "message_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "emoji" VARCHAR(32) NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Unique constraint: one reaction per user per emoji per message
CREATE UNIQUE INDEX IF NOT EXISTS "chat_reactions_unique_idx"
  ON "chat_message_reactions" ("message_id", "user_id", "emoji");

-- Fast lookup: all reactions for a message
CREATE INDEX IF NOT EXISTS "chat_reactions_message_idx"
  ON "chat_message_reactions" ("message_id");

-- Chat room read status (per-user, per-room last-read tracking for unread badges)
CREATE TABLE IF NOT EXISTS "chat_room_read_status" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "room" VARCHAR(100) NOT NULL,
  "last_read_message_id" INTEGER NOT NULL DEFAULT 0,
  "last_read_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Unique constraint: one read-status record per user per room
CREATE UNIQUE INDEX IF NOT EXISTS "chat_read_status_user_room_idx"
  ON "chat_room_read_status" ("user_id", "room");

-- Chat room notification preferences (per-user, per-room override)
CREATE TABLE IF NOT EXISTS "chat_room_notification_prefs" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "room" VARCHAR(100) NOT NULL,
  "mode" VARCHAR(20) NOT NULL DEFAULT 'all',
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Unique constraint: one preference per user per room
CREATE UNIQUE INDEX IF NOT EXISTS "chat_room_prefs_user_room_idx"
  ON "chat_room_notification_prefs" ("user_id", "room");
