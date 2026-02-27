-- Add imageUrl column to dmMessages for native image support in DMs
ALTER TABLE "dmMessages" ADD COLUMN "imageUrl" text;
