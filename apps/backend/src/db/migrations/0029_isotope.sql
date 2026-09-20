ALTER TABLE `companies` DROP COLUMN `failed_at`;--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `retry_count`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `failed_at`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `retry_count`;--> statement-breakpoint
ALTER TABLE `jobs` DROP COLUMN `match_score`;