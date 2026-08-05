CREATE TABLE `saved_filters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`name` text NOT NULL,
	`entity_type` integer NOT NULL,
	`criteria` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `IDX_saved_filters_created_by` ON `saved_filters` (`created_by`);--> statement-breakpoint
CREATE INDEX `IDX_saved_filters_entity_type` ON `saved_filters` (`created_by`,`entity_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `UNQ_saved_filters_name` ON `saved_filters` (`created_by`,`entity_type`,`name`);