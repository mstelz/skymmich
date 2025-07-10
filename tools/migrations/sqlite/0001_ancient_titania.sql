CREATE TABLE `admin_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_settings_key_unique` ON `admin_settings` (`key`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`acknowledged` integer DEFAULT false,
	`created_at` text
);
