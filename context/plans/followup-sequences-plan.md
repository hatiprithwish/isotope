# Configurable Multi-Step Follow-Up Sequences — Implementation Plan

> Per-user configurable follow-up cadence (e.g. follow-up 1 after 3 days, follow-up 2 after 5 more days, follow-up 3 after 7 more days). Reply pauses the sequence; next outbound message advances/resumes it; manually marking a contact Dead cancels it.

## Context

Today, every contact gets exactly one follow-up reminder, always 7 days after the last sent message
(`Constants.TASK_FOLLOWUP_INTERVAL_DAYS`, hardcoded). The user wants this replaced with a fully
user-configurable multi-step cadence — e.g. follow-up 1 after 3 days, follow-up 2 after 5 more days,
follow-up 3 after 7 more days — with the total step count also configurable, per user (global setting
for now, built to extend to per-contact later). The sequence must pause automatically when a contact
replies, and resume (by advancing to the next step) when the user sends another message; the only way
to permanently cancel it is manually marking the contact Dead.

This required two rounds of codebase research (confirming there is no existing per-user settings
mechanism, no "paused" concept anywhere, and that `tasks` are single-mutable-row-per-contact today)
before six architectural decisions were locked in with the user, followed by a Plan-agent pass that
caught a real correctness bug in the original approach (`contacts.sequencePosition` is not reliably
maintained — see §0) before any code was written.

## Locked-in decisions (confirmed with user, do not re-litigate)

1. New `TaskStatusIntEnum.Paused` value (not a boolean flag).
2. Resume timing = shift due date forward by the paused duration.
3. One task row at a time, created reactively (mirrors current architecture; not upfront materialization of all N steps).
4. Offsets are cumulative/relative to the previous step's actual send date, not all relative to the initial send.
5. Manually setting a contact to Dead deletes its active Pending/Paused follow-up task row.
6. `contacts.deadAt` is auto-stamped the moment a contact transitions into Dead.
7. `stepOffsetDays` may be an empty array (follow-ups fully off) — no separate enable/disable flag.
8. 12-step ceiling on the array; Paused tasks remain manually completable via the normal checkbox (no special-case guard); the task-row UI shows "Follow-up N" with no "of total" denominator (avoids coupling the Tasks page to Follow-up Settings).

## How to use this document

This is a large, multi-layer change. **§0 through §8 are the design record** — the reasoning,
exact code, and rationale behind every decision. **§Phases below is the execution order** — implement
and verify one phase at a time, in sequence, never skipping ahead. Each phase names exactly which
files it touches (cross-referencing §0-§9 for the precise code) and a concrete "done when" check.
Stopping between phases and reviewing a working, compiling state is the point — it's what keeps a
change this size from producing a half-wired mess.

## Phases (execution order)

### Phase 1 — Schema types only (`packages/schemas`)

No runtime behavior changes yet — purely additive types, nothing wires them up. Safe to typecheck
and stop.

- New `packages/schemas/src/followup-settings/` folder (§9): `FollowUpSettingsCommon.ts`,
  `FollowUpSettingsApiRequest.ts`, `FollowUpSettingsApiResponse.ts`, `FollowUpSettingsDALRequest.ts`,
  `index.ts`. Export from `packages/schemas/src/index.ts`.
- `packages/schemas/src/tasks/TasksCommon.ts`: add `Paused` to both enums + label map, extend
  `ZTaskBase`/`ZTaskRecord` with `stepNumber`/`pausedAt` (§2b).
- `packages/schemas/src/tasks/TasksDALRequest.ts`: extend `SyncFollowUpDALRequest`, add
  `PauseFollowUpDALRequest`/`ResumeFollowUpDALRequest`/`DeleteFollowUpTasksDALRequest` (§9). **Read
  the file first** (§11.2) — field names must match what's actually there today.
- `packages/schemas/src/contacts/ContactsDALRequest.ts` / `ContactsApiResponse.ts`: add
  `GetSentMessageCountDALRequest`/`GetSentMessageCountApiResponse` (§4).
- `packages/schemas/src/log.ts`: add `PauseFollowUpTask`, `ResumeFollowUpTask`, `GetSentMessageCount`,
  `GetFollowUpSettings`, `SaveFollowUpSettings`; rename `DeletePendingFollowUpTask` →
  `DeleteFollowUpTasks` (§9) — the rename's call-site update happens in Phase 4, not here.
- **Done when:** `pnpm typecheck` (or equivalent) passes across `packages/schemas` with no other
  package touched yet. Nothing in `apps/backend`/`apps/web` references the new types until later
  phases, so this phase cannot break running code.

### Phase 2 — DB migration

- `apps/backend/src/db/tables.ts`: add `stepNumber`/`pausedAt` to `tasks` (§2a); add new
  `followUpSettings` table (§2c).
- `apps/backend/src/config/Constants.ts`: add `FOLLOWUP_SETTINGS_DEFAULTS` (§2d). Do **not** remove
  `TASK_FOLLOWUP_INTERVAL_DAYS` yet — its one call site (`ContactsRepo.resyncFollowUp`) isn't rewritten
  until Phase 5; removing it now would break the build.
- Run `pnpm db:generate` then `pnpm db:migrate:local` immediately. Commit the generated migration file
  in the same commit as the schema edit (CLAUDE.md hard rule).
- **Done when:** migration applies cleanly against local D1, `tasks` has the two new nullable columns,
  `followup_settings` table exists and is empty. No application code reads/writes these yet — purely
  a schema checkpoint.

### Phase 3 — Follow-up Settings backend (new, isolated feature)

Nothing existing depends on this yet, so it's fully testable standalone before touching
`ContactsRepo`/`TasksDAL` at all.

- `apps/backend/src/data-access-layer/FollowUpSettingsDAL.ts` (NEW) — mirrors `FrameworksDAL.ts` (§9).
- `apps/backend/src/repositories/FollowUpSettingsRepo.ts` (NEW) — mirrors `FrameworksRepo.ts` (§6, §9).
- `apps/backend/src/routes/FollowUpSettingsRoutes.ts` (NEW) — mirrors `FrameworksRoutes.ts` (§9).
- `apps/backend/workers/api/index.ts`: mount `app.route("/followup-settings", FollowUpSettingsRoutes)`
  (§9).
- **Done when:** `GET /followup-settings` and `POST /followup-settings` work end-to-end via curl/Bruno
  against local dev — save a `stepOffsetDays` array, fetch it back, confirm versioning increments on
  a second save. This is a fully working, shippable mini-feature on its own before any existing code
  changes.

### Phase 4 — Tasks DAL/Repo primitives (additive, not yet wired into ContactsRepo)

The old `resyncFollowUp` keeps working untouched through this phase — a safe checkpoint where nothing
existing can break, since these are all new methods or additive params.

