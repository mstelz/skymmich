CREATE TABLE `locations` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`altitude` real,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_astrophotography_images` (
	`id` integer PRIMARY KEY NOT NULL,
	`immich_id` text,
	`title` text NOT NULL,
	`filename` text NOT NULL,
	`thumbnail_url` text,
	`full_url` text,
	`capture_date` integer,
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
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_astrophotography_images`("id", "immich_id", "title", "filename", "thumbnail_url", "full_url", "capture_date", "focal_length", "aperture", "iso", "exposure_time", "frame_count", "total_integration_hours", "telescope", "camera", "mount", "filters", "latitude", "longitude", "altitude", "plate_solved", "ra", "dec", "pixel_scale", "field_of_view", "rotation", "astrometry_job_id", "tags", "object_type", "constellation", "description", "created_at", "updated_at") SELECT "id", "immich_id", "title", "filename", "thumbnail_url", "full_url", "capture_date", "focal_length", "aperture", "iso", "exposure_time", "frame_count", "total_integration_hours", "telescope", "camera", "mount", "filters", "latitude", "longitude", "altitude", "plate_solved", "ra", "dec", "pixel_scale", "field_of_view", "rotation", "astrometry_job_id", "tags", "object_type", "constellation", "description", "created_at", "updated_at" FROM `astrophotography_images`;--> statement-breakpoint
DROP TABLE `astrophotography_images`;--> statement-breakpoint
ALTER TABLE `__new_astrophotography_images` RENAME TO `astrophotography_images`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `astrophotography_images_immich_id_unique` ON `astrophotography_images` (`immich_id`);--> statement-breakpoint
CREATE TABLE `__new_equipment` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`specifications` text,
	`image_url` text,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_equipment`("id", "name", "type", "specifications", "image_url", "description", "created_at", "updated_at") SELECT "id", "name", "type", "specifications", "image_url", "description", "created_at", "updated_at" FROM `equipment`;--> statement-breakpoint
DROP TABLE `equipment`;--> statement-breakpoint
ALTER TABLE `__new_equipment` RENAME TO `equipment`;--> statement-breakpoint
CREATE TABLE `__new_image_equipment` (
	`id` integer PRIMARY KEY NOT NULL,
	`image_id` integer,
	`equipment_id` integer,
	`settings` text,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_image_equipment`("id", "image_id", "equipment_id", "settings", "notes", "created_at") SELECT "id", "image_id", "equipment_id", "settings", "notes", "created_at" FROM `image_equipment`;--> statement-breakpoint
DROP TABLE `image_equipment`;--> statement-breakpoint
ALTER TABLE `__new_image_equipment` RENAME TO `image_equipment`;--> statement-breakpoint
CREATE TABLE `__new_notifications` (
	`id` integer PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`acknowledged` integer DEFAULT false,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_notifications`("id", "type", "title", "message", "details", "acknowledged", "created_at") SELECT "id", "type", "title", "message", "details", "acknowledged", "created_at" FROM `notifications`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
ALTER TABLE `__new_notifications` RENAME TO `notifications`;--> statement-breakpoint
CREATE TABLE `__new_plate_solving_jobs` (
	`id` integer PRIMARY KEY NOT NULL,
	`image_id` integer,
	`astrometry_submission_id` text,
	`astrometry_job_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_at` integer NOT NULL,
	`completed_at` integer,
	`result` text
);
--> statement-breakpoint
INSERT INTO `__new_plate_solving_jobs`("id", "image_id", "astrometry_submission_id", "astrometry_job_id", "status", "submitted_at", "completed_at", "result") SELECT "id", "image_id", "astrometry_submission_id", "astrometry_job_id", "status", "submitted_at", "completed_at", "result" FROM `plate_solving_jobs`;--> statement-breakpoint
DROP TABLE `plate_solving_jobs`;--> statement-breakpoint
ALTER TABLE `__new_plate_solving_jobs` RENAME TO `plate_solving_jobs`;