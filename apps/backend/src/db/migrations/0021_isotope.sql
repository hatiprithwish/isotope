-- Data-only fix for 0020_isotope.sql: that migration added tasks.channel and backfilled the
-- single pre-existing task per contact with whichever channel most recently drove it. For contacts
-- with dual-channel sent history, the *other* channel's sequence was left with no task row at all
-- under the new channel-scoped sync logic. This backfills the missing Pending task for exactly the
-- contacts manually verified against staging (see PR discussion) — scoped by id only, no other
-- literal contact data — computing every column from existing tables the same way 0020 derived its
-- backfill, mirroring TasksDAL.syncFollowUpForContact's insert shape:
--   stepNumber = count of that channel's sent messages so far
--   dueAt      = last sent-on-that-channel date + the user's current step_offset_days[stepNumber-1]
--   title      = "Follow up with " || contact name
-- Scoped to contacts with no existing task row (any status) for the missing channel, so this is
-- safe to re-run and a no-op once applied.
INSERT INTO `tasks` (`created_by`, `contact_id`, `channel`, `title`, `due_at`, `status`, `step_number`, `paused_at`, `note`, `completed_at`, `created_at`, `updated_at`)
SELECT
  c.created_by,
  cs.contact_id,
  cs.channel,
  'Follow up with ' || c.name,
  date(cs.last_sent_at, '+' || json_extract(ls.step_offset_days, '$[' || (cs.sent_count - 1) || ']') || ' days'),
  1,
  cs.sent_count,
  NULL,
  NULL,
  NULL,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  NULL
FROM (
  SELECT m.contact_id, m.channel, COUNT(ch.id) AS sent_count, MAX(ch.sent_at) AS last_sent_at
  FROM (
    SELECT DISTINCT ch.contact_id, ch.channel
    FROM contact_history ch
    WHERE ch.contact_id IN (6, 26, 77, 89, 90, 92, 94, 102, 110, 119)
      AND ch.type IN ('email_sent', 'linkedin_sent')
      AND NOT EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.contact_id = ch.contact_id AND t.channel = ch.channel
      )
  ) m
  JOIN contact_history ch
    ON ch.contact_id = m.contact_id
   AND ch.channel = m.channel
   AND ch.type IN ('email_sent', 'linkedin_sent')
  GROUP BY m.contact_id, m.channel
) cs
JOIN contacts c ON c.id = cs.contact_id
JOIN (
  SELECT fs.created_by, fs.step_offset_days
  FROM followup_settings fs
  WHERE fs.version = (SELECT MAX(fs2.version) FROM followup_settings fs2 WHERE fs2.created_by = fs.created_by)
) ls ON ls.created_by = c.created_by;
