CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`industry` text,
	`size` text,
	`location` text,
	`is_salary_match` integer,
	`is_location_match` integer,
	`is_ethics_compliant` integer,
	`ethics_notes` text,
	`weighted_score` integer,
	`fit_band` integer,
	`ai_summary` text,
	`user_context` text,
	`notes` text,
	`status` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `IDX_companies_created_by` ON `companies` (`created_by`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
INSERT INTO `__new_notes`("id", "created_by", "title", "body", "created_at", "updated_at") SELECT "id", "created_by", "title", "body", "created_at", "updated_at" FROM `notes`;--> statement-breakpoint
DROP TABLE `notes`;--> statement-breakpoint
ALTER TABLE `__new_notes` RENAME TO `notes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `IDX_notes_created_by` ON `notes` (`created_by`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clerk_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "clerk_id", "email", "role", "created_at", "updated_at") SELECT "id", "clerk_id", "email", "role", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `UNQ_users_clerk_id` ON `users` (`clerk_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `UNQ_users_email` ON `users` (`email`);

CREATE TABLE `contact_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`contact_id` integer NOT NULL,
	`type` text NOT NULL,
	`channel` text NOT NULL,
	`subject` text,
	`body` text NOT NULL,
	`sequence_position` integer,
	`ab_variable` text,
	`ab_variant` text,
	`sent_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `IDX_contact_history_contact_id` ON `contact_history` (`contact_id`);--> statement-breakpoint
CREATE INDEX `IDX_contact_history_created_by` ON `contact_history` (`created_by`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`company_id` integer NOT NULL,
	`job_id` integer,
	`name` text NOT NULL,
	`designation` text,
	`email` text,
	`linkedin_url` text,
	`linkedin_connected` integer,
	`sequence_position` integer,
	`last_touch_at` text,
	`next_touch_due_at` text,
	`dead_at` text,
	`re_engage_at` text,
	`ab_variable` text,
	`ab_variant` text,
	`ab_replied` integer,
	`status` integer NOT NULL,
	`draft_body` text,
	`draft_subject` text,
	`personalization_notes` text,
	`manual_personalization_notes` text,
	`reengagement_recommendation` text,
	`source` integer,
	`notes` text,
	`failed_at` text,
	`retry_count` integer,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `IDX_contacts_created_by` ON `contacts` (`created_by`);--> statement-breakpoint
CREATE INDEX `IDX_contacts_company_id` ON `contacts` (`company_id`);