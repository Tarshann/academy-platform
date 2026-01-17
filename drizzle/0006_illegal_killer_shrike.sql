CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`videoUrl` varchar(500) NOT NULL,
	`thumbnailUrl` varchar(500),
	`category` enum('drills','technique','conditioning','games','other') NOT NULL DEFAULT 'other',
	`duration` int,
	`isPublished` int NOT NULL DEFAULT 0,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