- `apps/backend/src/data-access-layer/ContactsDAL.ts`: add `getSentMessageCount` (§4).
- `apps/backend/src/data-access-layer/TasksDAL.ts` (§9):
  - Thread `stepNumber` through `syncFollowUpForContact`'s UPDATE and INSERT branches.
  - Add `pauseFollowUpForContact` (§5).
  - Add `resumeFollowUpForContact` (§5) — implemented, not yet called from anywhere.
  - Rename `deletePendingFollowUp` → `deleteFollowUpTasks`, widen WHERE to
    `inArray([Pending, Paused])` (§8).
- `apps/backend/src/repositories/TasksRepo.ts` (§9): thread `stepNumber` through
  `syncFollowUpForContact`; add `pauseFollowUpForContact`/`resumeFollowUpForContact` thin wrappers;
  rename `deletePendingFollowUp` → `deleteFollowUpTasks`.
- Update the two internal call sites of the renamed method that already exist today (inside
  `TasksDAL`/`TasksRepo` themselves, if any) and the `LogAction` rename from Phase 1.
- **Done when:** the package builds/typechecks with these new methods present and unit-testable in
  isolation (e.g. call `pauseFollowUpForContact` directly against a seeded Pending task row, confirm
  it flips to Paused with a `pausedAt` stamp). `ContactsRepo` still calls the **old**
  `deletePendingFollowUp`/unmodified `resyncFollowUp` — expect a compile error here only if the rename
  already broke that call site; if so, do a mechanical find-and-rename in `ContactsRepo` now (rename
  only, no logic change) to keep the build green, deferring the actual logic rewrite to Phase 5.

### Phase 5 — Wire ContactsRepo (the risky logic core)

This is where step-math bugs would hide, so it's isolated from UI/settings-CRUD changes. Do this
phase slowly, re-reading §0, §3, §5, §8a before writing code.

- `apps/backend/src/repositories/ContactsRepo.ts`:
  - Rewrite `resyncFollowUp` exactly per §3 (uses `getSentMessageCount` + `FollowUpSettingsRepo` from
    Phases 3-4).
  - Rewrite `logContactHistory` per §5 (pause branch on inbound, advance branch on outbound).
  - Rewrite `updateContact` per §8a (`deadAt` auto-stamp + Dead-transition task deletion).
  - Add `FollowUpSettingsRepo` import.
- `apps/backend/src/config/Constants.ts`: now remove `TASK_FOLLOWUP_INTERVAL_DAYS` (dead, confirmed
  single call site, now rewritten).
- **Done when:** the full lifecycle works against a real test contact via API/curl — log an outbound
  message → `stepNumber=1` Pending task appears at the right offset; log an inbound reply → task
  flips to Paused; log another outbound → advances to `stepNumber=2` with a freshly computed due date;
  repeat past the configured array length → task is deleted; set contact to Dead → task deleted and
  `deadAt` stamped. This is the plan's most important checkpoint — do not proceed to frontend work
  until every branch in the §5 table has been manually exercised once.

### Phase 6 — Frontend: Follow-up Settings UI

Independently testable in the browser against Phase 3's API — no dependency on Phase 5's ContactsRepo
changes.

- **First:** read `apps/web/src/routes/_authenticated/settings/index.tsx` and check for an existing
  `-data.ts` in that folder (§11.3), and check `TagInput`'s prop signature (§11.4) — resolve both
  before writing the form.
- `apps/web/src/routes/_authenticated/settings/-data.ts` (NEW or MODIFY): query/mutation hooks (§9).
- `apps/web/src/routes/_authenticated/settings/-FollowUpSettingsForm.tsx` (NEW): repeater form (§9).
- `apps/web/src/routes/_authenticated/settings/index.tsx` (MODIFY): new tab (§9).
- **Done when:** the Follow-up Settings tab loads in the browser, saving a custom array persists and
  reloads correctly, and error/loading states render (per CLAUDE.md's mandatory mutation error
  handling — toast on failure, no empty `onError`).

### Phase 7 — Frontend: Tasks UI updates

- **First:** read `-TaskSection.tsx` and confirm no hardcoded `[Pending, Completed, Missed]` status
  list (§11.1) — fix if found.
- `apps/web/src/routes/_authenticated/tasks/-TaskRow.tsx` (MODIFY): step badge + Paused visual
  treatment (§9).
- `-data.ts`, `-WeekStrip.tsx`, `index.tsx`: confirm pass-through only, no structural change expected
  (§9).
- **Done when:** in the browser, a task created by Phase 5's flow shows "Follow-up N" and a "Paused"
  badge appears correctly when a contact's sequence is paused; checkbox remains clickable on a Paused
  row (per locked decision #8).

### Phase 8 — End-to-end verification

Re-run the full Verification section below against the finished feature, including the nightly-sweep
cron check, with all phases integrated.

## 0. Key research correction (found during planning — must be internalized before implementation)

The initial approach assumed `contacts.sequencePosition` is the reliable "Touch N" counter to derive
`stepNumber` from. **This is not safe.** Confirmed via read of `ContactsRepo.updateContact` /
`ContactsDAL.updateContact`: `contacts.sequencePosition` is a plain client-settable column, written
ONLY through the generic full-field `PATCH /contacts/:id` path. It is never auto-incremented by
`logContactHistory`, `resyncFollowUp`, or any history mutation. The only column that is reliably
incremented on every outbound (`_sent`) history row is `contactHistory.sequencePosition`, computed
inline inside `ContactsDAL.createContactHistory` (ContactsDAL.ts:556-597) as `max(existing) + 1`,
scoped to `(contactId, createdBy)`, counting ALL history rows regardless of sent/received (existing
code takes `sequencePosition` from ALL rows for the contact, not just sent ones, then only writes it
when `isSent` — so the number itself is only ever assigned to sent rows, but the max-scan reads all
rows; net effect: values assigned to sent rows are still monotonically 1, 2, 3... in send order,
because non-sent rows never receive a sequencePosition so they never move the max — self-consistent).

Therefore: **the plan uses a new DAL read of `MAX(contactHistory.sequencePosition)` for
`(contactId, createdBy)` scoped to `sequencePosition IS NOT NULL`, i.e. only sent rows** — call it
`getSentMessageCount`. This gives the same integer as the most recent sent row's `sequencePosition`
(they are equal since sequencePosition is monotonic and only assigned to sent rows), and is a fully
reliable, actually-maintained counter — no dependence on the unsynced `contacts.sequencePosition`.

Touch-N-to-stepNumber arithmetic (confirmed against "Touch 1 = initial send"):

```
sentCount = getSentMessageCount(contactId)   // count of _sent history rows = latest Touch N
stepNumber = sentCount   // the NEXT follow-up to schedule is "stepNumber" = sentCount
```

Reasoning: after Touch 1 (sentCount=1) is sent, the next thing due is "Follow-up 1" → offsetArray[0].
After Touch 2 (sentCount=2, i.e. follow-up 1 was sent), next due is "Follow-up 2" → offsetArray[1].
So: **the follow-up to schedule next has 1-based step number == sentCount**, and its offset is
`offsetArray[sentCount - 1]` (0-indexed array). Sequence is complete (no further task) once
`sentCount > offsetArray.length`, i.e. `sentCount - 1 >= offsetArray.length`.

This also fixes a subtlety the original research flagged but didn't resolve: `contacts.sequencePosition`
does NOT need to be touched by this feature at all. Leave it exactly as-is (unused/manually-set) —
introducing new writes to it is out of scope and would be a second, competing source of truth.

## 1. Resolving the `totalFollowUps`-vs-array-length question

**Decision: collapse to a single field — `stepOffsetDays: number[]`. Its `.length` IS `totalFollowUps`.
Do not persist a separate count.**

Justification:

- Two stored fields (`stepOffsetDays: number[]` + `totalFollowUps: number`) creates an invariant
  (`totalFollowUps <= stepOffsetDays.length` or `===`) that every read/write path must maintain by hand,
  with no DB constraint able to enforce it (SQLite/D1, JSON text column). Any future edit path that
  updates one and forgets the other silently desyncs "how many steps configured" from "how many are
  active" — a classic dual-source-of-truth bug class this codebase actively avoids elsewhere (e.g.
  Frameworks' `ZFrameworkInput`/`ZFramework` split has no such duplicate-count pattern; `contactHistory`
  computes `sequencePosition` from actual rows rather than a stored counter, for the same reason).
