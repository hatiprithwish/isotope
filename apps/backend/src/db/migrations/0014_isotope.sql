CREATE TABLE `followup_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`step_offset_days` text DEFAULT '[]' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_customized` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_followup_settings_user` ON `followup_settings` (`created_by`,`version`);--> statement-breakpoint
ALTER TABLE `tasks` ADD `step_number` integer;--> statement-breakpoint
ALTER TABLE `tasks` ADD `paused_at` text;