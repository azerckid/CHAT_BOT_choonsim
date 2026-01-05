CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `AgentExecution` (
	`id` text PRIMARY KEY NOT NULL,
	`messageId` text NOT NULL,
	`agentName` text NOT NULL,
	`intent` text NOT NULL,
	`promptTokens` integer DEFAULT 0 NOT NULL,
	`completionTokens` integer DEFAULT 0 NOT NULL,
	`totalTokens` integer DEFAULT 0 NOT NULL,
	`rawOutput` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Bookmark` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`tweetId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`collectionId` text
);
--> statement-breakpoint
CREATE TABLE `BookmarkCollection` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Character` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`bio` text NOT NULL,
	`personaPrompt` text NOT NULL,
	`greetingMessage` text,
	`isOnline` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `CharacterMedia` (
	`id` text PRIMARY KEY NOT NULL,
	`characterId` text NOT NULL,
	`url` text NOT NULL,
	`type` text NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `CharacterMedia_characterId_type_idx` ON `CharacterMedia` (`characterId`,`type`);--> statement-breakpoint
CREATE TABLE `CharacterStat` (
	`id` text PRIMARY KEY NOT NULL,
	`characterId` text NOT NULL,
	`totalHearts` integer DEFAULT 0 NOT NULL,
	`totalUniqueGivers` integer DEFAULT 0 NOT NULL,
	`currentEmotion` text DEFAULT 'JOY',
	`emotionExpiresAt` integer,
	`lastGiftAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `CharacterStat_characterId_unique` ON `CharacterStat` (`characterId`);--> statement-breakpoint