- The "longer array than currently active count" use case (pre-staging future steps beyond what's
  currently "on") has no product requirement here — decision #5 in the locked-in list only asks for
  "total follow-up count is configurable", satisfied entirely by array length.
- If a future need arises to temporarily "pause the whole sequence at N steps without discarding
  configured steps beyond N", that is better modeled as a separate `isEnabled`-style flag per step or
  a truncate/re-extend edit to the array itself — not a redundant count column today.

**Resulting schema shape** (packages/schemas/src/followup-settings/FollowUpSettingsCommon.ts):

```ts
export const ZFollowUpSettingsInput = z.object({
  stepOffsetDays: z
    .array(z.number().int().positive())
    .min(0) // empty array = follow-ups disabled entirely (valid state)
    .max(12, "Cannot configure more than 12 follow-up steps"),
});
export type FollowUpSettingsInput = z.infer<typeof ZFollowUpSettingsInput>;

export const ZFollowUpSettings = ZFollowUpSettingsInput.extend({
  id: z.number(),
  createdBy: z.string(),
  version: z.number().int(),
  isCustomized: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
export type FollowUpSettings = z.infer<typeof ZFollowUpSettings>;
```

Mirrors `ZFrameworkInput`/`ZFramework` exactly (Input = user-editable subset with `.refine`/bounds,
Full = Input + persistence metadata). The `.max(12)` bound plays the role of Frameworks'
`recencyWindow` `.refine` — a concrete sanity bound confirmed with the user (12 steps).

## 2. Exact Drizzle column definitions to add

### 2a. `tasks` table — add `stepNumber` and `pausedAt`, and the new `Paused` status value

`apps/backend/src/db/tables.ts` — modify the existing `tasks` table definition:

```ts
export const tasks = table(
  "tasks",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    createdBy: t.text("created_by").notNull(),
    contactId: t.int("contact_id"),
    title: t.text().notNull(),
    dueAt: t.text("due_at").notNull(),
    status: t.integer().$type<Schemas.TaskStatusIntEnum>().notNull(),
    stepNumber: t.integer("step_number"), // NEW — nullable; null = manually-created / non-sequence task
    pausedAt: t.text("paused_at"), // NEW — nullable timestamp; set only while status = Paused
    note: t.text(),
    completedAt: t.text("completed_at"),
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at"),
  },
  (table) => [
    t.index("IDX_tasks_created_by_due_at").on(table.createdBy, table.dueAt),
    t.index("IDX_tasks_contact_id").on(table.contactId),
    t.index("IDX_tasks_due_at").on(table.dueAt),
  ],
);
```

No new index needed for `stepNumber`/`pausedAt` — all lookups remain scoped by
`(createdBy, contactId, status)` (existing implicit coverage via `IDX_tasks_contact_id` +
`IDX_tasks_created_by_due_at`); no query filters or sorts by these two new columns alone.

**No `.default(...)` on `stepNumber`/`pausedAt`** — both nullable, no default needed (matches
`note`/`completedAt`/`updatedAt` precedent in the same table, none of which carry defaults).

### 2b. `packages/schemas/src/tasks/TasksCommon.ts` — add `Paused` status (raw-integer-literal convention)

```ts
export enum TaskStatusIntEnum {
  Pending = 1,
  Completed = 2,
  Missed = 3,
  Paused = 4,          // NEW
}
...
export enum TaskStatusLabelEnum {
  Pending = "Pending",
  Completed = "Completed",
  Missed = "Missed",
  Paused = "Paused",   // NEW
}
...
export const taskStatusIntToLabel: Record<TaskStatusIntEnum, TaskStatusLabelEnum> = {
  [TaskStatusIntEnum.Pending]: TaskStatusLabelEnum.Pending,
  [TaskStatusIntEnum.Completed]: TaskStatusLabelEnum.Completed,
  [TaskStatusIntEnum.Missed]: TaskStatusLabelEnum.Missed,
  [TaskStatusIntEnum.Paused]: TaskStatusLabelEnum.Paused,   // NEW
};
```

Also extend `ZTaskBase`/`ZTaskRecord` with:

```ts
export const ZTaskRecord = ZTaskBase.extend({
  ...
  stepNumber: z.number().int().nullable().optional(),   // NEW
  pausedAt: z.string().nullable().optional(),             // NEW
  ...
});
```

Per CLAUDE.md's Status Enum Pattern, `apps/backend/src/db/tables.ts` continues to use the raw
integer literal in any `.default(N)` — not applicable here since `tasks.status` has no `.default()`
today (every insert path sets it explicitly), so no literal-default edit is needed for this column;
only the enum + label map + DAL/Repo call-sites (below) need the new value threaded through.

### 2c. New `followup_settings` table — versioned append-only, mirrors `job_search_frameworks`

`apps/backend/src/db/tables.ts` — add:

```ts
export const followUpSettings = table(
  "followup_settings",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    createdBy: t.text("created_by").notNull(),
    stepOffsetDays: t.text("step_offset_days").notNull().default("[]"), // JSON-serialized number[]
    version: t.integer().notNull().default(1),
    isCustomized: t.integer("is_customized", { mode: "boolean" }).notNull().default(false),
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at"),
  },
  (table) => [t.index("idx_followup_settings_user").on(table.createdBy, table.version)],
);
```

Matches `jobSearchFrameworks` field-for-field pattern (JSON text column + `.default("[]")`,
`version`/`isCustomized`/`createdAt`/`updatedAt`, composite `(createdBy, version)` index for the
"latest version" query which orders by `version DESC LIMIT 1`).

### 2d. New default constant

`apps/backend/src/config/Constants.ts` — add alongside `JOB_SEARCH_FRAMEWORK_DEFAULTS`:

```ts
static readonly FOLLOWUP_SETTINGS_DEFAULTS = {
  stepOffsetDays: [7],   // preserves today's exact single-7-day behavior as the seeded default
} as const;
```

