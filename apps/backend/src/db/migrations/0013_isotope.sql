-- Hand-written migration: drizzle-kit cannot generate FTS5 virtual tables or
-- triggers (no DSL support), so this file is authored directly rather than
-- via `pnpm db:generate`. Do not overwrite by re-running generate.
--
-- Global search index: one FTS5 table covering companies, jobs, contacts,
-- notes. entity_type/entity_id point back to the source row. created_by is
-- carried for row-level scoping (WHERE created_by = ?, not part of MATCH).
-- Sync triggers keep the index current on insert/update/delete; DALs for the
-- four source tables are untouched.
--> statement-breakpoint
CREATE VIRTUAL TABLE `search_index` USING fts5(
  `entity_type` UNINDEXED,
  `entity_id` UNINDEXED,
  `created_by` UNINDEXED,
  `title`,
  `body`,
  tokenize = 'porter unicode61 remove_diacritics 2'
);
--> statement-breakpoint
-- Companies
CREATE TRIGGER `companies_search_ai` AFTER INSERT ON `companies` BEGIN
  INSERT INTO `search_index`(entity_type, entity_id, created_by, title, body)
  VALUES ('company', new.id, new.created_by, new.name, coalesce(new.industry, '') || ' ' || coalesce(new.location, '') || ' ' || coalesce(new.notes, ''));
END;
--> statement-breakpoint
CREATE TRIGGER `companies_search_ad` AFTER DELETE ON `companies` BEGIN
  DELETE FROM `search_index` WHERE entity_type = 'company' AND entity_id = old.id;
END;
--> statement-breakpoint
CREATE TRIGGER `companies_search_au` AFTER UPDATE ON `companies` BEGIN
  DELETE FROM `search_index` WHERE entity_type = 'company' AND entity_id = old.id;
  INSERT INTO `search_index`(entity_type, entity_id, created_by, title, body)
  VALUES ('company', new.id, new.created_by, new.name, coalesce(new.industry, '') || ' ' || coalesce(new.location, '') || ' ' || coalesce(new.notes, ''));
END;
--> statement-breakpoint
-- Jobs
CREATE TRIGGER `jobs_search_ai` AFTER INSERT ON `jobs` BEGIN
  INSERT INTO `search_index`(entity_type, entity_id, created_by, title, body)
  VALUES ('job', new.id, new.created_by, new.title, coalesce(new.description, '') || ' ' || coalesce(new.skills, ''));
END;
--> statement-breakpoint
CREATE TRIGGER `jobs_search_ad` AFTER DELETE ON `jobs` BEGIN
  DELETE FROM `search_index` WHERE entity_type = 'job' AND entity_id = old.id;
END;
--> statement-breakpoint
CREATE TRIGGER `jobs_search_au` AFTER UPDATE ON `jobs` BEGIN
  DELETE FROM `search_index` WHERE entity_type = 'job' AND entity_id = old.id;
  INSERT INTO `search_index`(entity_type, entity_id, created_by, title, body)
  VALUES ('job', new.id, new.created_by, new.title, coalesce(new.description, '') || ' ' || coalesce(new.skills, ''));
END;
--> statement-breakpoint
-- Contacts
CREATE TRIGGER `contacts_search_ai` AFTER INSERT ON `contacts` BEGIN
  INSERT INTO `search_index`(entity_type, entity_id, created_by, title, body)
  VALUES ('contact', new.id, new.created_by, new.name, coalesce(new.designation, '') || ' ' || coalesce(new.email, '') || ' ' || coalesce(new.notes, ''));
END;
--> statement-breakpoint
CREATE TRIGGER `contacts_search_ad` AFTER DELETE ON `contacts` BEGIN
  DELETE FROM `search_index` WHERE entity_type = 'contact' AND entity_id = old.id;
END;
--> statement-breakpoint
CREATE TRIGGER `contacts_search_au` AFTER UPDATE ON `contacts` BEGIN
  DELETE FROM `search_index` WHERE entity_type = 'contact' AND entity_id = old.id;
  INSERT INTO `search_index`(entity_type, entity_id, created_by, title, body)
  VALUES ('contact', new.id, new.created_by, new.name, coalesce(new.designation, '') || ' ' || coalesce(new.email, '') || ' ' || coalesce(new.notes, ''));
END;
--> statement-breakpoint
-- Notes
CREATE TRIGGER `notes_search_ai` AFTER INSERT ON `notes` BEGIN
  INSERT INTO `search_index`(entity_type, entity_id, created_by, title, body)
  VALUES ('note', new.id, new.created_by, new.title, coalesce(new.body, ''));
END;
--> statement-breakpoint
CREATE TRIGGER `notes_search_ad` AFTER DELETE ON `notes` BEGIN
  DELETE FROM `search_index` WHERE entity_type = 'note' AND entity_id = old.id;
END;
--> statement-breakpoint
CREATE TRIGGER `notes_search_au` AFTER UPDATE ON `notes` BEGIN
  DELETE FROM `search_index` WHERE entity_type = 'note' AND entity_id = old.id;
  INSERT INTO `search_index`(entity_type, entity_id, created_by, title, body)
  VALUES ('note', new.id, new.created_by, new.title, coalesce(new.body, ''));
END;
--> statement-breakpoint
-- Backfill existing rows
INSERT INTO `search_index`(entity_type, entity_id, created_by, title, body)
SELECT 'company', id, created_by, name, coalesce(industry, '') || ' ' || coalesce(location, '') || ' ' || coalesce(notes, '')
FROM `companies`;
--> statement-breakpoint
INSERT INTO `search_index`(entity_type, entity_id, created_by, title, body)
SELECT 'job', id, created_by, title, coalesce(description, '') || ' ' || coalesce(skills, '')
FROM `jobs`;
--> statement-breakpoint
INSERT INTO `search_index`(entity_type, entity_id, created_by, title, body)
SELECT 'contact', id, created_by, name, coalesce(designation, '') || ' ' || coalesce(email, '') || ' ' || coalesce(notes, '')
FROM `contacts`;
--> statement-breakpoint
INSERT INTO `search_index`(entity_type, entity_id, created_by, title, body)
SELECT 'note', id, created_by, title, coalesce(body, '')
FROM `notes`;
