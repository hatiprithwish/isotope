DROP INDEX `IDX_tasks_contact_id`;--> statement-breakpoint
ALTER TABLE `tasks` ADD `channel` text NOT NULL DEFAULT 'email';--> statement-breakpoint
UPDATE `tasks`
SET `channel` = (
  SELECT `ch`.`channel`
  FROM `contact_history` AS `ch`
  WHERE `ch`.`contact_id` = `tasks`.`contact_id`
    AND `ch`.`type` IN ('email_sent', 'linkedin_sent')
  ORDER BY `ch`.`sent_at` DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM `contact_history` AS `ch`
  WHERE `ch`.`contact_id` = `tasks`.`contact_id`
    AND `ch`.`type` IN ('email_sent', 'linkedin_sent')
);--> statement-breakpoint
CREATE INDEX `IDX_tasks_contact_id_channel` ON `tasks` (`contact_id`,`channel`);--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `next_touch_due_at`;