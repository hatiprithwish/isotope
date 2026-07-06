CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`contact_id` integer,
	`title` text NOT NULL,
	`due_at` text NOT NULL,
	`status` integer NOT NULL,
	`note` text,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `IDX_tasks_created_by` ON `tasks` (`created_by`);--> statement-breakpoint
CREATE INDEX `IDX_tasks_contact_id` ON `tasks` (`contact_id`);--> statement-breakpoint
CREATE INDEX `IDX_tasks_due_at` ON `tasks` (`due_at`);