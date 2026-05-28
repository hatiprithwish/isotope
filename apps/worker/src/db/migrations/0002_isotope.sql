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