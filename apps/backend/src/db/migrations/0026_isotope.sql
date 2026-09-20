DELETE FROM `search_index` WHERE entity_type = 'note';--> statement-breakpoint
DROP TRIGGER IF EXISTS `notes_search_ai`;--> statement-breakpoint
DROP TRIGGER IF EXISTS `notes_search_ad`;--> statement-breakpoint
DROP TRIGGER IF EXISTS `notes_search_au`;--> statement-breakpoint
DROP TABLE `notes`;--> statement-breakpoint
UPDATE `contacts` SET `source` = 2 WHERE `source` = 1;