`TASK_FOLLOWUP_INTERVAL_DAYS = 7` is now dead once `resyncFollowUp` is rewritten to read from
`FollowUpSettingsRepo` — remove it outright (grep confirms exactly one call site).

## 3. `resyncFollowUp` rewrite — exact resolution logic / pseudocode

Current `ContactsRepo.resyncFollowUp` (ContactsRepo.ts:168-218) is replaced with:

```ts
private async resyncFollowUp(params: { userId: string; contactId: number }) {
  const lastSentResponse = await this.dal.getLastSentHistory({
    contactId: params.contactId,
    createdBy: params.userId,
  });
  if (!lastSentResponse.isSuccess) return;

  const tasksRepo = new TasksRepo(this.env);

  // No sent messages left at all (e.g. last one deleted) — clear any follow-up task/state entirely.
  if (!lastSentResponse.lastSentAt) {
    const deleteResponse = await tasksRepo.deleteFollowUpTasks({     // renamed; also deletes Paused rows (see §8)
      userId: params.userId,
      contactId: params.contactId,
    });
    if (!deleteResponse.isSuccess) return;
    await this.dal.updateNextTouchDueAt({
      id: params.contactId, createdBy: params.userId, nextTouchDueAt: null,
    });
    return;
  }

  // 1. Resolve the user's configured offsets (global-for-now; contact-level override slot reserved — see §6).
  const settingsRepo = new FollowUpSettingsRepo(this.env);
  const settingsResponse = await settingsRepo.getSettingsDetails({ userId: params.userId });
  if (!settingsResponse.isSuccess) return;
  const offsetDays = settingsResponse.settings?.stepOffsetDays ?? Constants.FOLLOWUP_SETTINGS_DEFAULTS.stepOffsetDays;

  // 2. How many outbound messages have actually been sent so far == latest Touch N.
  const sentCountResponse = await this.dal.getSentMessageCount({
    contactId: params.contactId, createdBy: params.userId,
  });
  if (!sentCountResponse.isSuccess) return;
  const sentCount = sentCountResponse.count ?? 0;   // defensive; lastSentAt truthy above implies >= 1

  // 3. stepNumber of the NEXT follow-up to schedule = sentCount (1-based; see §0 derivation).
  const stepNumber = sentCount;

  // 4. Sequence complete — no more offsets configured for this step. Clear any dangling task.
  if (stepNumber > offsetDays.length) {
    const deleteResponse = await tasksRepo.deleteFollowUpTasks({
      userId: params.userId, contactId: params.contactId,
    });
    if (!deleteResponse.isSuccess) return;
    await this.dal.updateNextTouchDueAt({
      id: params.contactId, createdBy: params.userId, nextTouchDueAt: null,
    });
    return;
  }

  // 5. Compute due date: lastSentAt (actual send date of the most recent outbound message) + offset[stepNumber-1].
  const dueAt = Utility.getDateKey(
    new Date(Date.parse(lastSentResponse.lastSentAt) + offsetDays[stepNumber - 1] * 86_400_000),
  );

  const syncResponse = await tasksRepo.syncFollowUpForContact({
    userId: params.userId, contactId: params.contactId, dueAt, stepNumber,
  });
  if (!syncResponse.isSuccess) return;

  await this.dal.updateNextTouchDueAt({
    id: params.contactId, createdBy: params.userId, nextTouchDueAt: dueAt,
  });
}
```

Notes:

- This is unchanged in _trigger shape_ from today (still called from `logContactHistory`,
  `updateContactHistory`, `deleteContactHistory`) — satisfies locked-in decision #3.
- `offsetDays` array is **cumulative/relative to previous step** per decision #4: `dueAt` is always
  computed from `lastSentAt` (the actual most-recent-send timestamp), which mechanically gives
  "previous step's actual send date + this step's offset" for free — no extra tracking needed since
  `getLastSentHistory` already re-derives from the latest real row on every call.
- **This method must NOT run for a contact whose active task is currently Paused as a side effect of
  an inbound reply** (see §5) — that is a structurally separate operation. `resyncFollowUp` continues
  to be the "advance to next step" path only, invoked from the `direction === Me` branch.

## 4. New `getSentMessageCount` DAL method

`apps/backend/src/data-access-layer/ContactsDAL.ts` — add alongside `getLastSentHistory` (both are
tiny, single-purpose reads over `contactHistory`, same file/section):

```ts
/** Count of outbound (_sent) history rows for the contact — doubles as "latest Touch N". */
async getSentMessageCount(params: Schemas.GetSentMessageCountDALRequest) {
  const response: Schemas.GetSentMessageCountApiResponse = { isSuccess: false };
  try {
    const [row] = await this.db
      .select({ count: count() })
      .from(contactHistory)
      .where(
        and(
          eq(contactHistory.contactId, params.contactId),
          eq(contactHistory.createdBy, params.createdBy),
          inArray(contactHistory.type, Schemas.CONTACT_HISTORY_SENT_TYPES),
        ),
      );
    response.isSuccess = true;
    response.message = "Sent message count fetched successfully";
    response.count = row?.count ?? 0;
  } catch (error) {
    const message = "Unknown error in fetching sent message count";
    AppLogger.error({
      category: Schemas.LogCategory.DAL,
      action: Schemas.LogAction.GetSentMessageCount,
      message, error, metadata: params,
    });
    response.message = message;
  }
  return response;
}
```

`count` is already imported in ContactsDAL.ts (confirmed: `import { ... count, ... } from "drizzle-orm"`
at the top of the file — already used elsewhere in this DAL). New schema types
`GetSentMessageCountDALRequest { contactId: number; createdBy: string }` and
`GetSentMessageCountApiResponse extends ApiResponse { count?: number }` go in
`packages/schemas/src/contacts/ContactsDALRequest.ts` / `ContactsApiResponse.ts` respectively,
alongside the existing `GetLastSentHistory*` types (same file, same section).

## 5. Pause vs. Resume vs. Advance — three distinct code paths in `logContactHistory`

This is the trickiest correctness area. The three operations that can be triggered by history log
events, and when each applies:

| Trigger                                        | Operation   | Condition                                             | Effect                                                                                           |
| ---------------------------------------------- | ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Inbound reply logged (`direction === Contact`) | **Pause**   | Contact has an active `Pending` follow-up task        | Set that task to `status = Paused, pausedAt = now`                                               |
| Outbound message logged (`direction === Me`)   | **Resume**  | Contact has an active `Paused` follow-up task         | Shift that task's `dueAt` forward by `(now - pausedAt)`, set `status = Pending, pausedAt = null` |
| Outbound message logged (`direction === Me`)   | **Advance** | No `Paused` row exists for this contact (normal case) | Run `resyncFollowUp` as rewritten in §3 — creates/updates the Pending row for the NEXT step      |

