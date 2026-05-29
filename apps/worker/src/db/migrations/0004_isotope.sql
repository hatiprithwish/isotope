CREATE TABLE `frameworks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`type` integer NOT NULL,
	`content` text NOT NULL,
	`form_inputs` text,
	`version` integer NOT NULL,
	`is_customized` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_frameworks_created_by` ON `frameworks` (`created_by`,`type`,`version`);