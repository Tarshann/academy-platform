-- Add mediaType column to galleryPhotos for video support
ALTER TABLE "galleryPhotos" ADD COLUMN IF NOT EXISTS "mediaType" varchar(20) NOT NULL DEFAULT 'image';
