CREATE TABLE `job_search_frameworks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`target_roles` text DEFAULT '[]' NOT NULL,
	`is_remote` integer DEFAULT false NOT NULL,
	`required_skills` text DEFAULT '[]' NOT NULL,
	`skills` text DEFAULT '[]' NOT NULL,
	`min_salary_lpa` real DEFAULT 10 NOT NULL,
	`min_exp` real DEFAULT 2 NOT NULL,
	`max_exp` real DEFAULT 5 NOT NULL,
	`preferred_locations` text DEFAULT '[]' NOT NULL,
	`recency_window` integer DEFAULT 7 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_customized` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_job_fw_user` ON `job_search_frameworks` (`created_by`,`version`);--> statement-breakpoint
DROP TABLE `frameworks`;