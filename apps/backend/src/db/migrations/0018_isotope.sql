CREATE TABLE `log_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`step` integer NOT NULL,
	`variant_label` text,
	`body` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `IDX_log_templates_user_step` ON `log_templates` (`created_by`,`step`);--> statement-breakpoint
CREATE UNIQUE INDEX `UNQ_log_templates_user_step_variant` ON `log_templates` (`created_by`,`step`,`variant_label`);--> statement-breakpoint
CREATE TABLE `role_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`labels` text DEFAULT '[]' NOT NULL,
	`default_label` text,
	`is_customized` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `UNQ_role_types_created_by` ON `role_types` (`created_by`);--> statement-breakpoint
ALTER TABLE `jobs` ADD `role_type` text;