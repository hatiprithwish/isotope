-- 0020_isotope.sql added tasks.channel with a temporary `DEFAULT 'email'` — required only to
-- satisfy SQLite's NOT NULL constraint on ALTER TABLE ADD COLUMN against the 93 existing rows,
-- which were then backfilled with real per-contact channel values. tables.ts never declared that
-- default, so the live column has silently drifted from schema.ts ever since — a future insert
-- that omits channel would be masked by 'email' instead of failing loud. SQLite has no ALTER
-- COLUMN DROP DEFAULT, so this rebuilds the table via the standard drizzle-kit __new_ pattern to
-- bring the live column back in line with the notNull()-no-default declaration in tables.ts.
CREATE TABLE `__new_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` text NOT NULL,
	`contact_id` integer,
	`title` text NOT NULL,
	`due_at` text NOT NULL,
	`status` integer NOT NULL,
	`note` text,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text,
	`step_number` integer,
	`paused_at` text,
	`channel` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "created_by", "contact_id", "title", "due_at", "status", "note", "completed_at", "created_at", "updated_at", "step_number", "paused_at", "channel")
SELECT "id", "created_by", "contact_id", "title", "due_at", "status", "note", "completed_at", "created_at", "updated_at", "step_number", "paused_at", "channel" FROM `tasks`;
--> statement-breakpoint
DROP TABLE `tasks`;
--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;
--> statement-breakpoint
CREATE INDEX `IDX_tasks_created_by_due_at` ON `tasks` (`created_by`,`due_at`);
--> statement-breakpoint
CREATE INDEX `IDX_tasks_contact_id_channel` ON `tasks` (`contact_id`,`channel`);
--> statement-breakpoint
CREATE INDEX `IDX_tasks_due_at` ON `tasks` (`due_at`);
