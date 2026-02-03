ALTER TABLE `videos` MODIFY COLUMN `category` enum('training','highlights') NOT NULL DEFAULT 'training';--> statement-breakpoint
ALTER TABLE `videos` ADD `url` varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE `videos` ADD `thumbnail` varchar(500);--> statement-breakpoint
ALTER TABLE `videos` ADD `platform` enum('tiktok','instagram') DEFAULT 'tiktok' NOT NULL;--> statement-breakpoint
ALTER TABLE `videos` DROP COLUMN `videoUrl`;--> statement-breakpoint
ALTER TABLE `videos` DROP COLUMN `thumbnailUrl`;--> statement-breakpoint
ALTER TABLE `videos` DROP COLUMN `duration`;