**Critical distinguishing point (why Resume and Advance cannot both run on the same event):** when a
user sends a NEW outbound message, that message is itself proof the sequence is moving to the next
step, not merely resuming the interrupted current one — a Paused task represents a _not-yet-sent_
follow-up whose due date needs to shift because the contact replied before it was due. Once the user
sends the next message, that message _satisfies_ the paused step, and the correct action is **Advance**
(schedule the step after this one), not "resume the old due date and leave it dangling".

Given the confirmed system has NO automated inbound-reply-detection and NO separate "resume" user
action (contact history creation is always manual, no webhook), the only two real re-activation events
are: (a) the user manually sends the next message (→ Advance handles it, Paused row is naturally
superseded), or (b) nothing else exists to "manually resume" a paused step today.

**Resolution the plan adopts:** treat Resume as a defensive/idempotent operation implemented but not
wired into the automatic flow — Advance's own UPDATE-not-INSERT semantics make it safe to run over a
Paused row unconditionally, since `resyncFollowUp`'s own step-number/offset math already recomputes
the correct NEXT step from `sentCount`.

```ts
async logContactHistory(params: ...) {
  const response = await this.dal.createContactHistory({ ... });
  if (!response.isSuccess) return response;

  if (params.direction === Schemas.ContactHistoryDirectionEnum.Contact) {
    // Inbound reply — pause the active Pending follow-up, if any (no-op if none/already Paused).
    await new TasksRepo(this.env).pauseFollowUpForContact({
      userId: params.userId, contactId: params.contactId,
    });
    return response;
  }

  // direction === Me: outbound message sent.
  // A Paused row existing here means the contact replied since the last time we resynced; the new
  // outbound message supersedes it. resyncFollowUp will UPDATE (not insert) the existing row keyed by
  // (createdBy, contactId), overwriting whatever status/dueAt it had, unconditionally advancing it
  // to Pending + the newly computed dueAt + stepNumber. This naturally clears Paused state.
  await this.resyncFollowUp({ userId: params.userId, contactId: params.contactId });
  return response;
}
```

This means: "Resume" as a distinct DB operation (shift-by-paused-duration) is needed ONLY for a future
scenario where the sequence needs to un-pause WITHOUT a new outbound message being sent — no such
trigger exists in the current confirmed system. Per decision #2 the shift-forward-by-paused-duration
formula is a locked-in requirement, so the plan still implements `pauseFollowUpForContact`/
`resumeFollowUpForContact` as two real DAL/Repo methods (for correctness and future-proofing, e.g. a
future explicit "Resume" button in the UI) — but wires only `pauseFollowUpForContact` into the
automatic flow today. This is confirmed acceptable (see §10).

`TasksDAL.pauseFollowUpForContact`:

```ts
async pauseFollowUpForContact(params: Schemas.PauseFollowUpDALRequest) {
  const response: Schemas.ApiResponse = { isSuccess: false };
  try {
    await this.db
      .update(tasks)
      .set({ status: Schemas.TaskStatusIntEnum.Paused, pausedAt: Utility.getCurrentISOTimestamp(), updatedAt: Utility.getCurrentISOTimestamp() })
      .where(and(
        eq(tasks.createdBy, params.createdBy),
        eq(tasks.contactId, params.contactId),
        eq(tasks.status, Schemas.TaskStatusIntEnum.Pending),   // only pauses an active Pending row; no-op otherwise (idempotent)
      ));
    response.isSuccess = true;
    response.message = "Follow-up task paused successfully";
  } catch (error) { /* ...AppLogger.error, same shape as sibling methods... */ }
  return response;
}
```

`TasksDAL.resumeFollowUpForContact` (implemented now, not yet auto-wired):

```ts
async resumeFollowUpForContact(params: Schemas.ResumeFollowUpDALRequest) {
  const response: Schemas.ApiResponse = { isSuccess: false };
  try {
    const [paused] = await this.db
      .select({ id: tasks.id, dueAt: tasks.dueAt, pausedAt: tasks.pausedAt })
      .from(tasks)
      .where(and(
        eq(tasks.createdBy, params.createdBy),
        eq(tasks.contactId, params.contactId),
        eq(tasks.status, Schemas.TaskStatusIntEnum.Paused),
      ))
      .limit(1);

    if (!paused || !paused.pausedAt) {
      response.isSuccess = true;   // nothing to resume — not an error
      response.message = "No paused follow-up task to resume";
      return response;
    }

    const pausedDurationMs = Date.now() - Date.parse(paused.pausedAt);
    const newDueAt = Utility.getDateKey(new Date(Date.parse(paused.dueAt) + pausedDurationMs));

    await this.db
      .update(tasks)
      .set({ status: Schemas.TaskStatusIntEnum.Pending, pausedAt: null, dueAt: newDueAt, updatedAt: Utility.getCurrentISOTimestamp() })
      .where(eq(tasks.id, paused.id));

    response.isSuccess = true;
    response.message = "Follow-up task resumed successfully";
  } catch (error) { /* ...AppLogger.error... */ }
  return response;
}
```

Note `dueAt` is a `YYYY-MM-DD` date-key string (per `ZDateKey` convention), so
`Date.parse(paused.dueAt)` parses at UTC midnight — consistent with how `resyncFollowUp` already
computes `dueAt` via `Utility.getDateKey(new Date(Date.parse(lastSentAt) + offset*86_400_000))`, so
the arithmetic style matches existing code exactly (no new date-handling convention introduced).

## 6. Extensibility for future per-contact override (decision #6)

`FollowUpSettingsRepo.getSettingsDetails({ userId })` today takes only `userId`. To leave room for a
future contact-level override WITHOUT a signature-breaking rewrite, the plan specifies the seam at the
**Repo layer** (not the DAL, which should stay a dumb versioned-table reader):

```ts
// FollowUpSettingsRepo.ts — today:
async getSettingsDetails(params: { userId: string }) {
  return this.dal.getSettingsDetails({ createdBy: params.userId });
}
```

Future extension (not implemented now, just the shape to preserve): add an optional
`contactId?: number` param to `getSettingsDetails`, which the Repo (not DAL) resolves by checking a
future `contact_followup_overrides` table first, falling back to the global settings row. Because
the call-site already threads `params.userId` (and could trivially also thread `params.contactId`,
which `resyncFollowUp` already has in scope) through a single Repo method, no caller signature needs
to change shape later — only the Repo's internal resolution logic gains a branch.

## 7. `sweepOverdueTasks` — confirmed no change needed, but flag WHY explicitly

Read `TasksDAL.sweepOverdueTasks` (TasksDAL.ts:370-410): the WHERE clause is
`and(eq(tasks.status, Schemas.TaskStatusIntEnum.Pending), lt(tasks.dueAt, params.today))` — an
**explicit equality check against `Pending`**, not a `!= Completed` / `!= Missed` style negative
filter. This means Paused rows (`status = Paused`) are already naturally excluded with zero code
change required. No modification to this method. (If this had been a negative filter, it would need
an explicit `ne(tasks.status, Paused)` add — worth stating so a future refactor doesn't accidentally
loosen this back to a negative-filter style and reintroduce the risk.)

