-- Add viewCount to galleryPhotos for engagement tracking
ALTER TABLE "galleryPhotos" ADD COLUMN IF NOT EXISTS "viewCount" integer DEFAULT 0;
