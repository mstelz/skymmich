CREATE TABLE `astrophotography_images` (
	`id` integer PRIMARY KEY NOT NULL,
	`immich_id` text,
	`title` text NOT NULL,
	`filename` text NOT NULL,
	`thumbnail_url` text,
	`full_url` text,
	`capture_date` text,
	`focal_length` real,
	`aperture` text,
	`iso` integer,
	`exposure_time` text,
	`frame_count` integer,
	`total_integration_hours` real,
	`telescope` text,
	`camera` text,
	`mount` text,
	`filters` text,
	`latitude` real,
	`longitude` real,
	`altitude` real,
	`plate_solved` integer DEFAULT false,
	`ra` text,
	`dec` text,
	`pixel_scale` real,
	`field_of_view` text,
	`rotation` real,
	`astrometry_job_id` text,
	`tags` text,
	`object_type` text,
	`constellation` text,
	`description` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `astrophotography_images_immich_id_unique` ON `astrophotography_images` (`immich_id`);--> statement-breakpoint
CREATE TABLE `equipment` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`specifications` text,
	`image_url` text,
	`description` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `image_equipment` (
	`id` integer PRIMARY KEY NOT NULL,
	`image_id` integer,
	`equipment_id` integer,
	`settings` text,
	`notes` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `plate_solving_jobs` (
	`id` integer PRIMARY KEY NOT NULL,
	`image_id` integer,
	`astrometry_submission_id` text,
	`astrometry_job_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_at` text,
	`completed_at` text,
	`result` text
);
