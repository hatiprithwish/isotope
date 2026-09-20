UPDATE `saved_filters` SET `criteria` = json_remove(`criteria`, '$.fitBands') WHERE json_valid(`criteria`) AND json_extract(`criteria`, '$.fitBands') IS NOT NULL;--> statement-breakpoint
DELETE FROM `saved_filters` WHERE `criteria` = '{}';--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `is_salary_match`;--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `is_location_match`;--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `is_ethics_compliant`;--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `ethics_notes`;--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `weighted_score`;--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `fit_band`;--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `ai_summary`;--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `user_context`;--> statement-breakpoint
ALTER TABLE `contact_history` DROP COLUMN `ab_variable`;--> statement-breakpoint
ALTER TABLE `contact_history` DROP COLUMN `ab_variant`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `sequence_position`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `ab_variable`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `ab_variant`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `ab_replied`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `draft_body`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `draft_subject`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `personalization_notes`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `manual_personalization_notes`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `reengagement_recommendation`;