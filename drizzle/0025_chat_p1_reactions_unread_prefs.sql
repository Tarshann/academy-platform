-- P1 Chat Enhancements: Reactions, Unread Tracking, Notification Preferences
-- Migration 0025

CREATE TABLE IF NOT EXISTS "chat_message_reactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "message_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "emoji" varchar(32) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "chat_reactions_unique_idx"
  ON "chat_message_reactions" ("message_id", "user_id", "emoji");

CREATE INDEX IF NOT EXISTS "chat_reactions_message_idx"
  ON "chat_message_reactions" ("message_id");

CREATE TABLE IF NOT EXISTS "chat_room_read_status" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "room" varchar(100) NOT NULL,
  "last_read_message_id" integer NOT NULL DEFAULT 0,
  "last_read_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "chat_read_status_unique_idx"
  ON "chat_room_read_status" ("user_id", "room");

CREATE TABLE IF NOT EXISTS "chat_room_notification_prefs" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "room" varchar(100) NOT NULL,
  "mode" varchar(20) NOT NULL DEFAULT 'all',
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "chat_notif_prefs_unique_idx"
  ON "chat_room_notification_prefs" ("user_id", "room");
