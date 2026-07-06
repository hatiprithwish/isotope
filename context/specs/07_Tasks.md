PLAN:

- Files to create:
  packages/schemas/src/tasks/{TasksCommon.ts,TasksApiRequest.ts,TasksApiResponse.ts,TasksDALRequest.ts,index.ts}
  apps/backend/src/data-access-layer/TasksDAL.ts
  apps/backend/src/repositories/TasksRepo.ts
  apps/backend/src/routes/TasksRoutes.ts
  apps/backend/src/handlers/TaskMissedSweepHandler.ts (daily cron: Pending && dueAt<today -> Missed, system-wide, no created_by filter — same pattern as browser_run_budget)
  apps/web/src/routes/\_authenticated/tasks/{index.tsx,-data.ts,-WeekStrip.tsx,-TaskSection.tsx,-TaskRow.tsx}

- Files to modify:
  packages/schemas/src/index.ts (export tasks)
  packages/schemas/src/log.ts (Tasks LogCategory actions)
  apps/backend/src/db/tables.ts (new `tasks` table: id, createdBy, contactId nullable FK, title, dueAt, status int, note nullable, completedAt nullable, cr eatedAt, updatedAt + indexes)
  apps/backend/src/index.ts (mount TasksRoutes)
  apps/backend/src/repositories/ContactsRepo.ts (logContactHistory: on \*\_sent, set contact.nextTouchDueAt = sentAt+7d via dayjs, call TasksRepo.syncFollowUpForContact)
  apps/backend/src/config/Constants.ts (TASK_FOLLOWUP_INTERVAL_DAYS = 7)
  apps/backend/workers/api/index.ts (add `scheduled()` export -> TaskMissedSweepHandler)
  apps/backend/workers/api/wrangler.jsonc (add `triggers.crons` to staging+production envs)
  apps/web/src/routes/\_authenticated/-utils.ts (NAV_ITEMS: today->tasks, new icon)
  apps/web/src/routes/index.tsx (redirect "/" -> "/tasks")
  apps/web/src/routes/\_authenticated/contacts/$contactId/index.tsx (read `?tab=` search param so "View conversation" can deep-link to History tab)

- Delete: apps/web/src/routes/\_authenticated/today/ (folder renamed to tasks/)

- Migration: pnpm db:generate + pnpm db:migrate, migration file committed with schema change

- Golden files mirrored: NotesDAL/NotesRepo/NotesRoutes.ts (backend layer shape), ContactsCommon.ts (Int/Label enum pattern) -> TaskStatusIntEnum (Pending=1/Completed=2/Missed=3) + TaskStatusLabelEnum + TASK_STATUS_LABEL_MAP

- New packages needed: none. dayjs already in apps/backend for date math. Frontend date labels use native Intl.DateTimeFormat (no dayjs in apps/web today, native API covers it — HARD BAN on installing pkg w/ native equivalent).

- Assumptions I'm making (flag now if wrong):
  1. companyName/designation shown per task row resolved via JOIN contacts+companies at query time in TasksDAL — not duplicated onto the task row.
  2. Calendar-strip day dot color priority when day has mixed statuses: Missed > Pending > Completed (worst wins).
  3. Week-strip prev/next arrows shift by one week; "Today" button jumps back to current week. Month dropdown = jump to that month's current/first week.
  4. Task title fixed as "Follow up with {contact.name}" — no manual "+ create task" UI in this pass (mockup shows none); table schema supports it later since contactId is nullable.
  5. Checking a task's checkbox only flips Task.status — does NOT touch contact.status/sequencePosition (kept decoupled from outreach pipeline).

- Ambiguities: none blocking — confirm above and I start.
