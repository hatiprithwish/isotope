CREATE TABLE `log_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`is_customized` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `UNQ_log_templates_created_by` ON `log_templates` (`created_by`);