## 8. `deletePendingFollowUp` → rename/extend to also delete Paused rows

`TasksDAL.ts` — rename `deletePendingFollowUp` to `deleteFollowUpTasks` (widen its WHERE — the rename
keeps the name honest since "Pending" would now be misleading):

```ts
async deleteFollowUpTasks(params: Schemas.DeleteFollowUpTasksDALRequest) {
  const response: Schemas.ApiResponse = { isSuccess: false };
  try {
    await this.db
      .delete(tasks)
      .where(and(
        eq(tasks.createdBy, params.createdBy),
        eq(tasks.contactId, params.contactId),
        inArray(tasks.status, [Schemas.TaskStatusIntEnum.Pending, Schemas.TaskStatusIntEnum.Paused]),
      ));
    response.isSuccess = true;
    response.message = "Follow-up task(s) deleted successfully";
  } catch (error) { /* ...AppLogger.error, action: Schemas.LogAction.DeleteFollowUpTasks... */ }
  return response;
}
```

Rename the corresponding `TasksRepo.deletePendingFollowUp` wrapper to `deleteFollowUpTasks` too, and
update its call sites: (1) `ContactsRepo.resyncFollowUp`'s two "no more sent messages" /
"sequence complete" branches (§3), and (2) the new `ContactsRepo.updateContact` Dead-transition hook
below. Rename `LogAction.DeletePendingFollowUpTask` → `LogAction.DeleteFollowUpTasks` in
`packages/schemas/src/log.ts` (rename, not add — avoid leaving a dead enum value around).

### 8a. Wiring the Dead-transition hook + `deadAt` auto-stamp into `ContactsRepo.updateContact`

`ContactsDAL.updateContact`'s `.set()` writes `deadAt: params.deadAt` unconditionally (no `?? undefined`
fallback), so **the auto-stamp must be computed and injected inside `ContactsRepo.updateContact`**,
never trusted from `params.contact.deadAt` as-is — otherwise a client PATCH that omits `deadAt` will
null out our own stamp on the same request that just set it. Exact rewrite:

```ts
async updateContact(params: Schemas.UpdateContactApiRequest & { userId: string; id: number }) {
  let deadAt = params.contact.deadAt ?? null;

  // Auto-stamp deadAt the moment status transitions INTO Dead — only if the caller didn't already
  // supply an explicit deadAt (defensive; today's frontend never sends one, but don't clobber a
  // future explicit value if one is ever passed).
  if (params.contact.status === Schemas.ContactStatusIntEnum.Dead && deadAt === null) {
    const existing = await this.dal.getContactDetails({ id: params.id, createdBy: params.userId });
    const wasAlreadyDead = existing.contact?.status === Schemas.ContactStatusIntEnum.Dead;
    if (!wasAlreadyDead) {
      deadAt = Utility.getCurrentISOTimestamp();
    } else {
      deadAt = existing.contact?.deadAt ?? null;   // preserve original stamp on a no-op re-save
    }
  }

  const response = await this.dal.updateContact({
    id: params.id,
    createdBy: params.userId,
    ...(/* all other existing fields unchanged */),
    deadAt,
  });

  // Delete any active follow-up task the moment the contact transitions into Dead.
  if (response.isSuccess && params.contact.status === Schemas.ContactStatusIntEnum.Dead) {
    await new TasksRepo(this.env).deleteFollowUpTasks({ userId: params.userId, contactId: params.id });
  }

  return response;
}
```

This requires one extra `getContactDetails` read to detect "transition into" vs. "already Dead,
re-saved" (needed so re-saving an already-Dead contact doesn't stomp the original `deadAt` timestamp
with `now()` every time; re-running `deleteFollowUpTasks` on an already-empty set is harmless/
idempotent, so this guard is about `deadAt` correctness primarily, not delete-safety).

`Utility.getCurrentISOTimestamp` is already imported in ContactsRepo.ts — no new import needed beyond
`import * as Schemas from "@app/schemas"` which is already a runtime import there.

## 9. File-by-file change list

### `packages/schemas/src/followup-settings/` (NEW folder — mirrors `packages/schemas/src/frameworks/`)

- **FollowUpSettingsCommon.ts** (NEW) — `ZFollowUpSettingsInput`/`FollowUpSettingsInput`,
  `ZFollowUpSettings`/`FollowUpSettings` (per §1). No status enum needed (no discrete-state field on
  this entity).
- **FollowUpSettingsApiRequest.ts** (NEW) — `ZSaveFollowUpSettingsApiRequest` (== `ZFollowUpSettingsInput`,
  mirrors `ZSaveFrameworkApiRequest`).
- **FollowUpSettingsApiResponse.ts** (NEW) — `GetFollowUpSettingsApiResponse { settings?: FollowUpSettings | null }`,
  `SaveFollowUpSettingsApiResponse { settings?: FollowUpSettings }`.
- **FollowUpSettingsDALRequest.ts** (NEW) — `SaveFollowUpSettingsDALRequest { createdBy: string; input: FollowUpSettingsInput }`,
  `CreateFollowUpSettingsDALRequest { createdBy: string; stepOffsetDays: string; isCustomized: boolean; version: number }`,
  `GetFollowUpSettingsDALRequest { createdBy: string }`.
- **index.ts** (NEW) — re-export all 4 files above.
- `packages/schemas/src/index.ts` (MODIFY) — add `export * from "./followup-settings";`.

### `packages/schemas/src/tasks/TasksCommon.ts` (MODIFY)

- Add `TaskStatusIntEnum.Paused = 4`, `TaskStatusLabelEnum.Paused = "Paused"`, extend
  `taskStatusIntToLabel` map (per §2b).
- Extend `ZTaskBase`/`ZTaskRecord` with `stepNumber: z.number().int().nullable().optional()` and
  `pausedAt: z.string().nullable().optional()`.

### `packages/schemas/src/tasks/TasksDALRequest.ts` (MODIFY — read exact current file first)

- Extend `SyncFollowUpDALRequest` to add `stepNumber: number`.
- Add `PauseFollowUpDALRequest { createdBy: string; contactId: number }`,
  `ResumeFollowUpDALRequest { createdBy: string; contactId: number }`,
  `DeleteFollowUpTasksDALRequest { createdBy: string; contactId: number }` (rename from
  `DeletePendingFollowUpDALRequest`).

### `packages/schemas/src/contacts/ContactsDALRequest.ts` / `ContactsApiResponse.ts` (MODIFY)

- Add `GetSentMessageCountDALRequest { contactId: number; createdBy: string }` and
  `GetSentMessageCountApiResponse extends ApiResponse { count?: number }` (per §4).

### `packages/schemas/src/log.ts` (MODIFY)

- Under `// Tasks` section, add: `PauseFollowUpTask`, `ResumeFollowUpTask`; rename
  `DeletePendingFollowUpTask` → `DeleteFollowUpTasks` (update the one call site in TasksDAL.ts /
  TasksRepo.ts that references the old name).
