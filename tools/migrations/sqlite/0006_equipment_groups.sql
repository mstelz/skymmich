CREATE TABLE `equipment_groups` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `equipment_group_members` (
	`id` integer PRIMARY KEY NOT NULL,
	`group_id` integer NOT NULL,
	`equipment_id` integer NOT NULL,
	`created_at` integer NOT NULL
);
