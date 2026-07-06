DROP INDEX `IDX_tasks_created_by`;--> statement-breakpoint
CREATE INDEX `IDX_tasks_created_by_due_at` ON `tasks` (`created_by`,`due_at`);