- Under `// Contacts` section, add: `GetSentMessageCount`.
- New `// Follow-up settings` section: `GetFollowUpSettings`, `SaveFollowUpSettings`.

### `apps/backend/src/config/Constants.ts` (MODIFY)

- Remove `TASK_FOLLOWUP_INTERVAL_DAYS` (dead after rewrite — confirmed single call site).
- Add `FOLLOWUP_SETTINGS_DEFAULTS = { stepOffsetDays: [7] } as const` (per §2d).

### `apps/backend/src/db/tables.ts` (MODIFY)

- Add `stepNumber`/`pausedAt` columns to `tasks` (§2a).
- Add new `followUpSettings` table (§2c).
- **Immediately after this edit: run `pnpm db:generate` then `pnpm db:migrate` (or
  `pnpm db:migrate:local`), and commit the generated migration file(s) in
  `apps/backend/src/db/migrations/00XX_isotope.sql` alongside this same commit — per CLAUDE.md's
  mandatory Schema Migration rule. Do not defer.**

### `apps/backend/src/data-access-layer/FollowUpSettingsDAL.ts` (NEW)

- Mirrors `FrameworksDAL.ts` method-for-method: `getSettingsDetails` (select latest by
  `createdBy` ordered by `version DESC LIMIT 1`), `saveSettings` (reads latest, computes
  `nextVersion`, delegates to `createSettings`), `createDefaultIfAbsent(createdBy)` (no-ops if any row
  exists, else inserts version 1 from `Constants.FOLLOWUP_SETTINGS_DEFAULTS`), `createSettings`
  (raw insert), private `deserialise`/`parseJsonArray` helpers for the JSON `stepOffsetDays` column.

### `apps/backend/src/repositories/FollowUpSettingsRepo.ts` (NEW)

- Mirrors `FrameworksRepo.ts`: thin `getSettingsDetails({ userId })` / `saveSettings({ userId, input })`
  wrappers with `AppLogger.info` calls, delegating straight to the DAL (per §6's extensibility note,
  this is the seam where a future `contactId` param gets added).

### `apps/backend/src/routes/FollowUpSettingsRoutes.ts` (NEW)

- Mirrors `FrameworksRoutes.ts`: `GET /followup-settings` (auth + `getSettingsDetails`),
  `POST /followup-settings` (auth + `zValidator("json", Schemas.ZSaveFollowUpSettingsApiRequest)` +
  `saveSettings`).

### `apps/backend/workers/api/index.ts` (MODIFY)

- Add `import FollowUpSettingsRoutes from "@/routes/FollowUpSettingsRoutes";` and
  `app.route("/followup-settings", FollowUpSettingsRoutes);`, alongside the existing
  `app.route("/frameworks", FrameworksRoutes);` line. (This is the real worker entry point/mount
  location, not `apps/backend/src/index.ts` which does not exist.)

### `apps/backend/src/data-access-layer/ContactsDAL.ts` (MODIFY)

- Add `getSentMessageCount` (§4), placed next to `getLastSentHistory`.

### `apps/backend/src/repositories/ContactsRepo.ts` (MODIFY)

- Rewrite `resyncFollowUp` per §3.
- Rewrite `updateContact` per §8a (deadAt auto-stamp + Dead-transition follow-up-task deletion).
- Rewrite `logContactHistory` per §5 (branch on `direction === Contact` to call
  `pauseFollowUpForContact`; `direction === Me` continues to call `resyncFollowUp` unconditionally).
- New imports: `FollowUpSettingsRepo` (for `resyncFollowUp`).

### `apps/backend/src/data-access-layer/TasksDAL.ts` (MODIFY)

- `syncFollowUpForContact`: add `stepNumber` to both the UPDATE `.set()` and INSERT `.values()` calls
  (currently sets `dueAt`/`updatedAt` only on update, and the full row on insert — thread the new
  param through both branches).
- Add `pauseFollowUpForContact` (§5).
- Add `resumeFollowUpForContact` (§5) — implemented, not yet wired to an automatic trigger.
- Rename `deletePendingFollowUp` → `deleteFollowUpTasks`, widen WHERE to `inArray([Pending, Paused])`
  (§8).
- `sweepOverdueTasks`: no code change (§7) — confirmed safe as-is.

### `apps/backend/src/repositories/TasksRepo.ts` (MODIFY)

- `syncFollowUpForContact`: thread `stepNumber` through to the DAL call.
- Add `pauseFollowUpForContact`/`resumeFollowUpForContact` thin wrappers.
- Rename `deletePendingFollowUp` → `deleteFollowUpTasks`.
- `withMeta`/`withStatusLabel`: no change needed structurally (already generic over `TaskRecord` →
  `Task`/`TaskWithMeta`, and `taskStatusIntToLabel` already covers the new `Paused` key once §2b lands).

### `apps/web/src/routes/_authenticated/tasks/-TaskRow.tsx` (MODIFY)

- Add a step badge when `task.stepNumber != null`: render `Follow-up {task.stepNumber}` — no "of N"
  denominator (confirmed with user; avoids an extra settings fetch coupling the Tasks page to
  Follow-up Settings).
