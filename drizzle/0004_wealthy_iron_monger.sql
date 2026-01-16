CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`room` varchar(100) NOT NULL DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
