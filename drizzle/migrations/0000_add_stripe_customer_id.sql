-- Migration: Add stripeCustomerId column to users table
-- Created: 2026-02-02

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeCustomerId" varchar(255);
