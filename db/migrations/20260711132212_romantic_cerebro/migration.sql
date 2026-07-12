CREATE TABLE `items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`category` text NOT NULL,
	`source` text NOT NULL,
	`source_id` text,
	`title` text NOT NULL,
	`image_url` text,
	`year` integer,
	`catalog_rating` real,
	`metadata` text,
	`status` text DEFAULT 'want' NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`progress` text,
	`user_rating` real,
	`notes` text,
	`added_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
