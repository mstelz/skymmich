CREATE TABLE IF NOT EXISTS `catalog_objects` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text,
	`ra` text,
	`dec` text,
	`ra_deg` real,
	`dec_deg` real,
	`constellation` text,
	`major_axis` real,
	`minor_axis` real,
	`b_mag` real,
	`v_mag` real,
	`surface_brightness` real,
	`hubble_type` text,
	`messier` text,
	`ngc_ref` text,
	`ic_ref` text,
	`common_names` text,
	`identifiers` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `catalog_objects_name_unique` ON `catalog_objects` (`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_targets` (
	`id` integer PRIMARY KEY NOT NULL,
	`catalog_name` text NOT NULL,
	`notes` text,
	`tags` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_targets_catalog_name_unique` ON `user_targets` (`catalog_name`);