CREATE INDEX `CharacterStat_totalHearts_idx` ON `CharacterStat` (`totalHearts`);--> statement-breakpoint
CREATE TABLE `Conversation` (
	`id` text PRIMARY KEY NOT NULL,
	`characterId` text DEFAULT 'chunsim' NOT NULL,
	`title` text NOT NULL,
	`userId` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `DMConversation` (
	`id` text PRIMARY KEY NOT NULL,
	`isGroup` integer DEFAULT false NOT NULL,
	`groupName` text,
	`lastMessageAt` integer DEFAULT (unixepoch()) NOT NULL,
	`isAccepted` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `DMParticipant` (
	`id` text PRIMARY KEY NOT NULL,
	`conversationId` text NOT NULL,
	`userId` text NOT NULL,
	`joinedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`leftAt` integer,
	`isAdmin` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `DirectMessage` (
	`id` text PRIMARY KEY NOT NULL,
	`conversationId` text NOT NULL,
	`senderId` text NOT NULL,
	`content` text NOT NULL,
	`isRead` integer DEFAULT false NOT NULL,
	`deletedBySender` integer DEFAULT false NOT NULL,
	`deletedByReceiver` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL,
	`mediaUrl` text,
	`mediaType` text
);
--> statement-breakpoint
CREATE TABLE `FanPost` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`content` text NOT NULL,
	`imageUrl` text,
	`likes` integer DEFAULT 0 NOT NULL,
	`isApproved` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Follow` (
	`id` text PRIMARY KEY NOT NULL,
	`followerId` text NOT NULL,
	`followingId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`status` text DEFAULT 'ACCEPTED'
);
--> statement-breakpoint
CREATE TABLE `GiftLog` (
	`id` text PRIMARY KEY NOT NULL,
	`fromUserId` text NOT NULL,
	`toCharacterId` text NOT NULL,
	`itemId` text NOT NULL,
	`amount` integer NOT NULL,
	`message` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `GiftLog_fromUserId_createdAt_idx` ON `GiftLog` (`fromUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `GiftLog_toCharacterId_createdAt_idx` ON `GiftLog` (`toCharacterId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `Item` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`priceCredits` integer,
	`priceUSD` real,
	`priceKRW` real,
	`iconUrl` text,
	`description` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `Item_isActive_idx` ON `Item` (`isActive`);--> statement-breakpoint
CREATE TABLE `Like` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`tweetId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Media` (
	`id` text PRIMARY KEY NOT NULL,
	`tweetId` text NOT NULL,
	`type` text NOT NULL,
	`url` text NOT NULL,
	`thumbnailUrl` text,
	`altText` text,
	`order` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`publicId` text
);
--> statement-breakpoint
CREATE TABLE `Message` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`conversationId` text NOT NULL,
	`mediaUrl` text,
	`mediaType` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`type` text DEFAULT 'TEXT' NOT NULL,
	`senderId` text,
	`roomId` text,
	`read` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `MessageLike` (
	`id` text PRIMARY KEY NOT NULL,
	`messageId` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `MessageLike_messageId_userId_unique` ON `MessageLike` (`messageId`,`userId`);--> statement-breakpoint
CREATE TABLE `Mission` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`rewardCredits` integer DEFAULT 0 NOT NULL,
	`type` text DEFAULT 'DAILY' NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Notice` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`type` text DEFAULT 'NOTICE' NOT NULL,
	`imageUrl` text,
	`isActive` integer DEFAULT true NOT NULL,
	`isPinned` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Payment` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`description` text,
	`creditsGranted` integer,
	`metadata` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL,
	`transactionId` text,
	`subscriptionId` text,
	`paymentKey` text,
	`txHash` text,
	`walletAddress` text,
	`cryptoCurrency` text,
	`cryptoAmount` real,
	`exchangeRate` real,
	`blockNumber` text,
	`confirmations` integer DEFAULT 0,
	`network` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Payment_transactionId_unique` ON `Payment` (`transactionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `Payment_txHash_unique` ON `Payment` (`txHash`);--> statement-breakpoint
CREATE INDEX `Payment_userId_createdAt_idx` ON `Payment` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `Payment_transactionId_idx` ON `Payment` (`transactionId`);--> statement-breakpoint
CREATE INDEX `Payment_subscriptionId_idx` ON `Payment` (`subscriptionId`);--> statement-breakpoint
CREATE INDEX `Payment_txHash_idx` ON `Payment` (`txHash`);--> statement-breakpoint
CREATE INDEX `Payment_provider_status_idx` ON `Payment` (`provider`,`status`);--> statement-breakpoint
CREATE INDEX `Payment_type_idx` ON `Payment` (`type`);--> statement-breakpoint
CREATE TABLE `Retweet` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`tweetId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `SystemLog` (
	`id` text PRIMARY KEY NOT NULL,
	`level` text DEFAULT 'INFO' NOT NULL,
	`category` text DEFAULT 'SYSTEM' NOT NULL,
	`message` text NOT NULL,
	`stackTrace` text,
	`metadata` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `TravelPlan` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`startDate` integer,
	`endDate` integer,
	`status` text DEFAULT 'PLANNING' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `TravelPlanItem` (
	`id` text PRIMARY KEY NOT NULL,
	`travelPlanId` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`date` integer,
	`time` text,
	`locationName` text,
	`latitude` real,
	`longitude` real,
	`order` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL,
	`status` text DEFAULT 'TODO'
);
--> statement-breakpoint
CREATE TABLE `TravelTag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Tweet` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`content` text NOT NULL,
	`parentId` text,
	`isRetweet` integer DEFAULT false NOT NULL,
	`originalTweetId` text,
	`deletedAt` integer,
	`locationName` text,
	`latitude` real,
	`longitude` real,
	`address` text,
	`travelDate` integer,
	`country` text,
	`city` text,
	`travelPlanId` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL,
	`visibility` text DEFAULT 'PUBLIC'
);
--> statement-breakpoint
CREATE TABLE `TweetEmbedding` (
	`id` text PRIMARY KEY NOT NULL,
	`tweetId` text NOT NULL,
	`vector` blob NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `TweetEmbedding_tweetId_unique` ON `TweetEmbedding` (`tweetId`);--> statement-breakpoint
CREATE TABLE `TweetTravelTag` (
	`id` text PRIMARY KEY NOT NULL,
	`tweetId` text NOT NULL,
	`travelTagId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text,
	`name` text,
	`image` text,
	`provider` text DEFAULT 'local' NOT NULL,
	`snsId` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`avatarUrl` text,
	`status` text DEFAULT 'OFFLINE' NOT NULL,
	`bio` text,
	`coverImage` text,
	`isPrivate` integer DEFAULT false,
	`checkInTime` text,
	`pushSubscription` text,
	`subscriptionTier` text DEFAULT 'FREE',
	`subscriptionStatus` text,
	`subscriptionId` text,
	`currentPeriodEnd` integer,
	`lastTokenRefillAt` integer,
	`credits` integer DEFAULT 100 NOT NULL,
	`role` text DEFAULT 'USER'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_subscriptionId_unique` ON `User` (`subscriptionId`);--> statement-breakpoint
CREATE TABLE `UserInventory` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`itemId` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `UserInventory_userId_itemId_unique` ON `UserInventory` (`userId`,`itemId`);--> statement-breakpoint
CREATE TABLE `UserMission` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`missionId` text NOT NULL,
	`status` text DEFAULT 'IN_PROGRESS' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`lastUpdated` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `UserMission_userId_missionId_unique` ON `UserMission` (`userId`,`missionId`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
