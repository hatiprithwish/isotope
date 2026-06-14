CREATE TABLE `browser_run_budget` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`used_seconds` real DEFAULT 0 NOT NULL,
	`reset_at` text NOT NULL,
	`updated_at` text
);
