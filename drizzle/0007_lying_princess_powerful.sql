CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('present','absent','excused','late') NOT NULL DEFAULT 'present',
	`notes` text,
	`markedBy` int NOT NULL,
	`markedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
