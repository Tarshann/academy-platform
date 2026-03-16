-- Migration 0015: Add social post sort ordering and merch drop engagement tracking
-- Created: 2026-03-16

-- Social posts: add sortOrder for drag-and-drop reordering
ALTER TABLE "socialPosts" ADD COLUMN IF NOT EXISTS "sortOrder" integer NOT NULL DEFAULT 0;

-- Merch drops: add engagement tracking columns
ALTER TABLE "merchDrops" ADD COLUMN IF NOT EXISTS "viewCount" integer NOT NULL DEFAULT 0;
ALTER TABLE "merchDrops" ADD COLUMN IF NOT EXISTS "clickCount" integer NOT NULL DEFAULT 0;

-- Index for social posts ordering
CREATE INDEX IF NOT EXISTS "idx_socialPosts_sortOrder" ON "socialPosts" ("sortOrder", "createdAt");
