ALTER TABLE `log_templates` RENAME TO `message_templates`;
--> statement-breakpoint
DROP INDEX `IDX_log_templates_user_step`;
--> statement-breakpoint
DROP INDEX `UNQ_log_templates_user_step_variant`;
--> statement-breakpoint
CREATE INDEX `IDX_message_templates_user_step` ON `message_templates` (`created_by`,`step`);
--> statement-breakpoint
CREATE UNIQUE INDEX `UNQ_message_templates_user_step_variant` ON `message_templates` (`created_by`,`step`,`variant_label`);
