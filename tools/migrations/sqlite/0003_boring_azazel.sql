CREATE TABLE `image_acquisition` (
	`id` integer PRIMARY KEY NOT NULL,
	`image_id` integer NOT NULL,
	`filter_id` integer,
	`filter_name` text,
	`frame_count` integer NOT NULL,
	`exposure_time` real NOT NULL,
	`gain` integer,
	`offset` integer,
	`binning` text,
	`sensor_temp` real,
	`date` integer,
	`notes` text,
	`created_at` integer NOT NULL
);
