DROP INDEX `UNQ_jobs_url`;--> statement-breakpoint
CREATE UNIQUE INDEX `UNQ_jobs_url_created_by` ON `jobs` (`url`,`created_by`);