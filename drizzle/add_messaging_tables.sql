-- DM Conversations table
CREATE TABLE IF NOT EXISTS `dmConversations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastMessageAt` timestamp,
  CONSTRAINT `dmConversations_id` PRIMARY KEY(`id`)
);

-- DM Participants table
CREATE TABLE IF NOT EXISTS `dmParticipants` (
  `id` int AUTO_INCREMENT NOT NULL,
  `conversationId` int NOT NULL,
  `userId` int NOT NULL,
  `lastReadAt` timestamp,
  `isMuted` boolean NOT NULL DEFAULT false,
  `mutedUntil` timestamp,
  `isArchived` boolean NOT NULL DEFAULT false,
  `joinedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `dmParticipants_id` PRIMARY KEY(`id`)
);

-- DM Messages table
CREATE TABLE IF NOT EXISTS `dmMessages` (
  `id` int AUTO_INCREMENT NOT NULL,
  `conversationId` int NOT NULL,
  `senderId` int NOT NULL,
  `senderName` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `isEdited` boolean NOT NULL DEFAULT false,
  `isDeleted` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `dmMessages_id` PRIMARY KEY(`id`)
);

-- DM Read Receipts table
CREATE TABLE IF NOT EXISTS `dmReadReceipts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `messageId` int NOT NULL,
  `userId` int NOT NULL,
  `readAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `dmReadReceipts_id` PRIMARY KEY(`id`)
);

-- User Blocks table
CREATE TABLE IF NOT EXISTS `userBlocks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `blockerId` int NOT NULL,
  `blockedId` int NOT NULL,
  `reason` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `userBlocks_id` PRIMARY KEY(`id`)
);

-- User Messaging Roles table
CREATE TABLE IF NOT EXISTS `userMessagingRoles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `messagingRole` enum('parent', 'athlete', 'coach', 'staff', 'admin') NOT NULL DEFAULT 'parent',
  `canDmCoaches` boolean NOT NULL DEFAULT true,
  `canDmParents` boolean NOT NULL DEFAULT false,
  `canDmAthletes` boolean NOT NULL DEFAULT false,
  `canBroadcast` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `userMessagingRoles_id` PRIMARY KEY(`id`),
  CONSTRAINT `userMessagingRoles_userId_unique` UNIQUE(`userId`)
);

-- Push Subscriptions table
CREATE TABLE IF NOT EXISTS `pushSubscriptions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `endpoint` text NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `userAgent` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pushSubscriptions_id` PRIMARY KEY(`id`)
);

-- Notification Settings table
CREATE TABLE IF NOT EXISTS `notificationSettings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `pushEnabled` boolean NOT NULL DEFAULT false,
  `emailFallback` boolean NOT NULL DEFAULT true,
  `dmNotifications` boolean NOT NULL DEFAULT true,
  `channelNotifications` boolean NOT NULL DEFAULT true,
  `mentionNotifications` boolean NOT NULL DEFAULT true,
  `announcementNotifications` boolean NOT NULL DEFAULT true,
  `quietHoursEnabled` boolean NOT NULL DEFAULT false,
  `quietHoursStart` varchar(5),
  `quietHoursEnd` varchar(5),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `notificationSettings_id` PRIMARY KEY(`id`),
  CONSTRAINT `notificationSettings_userId_unique` UNIQUE(`userId`)
);

-- Notification Logs table
CREATE TABLE IF NOT EXISTS `notificationLogs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `notificationType` enum('push', 'email') NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text,
  `data` text,
  `notificationStatus` enum('pending', 'sent', 'failed', 'clicked') NOT NULL DEFAULT 'pending',
  `sentAt` timestamp,
  `clickedAt` timestamp,
  `errorMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `notificationLogs_id` PRIMARY KEY(`id`)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS `idx_dmParticipants_conversationId` ON `dmParticipants` (`conversationId`);
CREATE INDEX IF NOT EXISTS `idx_dmParticipants_userId` ON `dmParticipants` (`userId`);
CREATE INDEX IF NOT EXISTS `idx_dmMessages_conversationId` ON `dmMessages` (`conversationId`);
CREATE INDEX IF NOT EXISTS `idx_dmMessages_senderId` ON `dmMessages` (`senderId`);
CREATE INDEX IF NOT EXISTS `idx_dmReadReceipts_messageId` ON `dmReadReceipts` (`messageId`);
CREATE INDEX IF NOT EXISTS `idx_userBlocks_blockerId` ON `userBlocks` (`blockerId`);
CREATE INDEX IF NOT EXISTS `idx_pushSubscriptions_userId` ON `pushSubscriptions` (`userId`);
CREATE INDEX IF NOT EXISTS `idx_notificationLogs_userId` ON `notificationLogs` (`userId`);
