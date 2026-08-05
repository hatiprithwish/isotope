CREATE TABLE `status_change_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`from_status` integer,
	`to_status` integer NOT NULL,
	`note` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `IDX_status_change_notes_entity` ON `status_change_notes` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `IDX_status_change_notes_created_by` ON `status_change_notes` (`created_by`);