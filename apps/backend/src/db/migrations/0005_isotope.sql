CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status` integer NOT NULL,
	`title` text NOT NULL,
	`company_id` integer,
	`url` text,
	`location` text,
	`salary` text,
	`source` text,
	`type` integer NOT NULL,
	`description` text,
	`skills` text,
	`created_by` text NOT NULL,
	`match_score` real,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `UNQ_jobs_url` ON `jobs` (`url`);--> statement-breakpoint
CREATE INDEX `IDX_jobs_created_by` ON `jobs` (`created_by`);--> statement-breakpoint
CREATE INDEX `IDX_jobs_company_id` ON `jobs` (`company_id`);