- Add a `Paused` visual treatment: when `task.status === Schemas.TaskStatusIntEnum.Paused`, render a
  muted badge (mirroring the existing `Overdue {n}d` badge's `<span>` pattern) reading `"Paused"`. The
  checkbox stays clickable/interactive even when Paused (confirmed: manual completion is allowed, no
  special-case guard).

### `apps/web/src/routes/_authenticated/tasks/-data.ts`, `-TaskSection.tsx`, `-WeekStrip.tsx`, `index.tsx` (MODIFY, minor)

- No structural change required (confirmed task-row-centric, not contact-grouped) — only
  pass-through of the new `stepNumber`/`pausedAt`/`Paused` fields already covered by the shared
  `Schemas.TaskWithMeta` type once TasksCommon.ts is extended. **Read `-TaskSection.tsx` before
  implementation** to confirm it doesn't hardcode a `[Pending, Completed, Missed]` status list that
  would silently exclude/misplace Paused rows (see §11).

### `apps/web/src/routes/_authenticated/settings/index.tsx` (MODIFY)

- Add a new `Tab` value `"followups"` (alongside existing `"job-search" | "company-research" | "account"`),
  a new tab button, and a new `FollowUpSettingsTab` component rendering a repeater form for
  `stepOffsetDays: number[]` (simple numeric-input array with add/remove rows — check `TagInput`'s
  prop types before deciding to reuse vs. write a new minimal numeric repeater, see §11).

### `apps/web/src/routes/_authenticated/settings/-FollowUpSettingsForm.tsx` (NEW)

- New form component (co-located, `-`-prefixed per convention) — array-of-day-offsets editor with
  add/remove row controls, submitting via a new mutation hook.

### `apps/web/src/routes/_authenticated/settings/-data.ts` (NEW or MODIFY if one already exists — check first, see §11)

- `FollowUpSettingsQueries.latest(getToken)` queryOptions hitting `GET /followup-settings`.
- `useSaveFollowUpSettings()` mutation hook hitting `POST /followup-settings`, mirroring
  `useSaveFramework` exactly (invalidate the `latest` query key on success, toast on error).

## 10. Resolved decisions (previously open, now confirmed with user)

- 12-step ceiling on `stepOffsetDays` — confirmed.
- Empty `stepOffsetDays: []` is a valid "no follow-ups configured" state — `.min(0)` stays as specified in §1.
- `resumeFollowUpForContact` is implemented per §5 but not wired to an automatic trigger — kept for
  future use (e.g. a "Resume" button), confirmed acceptable.
- No "of total" denominator on the step badge — render `"Follow-up N"` only, no settings fetch needed
  on the Tasks page.
- Paused tasks remain manually completable via the existing checkbox — no status-transition guard
  added to `updateTaskStatus`, no disabling in `-TaskRow.tsx`.

## 11. Remaining pre-implementation file checks (verify before editing, no product decision needed)

1. **`-TaskSection.tsx`** — confirm it has no hardcoded `[Pending, Completed, Missed]` status
   enumeration (e.g. for grouping/section-headers) that would need a 4th `Paused` bucket added
   explicitly.
2. **`TasksDALRequest.ts` / `TasksApiRequest.ts` / `TasksApiResponse.ts`** — read exact current
   contents before editing, to avoid guessing field names that don't match.
3. **Settings page `-data.ts`** — confirm whether `apps/web/src/routes/_authenticated/settings/`
   already has one (the `AccountTab`'s `useInboundAddress` hook is defined inline in `index.tsx`
   today, suggesting maybe not) before deciding to create new vs. extend existing.
4. **`TagInput` component's prop/type signature** — confirm whether it's string-only (requiring a new
   numeric-array repeater component) or generic enough to reuse for `number[]` editing.

## Verification

- Run `pnpm db:generate` + `pnpm db:migrate:local` after the schema edit; confirm the migration file
  applies cleanly against a local D1 instance.
- Manually exercise the full lifecycle against a test contact: log an outbound message → confirm a
  `stepNumber=1` Pending task appears with the configured offset; log an inbound reply → confirm the
  task flips to Paused; log another outbound message → confirm it advances to `stepNumber=2` with a
  freshly computed due date; repeat until `stepNumber > stepOffsetDays.length` → confirm the task is
  deleted (sequence complete); set the contact to Dead → confirm any remaining task is deleted and
  `deadAt` is stamped.
- Confirm `sweepOverdueTasks` (nightly cron) does not touch Paused rows by manually pausing a task with
  a past-due `dueAt` and running the sweep handler locally.
- Exercise the Follow-up Settings tab end-to-end in the browser: save a custom `stepOffsetDays` array,
  reload, confirm it persists and a new contact's follow-up schedule reflects it.

### Critical Files for Implementation

- apps/backend/src/repositories/ContactsRepo.ts
- apps/backend/src/data-access-layer/TasksDAL.ts
- apps/backend/src/db/tables.ts
- packages/schemas/src/tasks/TasksCommon.ts

## Addendum (2026-07-29): auto-complete on outbound log supersedes decision #3

Decision #3 above ("one task row at a time... UPDATE-not-INSERT") is now **overturned**. The user
asked for a logged outbound message to auto-complete the contact's follow-up task instead of
requiring a manual checkbox — "advance" alone (silently moving `dueAt`/`stepNumber` on the same row)
never produced a visible completion, so it didn't satisfy the ask.

New model, confirmed with user:

- Logging an **outbound** message (`direction=Me`) for a contact+channel now marks that channel's
  active (Pending or Paused) task row `Completed` (stamping `completedAt`) **and inserts a new
  Pending row** for the next step — `TasksDAL.syncFollowUpForContact`, gated by a new
  `completePriorStep: boolean` param threaded from `ContactsRepo.logContactHistory` →
  `resyncFollowUp` → `TasksRepo`/`TasksDAL`.
- `completePriorStep` is `true` only for a genuine new outbound log. Recomputes triggered by editing
  or undoing (hard-deleting) an existing message's `sentAt` (`updateContactHistory`,
  `hardDeleteContactHistory`) pass `completePriorStep: false` — those still do the old in-place UPDATE
  (move `dueAt`/`stepNumber`, no completion), since they don't represent a new touch.
  **Inbound replies are unaffected** — still paused via `pauseFollowUpForContact`, never completed.
- When an outbound message finishes the sequence (`stepNumber > offsetDays.length`) with
  `completePriorStep: true`, the dangling active row is now marked `Completed` via the new
  `TasksDAL.updateActiveFollowUpStatus`/`TasksRepo.updateActiveFollowUpStatus`, instead of deleted —
  so the finished sequence stays visible in Past tasks. The edit/undo recompute path still deletes the
  dangling row in this case (no real completion occurred).
- `IDX_tasks_contact_id_channel` (`apps/backend/src/db/tables.ts`) was already a plain index, not
  unique, so no migration was needed — a contact+channel now naturally accumulates one `Completed` row
  per finished step plus at most one active (Pending/Paused) row.
- New correctness guard added in `TasksDAL.updateTaskStatus`: un-completing (`Completed` → any other
  status) a task row is now blocked if a newer row exists for the same contact+channel, to prevent the
  manual Tasks-tab checkbox from resurrecting a superseded historical step into a second
  simultaneously-active row (which every follow-up DAL method assumes cannot happen).
- **Known limitation carried over, not introduced**: `getPastTasks` filters `dueAt < today`. A task
  completed before its original scheduled `dueAt` (e.g. user logs a follow-up early) won't appear in
  Past tasks until that date passes, and won't appear in the day view either since it's no longer
  Pending — it's briefly invisible. This edge case already existed for manual checkbox completion of a
  future-dated task; auto-complete just makes it more likely to occur. Not fixed here — flagged as a
  pre-existing gap in `getPastTasks`'s query design if it becomes a real complaint.
- **`resumeFollowUpForContact` removed (2026-07-29, code review)**: this method (§5/§9 of the original
  plan — shift a Paused task's `dueAt` forward by the paused duration, flip back to Pending) was
  confirmed to still have zero callers anywhere, exactly as its own doc comment admitted ("implemented
  but not yet wired into the automatic flow"). Auto-complete-on-log (this addendum) already resolves a
  Paused row via a fresh outbound message, so nothing filled this gap in the meantime either. Deleted
  the DAL method (`TasksDAL.ts`), Repo wrapper (`TasksRepo.ts`), `ResumeFollowUpDALRequest` type, and
  the never-actually-logged `LogAction.ResumeFollowUpTask` enum value, per CLAUDE.md's stance against
  code that exists but is never called. If time-based resume is wanted later (e.g. a cron sweep that
  resumes long-Paused tasks), it needs a real trigger designed and confirmed with the user first — this
  removal doesn't change the conclusion reached earlier in this addendum that a Paused row is currently
  meant to sit indefinitely until a new message or a terminal status resolves it.
- apps/backend/src/data-access-layer/FrameworksDAL.ts
