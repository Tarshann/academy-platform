-- Create missing DM/messaging tables for PostgreSQL (Neon)
-- These were previously only defined in MySQL-syntax migrations

-- Create the messaging_role enum type
DO $$ BEGIN
  CREATE TYPE "messaging_role" AS ENUM('parent', 'athlete', 'coach', 'staff', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- DM Conversations table
CREATE TABLE IF NOT EXISTS "dmConversations" (
  "id" serial PRIMARY KEY NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  "lastMessageAt" timestamp
);

-- DM Participants table
CREATE TABLE IF NOT EXISTS "dmParticipants" (
  "id" serial PRIMARY KEY NOT NULL,
  "conversationId" integer NOT NULL,
  "userId" integer NOT NULL,
  "lastReadAt" timestamp,
  "isMuted" boolean DEFAULT false NOT NULL,
  "mutedUntil" timestamp,
  "isArchived" boolean DEFAULT false NOT NULL,
  "joinedAt" timestamp DEFAULT now() NOT NULL
);

-- DM Messages table
CREATE TABLE IF NOT EXISTS "dmMessages" (
  "id" serial PRIMARY KEY NOT NULL,
  "conversationId" integer NOT NULL,
  "senderId" integer NOT NULL,
  "senderName" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "imageUrl" text,
  "isEdited" boolean DEFAULT false NOT NULL,
  "isDeleted" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- DM Read Receipts table
CREATE TABLE IF NOT EXISTS "dmReadReceipts" (
  "id" serial PRIMARY KEY NOT NULL,
  "messageId" integer NOT NULL,
  "userId" integer NOT NULL,
  "readAt" timestamp DEFAULT now() NOT NULL
);

-- User Blocks table
CREATE TABLE IF NOT EXISTS "userBlocks" (
  "id" serial PRIMARY KEY NOT NULL,
  "blockerId" integer NOT NULL,
  "blockedId" integer NOT NULL,
  "reason" text,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- User Messaging Roles table
CREATE TABLE IF NOT EXISTS "userMessagingRoles" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL UNIQUE,
  "messagingRole" "messaging_role" DEFAULT 'parent' NOT NULL,
  "canDmCoaches" boolean DEFAULT true NOT NULL,
  "canDmParents" boolean DEFAULT false NOT NULL,
  "canDmAthletes" boolean DEFAULT false NOT NULL,
  "canBroadcast" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_dmParticipants_conversationId" ON "dmParticipants" ("conversationId");
CREATE INDEX IF NOT EXISTS "idx_dmParticipants_userId" ON "dmParticipants" ("userId");
CREATE INDEX IF NOT EXISTS "idx_dmMessages_conversationId" ON "dmMessages" ("conversationId");
CREATE INDEX IF NOT EXISTS "idx_dmMessages_senderId" ON "dmMessages" ("senderId");
CREATE INDEX IF NOT EXISTS "idx_dmReadReceipts_messageId" ON "dmReadReceipts" ("messageId");
CREATE INDEX IF NOT EXISTS "idx_userBlocks_blockerId" ON "userBlocks" ("blockerId");
