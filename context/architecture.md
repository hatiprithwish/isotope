# Architecture — Isotope

Single source of truth for product scope, system structure, standards, invariants, workflow, and open items. Frontend design tokens live separately in `ui-context.md`. Everything else — history, per-unit notes — lives in git.

## Scope

Isotope is a multi-user job-search operations app for software engineers: track companies, contacts, outreach, and job applications. Every message is written and sent by the user.

**Built**

- **Companies** — pipeline with status tracking, linked contacts and jobs.
- **Contacts & outreach** — contact history (email + LinkedIn), configurable multi-step follow-up sequences, log-message templates with `[Name]`/`[Company]` substitution and Day-0 role-type variants.
- **Jobs** — manual entry, inbound job-alert email ingestion (Browser Run scrape), server-side search/sort/pagination.
- **Tasks** (`/tasks`) — follow-up tasks per contact + channel, week strip, overdue rollup onto Today, daily missed-sweep cron.
- **Status-change notes** — optional note on any Company/Contact/Job status change, shown as history in the detail panel.
- **Settings** — follow-up settings, contact role pills, role types, message templates, account.
- **Capture extension** (`apps/extension`) — private, unpacked Chrome MV3 side panel: capture a LinkedIn profile as a contact, log a LinkedIn conversation to a contact's history, list today's and overdue follow-ups, look up contacts and change their status.

**Out of scope (V1):** LinkedIn API, automated job-portal crawling, auto-sending email, Gmail sync, teams/shared workspaces, calendar, native mobile app, open/click tracking. Users write and send every message themselves.

**Dropped from the original spec:** AI company research and scoring, AI message drafting, A/B analytics, morning digest email, AI job discovery, onboarding wizard, and the Today-dashboard sections built on them. `/` redirects to `/tasks`.

## Stack

| Layer          | Technology                                               | Role                                                             |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| Monorepo       | pnpm workspaces                                          | `apps/web`, `apps/backend`, `apps/extension`, `packages/schemas` |
| Frontend       | TanStack Start (React 19, TypeScript, Vite)              | Routing, SSR, Cloudflare Workers deploy                          |
| Backend / API  | Hono v4 on Cloudflare Workers                            | HTTP handlers; auth middleware; business logic via Repo layer    |
| Database       | Cloudflare D1 (SQLite) + Drizzle ORM                     | All structured application data                                  |
| Shared types   | `packages/schemas` (Zod v4 + TypeScript)                 | Single source of truth for all types, Zod schemas, and enums     |
| Styling        | Tailwind CSS v4 + CSS custom property tokens + shadcn/ui | Token system defined in `styles.css`                             |
| Auth           | Clerk (`@clerk/tanstack-react-start`, `@clerk/backend`)  | Sign-up, sign-in, sessions                                       |
| Server state   | TanStack Query                                           | Fetching, caching, mutations on the frontend                     |
| Forms          | TanStack Form                                            | Never react-hook-form                                            |
| Icons          | `@phosphor-icons/react`                                  |                                                                  |
| Logging        | `@logtape/logtape` via `AppLogger`                       | Never `console.log`                                              |
| Error tracking | Sentry                                                   |                                                                  |
| Testing        | Vitest + React Testing Library                           |                                                                  |
| Extension      | WXT + React 19 + Tailwind v4, `@clerk/chrome-extension`  | Chrome MV3 side panel                                            |

Use `pnpm` only. Run an **unfiltered** `pnpm install` — `pnpm install --filter extension` prunes a `.pnpm` store entry that `apps/web`'s `vite` symlink points at and breaks the web typecheck.

## System Boundaries

- `packages/schemas/src/<feature>/` — owns all Zod schemas and TypeScript types; the only place request/response types and enums are defined. One folder per feature: `<Feature>Common.ts`, `<Feature>ApiRequest.ts`, `<Feature>ApiResponse.ts`, `<Feature>DALRequest.ts`, `index.ts`; re-exported from `packages/schemas/src/index.ts`. `LogCategory`/`LogAction` live in `packages/schemas/src/log.ts`.
- `apps/backend/src/data-access-layer/` — raw Drizzle operations only, one class per feature. No business logic, no label mapping.
- `apps/backend/src/repositories/` — business logic, one class per feature. Maps API shapes to DAL params and int → label. The only caller of the DAL.
- `apps/backend/src/routes/` — Hono route declarations. `checkAuth` first, then `zValidator`, then delegate to the Repo. Instantiate the Repo per request.
- `apps/backend/src/handlers/` (queue/cron/scheduled) — `export default class <Feature>Handler` with `static` methods only; entry point `static handle(batch, env)`; helpers are private static methods.
- `apps/backend/src/config/` — `AppContext`, `EnvConfig`, `Constants`.
- `apps/backend/src/db/tables.ts` — all Drizzle table definitions.
- `apps/web/src/routes/_authenticated/<feature>/` — authenticated pages; `-data.ts` (query-options class + mutation hooks), `index.tsx`, and `-`-prefixed co-located components. There are no per-entity detail pages: the detail panel is the only detail surface. The layout wrapper enforces the Clerk session.
- `apps/web/src/shadcn/ui/` — shadcn files; never modify.
- `apps/web/src/utils/` — shared helpers; grep here before writing any new one.
- `apps/extension/` — see [Capture extension](#capture-extension).

**Golden files** — read the matching one before writing a layer: DAL `SavedFiltersDAL.ts`, Repo `SavedFiltersRepo.ts`, Routes `SavedFiltersRoutes.ts` (all under `apps/backend/src/`), frontend data `apps/web/src/routes/_authenticated/companies/-data.ts`, page `.../companies/index.tsx`. Status-enum example: `packages/schemas/src/tasks/TasksCommon.ts`.

## Standards

**General**

- Small, single-purpose modules; fix root causes, not symptoms; never mix UI, DB access, and business logic.
- Use classes, not bare exported functions. Status transitions are explicit — write the `status` column directly, never infer it from other fields.

**TypeScript**

- Strict. No `any` (use `unknown` and narrow), no `@ts-ignore`, no `as any`, no unguarded `!`.
- Validate unknown external input at system boundaries.
- DB columns `snake_case`, TS interfaces `camelCase`; the Repo maps between them.

**Status enums (any discrete-state field)** — stored as integer, exposed as int + label:

- `packages/schemas/.../<Feature>Common.ts` defines `<Feature>StatusIntEnum`, `<Feature>StatusLabelEnum`, `<FEATURE>_STATUS_LABEL_MAP`.
- Table column: `t.integer().$type<XStatusIntEnum>().notNull().default(1)` — use a raw integer literal for the default with the enum name in a comment (drizzle-kit cannot resolve enum imports at codegen).
- DAL returns the raw int. The Repo's private `withStatusLabel` adds `<feature>Status` (int) and `<feature>StatusLabel` (string); both are always present in responses. Requests send the int. Frontend renders the label and compares/filters by int.

**Database tables**

- `sqliteTable` aliased as `table`; `camelCase` in code, `snake_case` in DB.
- All timestamps are `t.text()` ISO strings via `Utility.getCurrentISOTimestamp()` — every existing table does this; do not introduce `integer({ mode: "timestamp" })`.
- Always `createdAt` (notNull) and `updatedAt` (nullable). Index every FK column (`IDX_<table>_<col>`); add `UNQ_` unique indexes where needed.
- SQLite treats NULLs as distinct in a UNIQUE index — where a unique key includes a nullable column, do find-then-update-or-insert in the DAL instead of `ON CONFLICT`.

**DAL** — constructor takes `env: Env`, calls `getDbClient(env)`. Every method starts with `response = { isSuccess: false }`, wraps in try/catch, and on error calls `AppLogger.error({ category, action, message, error, metadata: params })` and sets `response.message`; on success sets `isSuccess = true`. Log every error path, including "not found".

**Repo** — thin; constructor takes `env`. Split any function over ~50 lines into private helpers. Log meaningful operations with `AppLogger.info` and every error path with `AppLogger.error`.

**Routes** — `new Hono<AppContext>()`; `checkAuth` first, then `zValidator` for body/param/query. User id from `c.get("clerkUserId")` — never trust a client-supplied id. Verify ownership before any mutation. Status codes: 201 create, 200 success, 404 not found, 500 error. Responses extend `ApiResponse`; never return internal error text or stack traces.

**Logging** — mandatory, silent failures forbidden. Use `AppLogger` (`apps/backend/src/providers/logger.ts`) with `category`, `action`, `message`, `metadata` (secrets redacted by the sink), plus `error` on exception paths. Add a `LogAction` entry for each new operation before writing the log call; never a string literal.

**AI / LLM** — wrap every call in try/catch and degrade gracefully. Models are declared in `Constants.AI_MODELS`; the structured-output helper is `AiProvider.runJson` (Workers AI JSON mode). Extraction prompts must return null rather than infer.

**Frontend**

- Every authenticated route lives under `_authenticated/`. If unsure whether a route needs auth, ask.
- Route files are thin — logic goes in `-data.ts`, `-utils.ts` (private) or `src/utils/index.ts` (shared). Components stay under ~150 lines and single-responsibility; avoid prop drilling; memoise only where it pays.
- Call `useAuth()` at page level and pass `getToken` into query/mutation hooks. All API calls go through `apiClient` (never raw `fetch`) and pass the query `signal` through.
- Loading (`if (isPending)`), error (`if (isError)`), and empty states are mandatory on every page.
- `-data.ts`: a static query-options class with hierarchical keys (invalidating `keys.all()` invalidates all details); `setQueryData` on update mutations, `removeQueries` on delete; `mutateAsync` when you must await before navigating/closing, otherwise `mutate` with `onSuccess`.
- Every `useMutation` declares an `onError` that surfaces the failure via `toast.error(...)` (sonner). Absent or empty `onError` is forbidden.
- Detail-panel state is derivable from the URL: `?panel=<id>`. The panel opens by id and fetches its own detail (a list row, when in hand, is only a `placeholderData`), so it never depends on the list page/filter. Desktop is a side `aside`; mobile is a bottom `Drawer` mounted by each list page. Cross-entity links and extension links go to `/<feature>?panel=<id>` — never a `/<feature>/<id>` route.
- **Mobile parity**: any UI change touches both the Desktop and Mobile variants (`-DesktopSidebar.tsx` / `-MobileTabBar.tsx`, `-DesktopContactsTable.tsx` / `-MobileContactsList.tsx`, etc.) in the same commit.

**Styling** — Tailwind utilities only; no `style={{}}`, CSS modules, or styled-components. Extend shadcn via `className`. Pixel-perfect and responsive (`md:`/`lg:` prefixes). Check `styles.css` for exact token names before writing colour classes. Prefer a real Tailwind v4 class over `[]` arbitrary values — v4 accepts decimals (`w-1.25`, `gap-0.75`); check the Tailwind v4 docs first. If a design value cannot be expressed in Tailwind, flag it — do not approximate.

**Third-party libraries** — check `package.json` for the installed version and read `llm-context/<lib>` if present; fall back to context7 for that exact version. Never guess an API from memory. Never add a package without asking first.

## Query Route Convention

Endpoints that are semantically GET but need a request body (filters, search, pagination) are `POST` on the resource router, registered in the same `<Feature>Routes.ts` as the mutations (e.g. `POST /jobs`, `POST /jobs/count`). Pagination fields (`pageNo`, `pageSize`, `sortColumn`, `sortDirection`) default in the Repo via `Constants.DEFAULT_PAGE_NO`/`DEFAULT_PAGE_SIZE` (`createdAt` desc); the DAL applies `LIMIT`/`OFFSET`/`ORDER BY` in SQL. List and count share identical filter logic so they never drift.

## Storage Model

- **Cloudflare D1 is the only store.** No blob/file storage; all content (history, notes, tasks) is text in D1. Every user-owned table has `created_by` (Clerk user id). `wrangler.jsonc` has no local D1 — `dev:api` runs `wrangler dev --env staging`, so staging _is_ the dev database.
- `tasks` — one row per follow-up step: `contactId` (nullable FK), `channel` (`ContactHistoryChannelEnum`, not null — email and LinkedIn sequences run independently), `title`, `dueAt` (date-only `YYYY-MM-DD` text; compared lexically), `status` (1 Pending, 2 Completed, 3 Missed, 4 Paused), `stepNumber`, `pausedAt`, `note`, `completedAt`. `IDX_tasks_contact_id_channel` is a plain (non-unique) index: a contact+channel accumulates one `Completed` row per finished step plus at most one active (Pending/Paused) row.
  - Logging an outbound (`Me`) message (`ContactsRepo.logContactHistory` → `TasksDAL.syncFollowUpForContact`, `completePriorStep: true`) completes the active row and inserts the next step. An inbound reply only pauses the active row. Editing/undoing a message recomputes the active row's `dueAt` in place (`completePriorStep: false`), completing nothing. Finishing the last step marks the dangling row `Completed`; the edit/undo path deletes it instead.
  - `TasksDAL.updateTaskStatus` refuses to un-complete a row if a newer row exists for that contact+channel (prevents two simultaneously active rows).
  - Overdue rollup is query-time: `getTasksForDate` for today also pulls any Pending/Missed/Paused row with `dueAt < today`. Past dates show only Completed rows (`GET /tasks/past`; a task completed before its `dueAt` won't appear there until that date passes — known gap). `POST /tasks/calendar` reports `hasPending/hasCompleted/hasMissed/hasPaused` per day. Design history: `context/plans/followup-sequences-plan.md` and its 2026-07-29 addendum.
- `jobs` — `status` and `type` are IntEnums (status: 1 NotStarted [manual default], 2 WaitingForHuman [LLM default], 3 Accepted, 4 Applied, 5 CompanyAdded, 6 Interviewing, 7 Offer, 8 Rejected; type: 1 Manual, 2 LLM). `skills` is a JSON-stringified array, parsed at the application layer. `url` has a composite UNIQUE INDEX on `(url, created_by)`. `company_id` nullable FK; `roleType` nullable text; `match_score` nullable (reserved). Search is SQLite `LIKE` across title, location, salary, and company name (LEFT JOIN `companies`).
- `role_types` — one non-versioned row per user (`labels` JSON array, max 3; `defaultLabel`; `isCustomized`). Feeds `jobs.roleType` and the Day-0 template variants.
- `log_templates` — one row per `(user, step, variantLabel)`. `step` 0 = initial outbound, N ≥ 1 = follow-up N (matches `followup_settings.stepOffsetDays[N-1]`). `variantLabel` is populated only at step 0 (one row per role-type label plus one NULL "default" row); steps ≥ 1 have a single NULL row. `LogTemplateDAL.saveTemplate` does explicit find-then-update-or-insert (NULLs are distinct in a unique index). `renderTemplate` (in `packages/schemas`) substitutes `[Name]`/`[Company]`; the resolve endpoint returns the body pre-rendered.
- `status_change_notes` — polymorphic: `entityType` (Company/Contact/Job), `entityId`, `fromStatus`, `toStatus`, `note` (nullable), `createdBy`, `createdAt`. Routes: `POST /status-change-notes`, `POST /status-change-notes/bulk` (one note over a batch of ids), `GET /status-change-notes?entityType=&entityId=`.
- `browser_run_budget` — single global row (id = 1); no `created_by` (system resource). `used_seconds` (real) is incremented atomically after each scrape; `reset_at` is the first day of the next UTC month, checked lazily on every read. `BrowserRunBudgetDAL.isShutdown()` fails open if D1 is unavailable.

## Scheduled Jobs

- The API worker (`workers/api/index.ts`) exports `scheduled()` alongside `fetch()`. `triggers.crons: ["5 0 * * *"]` (00:05 UTC) is set in the `staging` and `production` envs of `workers/api/wrangler.jsonc`.
- The only job is `TaskMissedSweepHandler.handle(env)` — flips `Pending` tasks with `dueAt < today` to `Missed`, system-wide (a cron has no user context; same pattern as `browser_run_budget`).
- `scheduled()` does not fire in `wrangler dev`; test with `curl "http://localhost:8788/cdn-cgi/handler/scheduled"`.

## Auth and Access Model

- Clerk issues sessions. Every worker route runs `checkAuth` first; unauthenticated requests get `401`. Routes read `clerkUserId`/`clerkEmail` from the verified token via `c.get(...)`.
- Every query filters by `created_by` — cross-user access is structurally impossible.
- `apps/web`'s `_authenticated` wrapper checks `useAuth().isSignedIn`; visitors see a sign-in prompt.
- `AuthMiddleware` passes `allowedCorsOrigins` into Clerk's `authorizedParties`, and the Hono CORS config reads the same list — adding an origin to `ALLOWED_CORS_ORIGIN` satisfies both.

## Capture Extension

`apps/extension` — private/unpacked Chrome MV3 only, never listed on the Chrome Web Store. Entrypoints: `background.ts` (opens the side panel on toolbar click) and a `sidepanel/` React app that calls the API directly with Clerk's `getToken()`. Auth is `@clerk/chrome-extension` with `syncHost` pointed at the web app, which needs a fixed CRX id via the manifest `key`. There is no content script: the panel injects extractors with `browser.scripting.executeScript`, plus a ~2.5s read-only poll of the LinkedIn tab while a conversation is open.

Backend: `POST /contacts/capture` (201 create / 200 duplicate — an already-captured profile is a success carrying the existing row), `POST /contacts/parse-profile` (Workers AI JSON-mode fallback, only when Name or Company is blank; a failed parse is a success with no `parsed`; rate-limited by the `PROFILE_PARSE_LIMITER` binding, 20/60s per user — a burst guard, not a quota), and the existing `POST /contacts/history/bulk`, `GET /contacts?search=`, `GET /contacts/:id/history` for message logging. `CompaniesRepo.findOrCreateByName` creates companies at `WaitingHuman`.

The panel has two sections, **Capture** and **Follow-ups**, chosen by a top tab bar; Follow-ups works on any page, not just LinkedIn. `TasksPane` calls the existing `POST /tasks/day` with today's local date key (the same call the web Tasks page makes), which returns due-today plus the overdue Pending/Missed/Paused rollup. Future-dated active tasks are not shown — that needs a new backend route. Each row also shows the message to send, with **Copy** and **Log as sent**:

- The message is rendered **client-side** from `GET /message-template` (all templates, one call): the template with `step === task.stepNumber` and `variantLabel === null`, run through `renderTemplate` with the contact's first name and company. Do not use `GET /contacts/:id/message-template` here — it derives the step from the sent count across _all_ channels, while a task's `stepNumber` is per channel, so it can return the wrong step for a contact messaged on both.
- The message sits in an editable textarea, so what is sent and what is logged are the same text. The edit is held as a `draft` override that is `null` until touched (never seeded into state), so a late-arriving or web-app-edited template cannot overwrite the user's wording; **Reset** clears the override. Every action reads the draft, never the rendered template.
- **Log as sent** posts one `Me` entry (the textarea's current body, `channel = task.channel`, `sentAt = now`) to `POST /contacts/history/bulk` via `useLogMessages`, which completes the active task and schedules the next step server-side. The bulk endpoint answers 201 with per-entry `results`, so the row must read `results[].isSuccess`, not just the request status.
- Task list and templates refetch on panel focus (the only queries that do; the rest of the panel opts out in `main.tsx`), since tasks and templates are edited in the web app.
- The panel has a third section, **Contacts**: a paged contact list over `GET /contacts` (20 per page, **Load more**, newest first — the API orders by `createdAt` desc and has no last-touched sort), narrowed by a debounced (350ms) name search once the term reaches 2 letters; shorter terms fall back to the plain list so the tab is never empty. Rendered as `ContactCard`s via an infinite query keyed `["contact-search", term]`, so a status change's invalidation refetches every loaded page. `ContactCard` is also what Capture shows for an "already in your pipeline" profile. It changes status via `PATCH /contacts/:id` (`{ contact: { status } }`) and then, only if that succeeded and a note was typed, `POST /status-change-notes` — the same ordering as the web `StatusChangePopover`, so a note never describes a transition that did not happen. A failed note does not fail the status change; it is reported separately. Dead/Failed/Closed clear the contact's follow-ups server-side, so the mutation invalidates the task list and the card says so before saving.
- Each follow-up row also carries **Change status** for its contact (`ContactStatusControl`, the same editor `ContactCard` uses), so a contact can be moved without leaving the list. The current status comes from the task response itself: `TasksDAL`'s `taskSelection` joins `contacts.status` as `contactStatus`, and `TasksRepo` adds `contactStatusLabel` (int + label, per the status-enum convention). The row hides the control when a task has no contact. A terminal status clears the contact's follow-ups server-side, so the row leaves the list on the refetch the mutation triggers.
- **Toolbar badge.** The icon shows the same count as the Follow-ups list (due today + overdue; empty at zero, `99+` above 99). Two writers share `lib/badge.ts` (`setFollowUpBadge`): the panel sets it on every `useTasksForToday` fetch, and the background worker sets it on a `chrome.alarms` tick every 5 minutes plus browser startup/install, so it stays current with the panel closed. The worker cannot use the panel's Clerk instance (Clerk stops refreshing the token when the panel closes), so it builds its own with `createClerkClient` from `@clerk/chrome-extension/background` (installed 2.9.22; `syncHost` is how it finds the web app's session — current Clerk docs describe a different `background: true` option under `/client` that this version does not have). A failed fetch keeps the old number; only a confirmed signed-out state clears it. It needs the `alarms` manifest permission, and `background.js` is ~2.4 MB because Clerk is bundled into it. Logging from the Capture conversation pane does not redraw the badge until the next tick.
- The extension has no toast library: mutation errors render inline from `mutation.error`/`results`, as in `ThreadPanel`/`CaptureForm`.

Extractor rules (each was a real bug):

- **Injected extractors must be self-contained.** `executeScript` serialises the function with `toString()`, so a module-scope binding the bundler hoists becomes a `ReferenceError` inside the LinkedIn page where nothing surfaces it. `apps/extension/scripts/verify-extractor-selfcontained.mjs` runs in `pnpm build` and fails the build if either extractor touches anything but `document`/`location`. Never reference a module-scope binding from an extractor.
- **LinkedIn DOM is not a stable contract.** No class-based selectors. Profile fields use a cascade (JSON-LD `Person` → Voyager `<code>` → semantic DOM → `<title>` → `og:title` → URL slug) and record which rung supplied each value in `sources`; weak values show a hint in the panel. Head metadata and Voyager payloads go stale across in-app navigation — guard with the URL slug.
- **Thread parsing anchors on screen-reader text**, not markup: `Attach an image to your conversation with X` (locates the open conversation, including inside shadow roots — the chat bubble lives under `#interop-outlet`), `View X's profile` (a header is only valid on the line directly after it), `X sent the following message at TIME`. Never read the conversation from `main` — it also holds the conversation list. Test extractors against the whole `main`, not just the pane.
- Direction: a sender is "me" if they also label a header avatar or, in a one-to-one chat, if they aren't the contact. The panel refuses to log when direction is unknown (`isDirectionKnown`).
- **`wxt.config.ts` declares no `web_accessible_resources`, permanently.** LinkedIn fingerprints installed extensions by fetching `chrome-extension://<id>/<resource>` against ~6,000 known ids, and that probe only works for web-accessible resources. Do not add one without re-reading the DEV_NOTEs in `wxt.config.ts`.
- `wxt.config.ts` runs in Node before the build: use `process.env` (via `requireEnv`), not `import.meta.env`. CI runs `typecheck` (`wxt prepare && tsc --noEmit`), not `postinstall`.

## Invariants

1. **Layer order is strict: Routes → Repo → DAL → DB.** Routes never call the DAL or Drizzle; Repos never call Drizzle. Serialisation for the DB (`JSON.stringify` for array columns), version calculation, and pruning belong in the DAL.
2. **All types and Zod schemas live in `packages/schemas`.** Nothing is defined in `apps/web` or `apps/backend`.
3. **Every DB query filters by `created_by`** (except system-level tables such as `browser_run_budget`).
4. **Enums are stored as integers; responses carry both int and label; the Repo maps int → label** (never the DAL).
5. **Every mutation hook declares an explicit `onError` that toasts.**
6. **Every Drizzle schema change is immediately followed by `pnpm db:generate` and `pnpm db:migrate`**, with the migration file committed in the same change. `db:migrate` targets staging remotely (`--remote --env staging`).
7. **Browser Run is rate-limited via D1, not KV or Durable Objects.** KV loses to eventual-consistency races (two concurrent batches read a stale count); Durable Objects are overkill at ≤3,600 calls/month and carry idle GB-second cost. D1 writes are serialised, free at this scale, and add ~5ms against a ~10s scrape. Shutdown threshold is 80% of the 10 h/month quota (28,800s), checked in `InboundJobAlertHandler` before each `scrapeJobUrl` and recorded after; the monthly reset is lazy.
8. **Inbound job-alert URLs are not domain-filtered.** Alert emails wrap every link in a tracking redirect, so all unique `https://` hrefs go to Browser Run, which follows redirects; non-job pages store partial data with the title falling back to the URL slug. Redirect URLs are resolved with a `HEAD` fetch (`redirect: "follow"`) before scraping and before storing.
9. **Follow-up task creation lives in `ContactsRepo`** (at the moment a message is logged), calling `TasksRepo.syncFollowUpForContact` directly — no cron scanning `contact_history`, no HTTP round-trip.

## Workflow

- **Scan before code.** Read the file tree, open the closest golden file, match its naming, imports, and placement. If no pattern exists, flag it instead of assuming.
- **Plan before a multi-file change.** Post: files to create, files to modify, golden file mirrored, new packages needed, ambiguities. Wait for confirmation.
- **Ambiguity.** Stop and ask one specific question. Do not guess.
- **One unit at a time**, verifiable end to end. Split a change if it combines unrelated routes/tables, an AI or cron change with a UI change, or behaviour the spec doesn't define. Do not implement outside the current unit, add packages the unit doesn't need, or invent statuses, cron jobs, columns, or AI behaviour that aren't specified.
- **Complete.** No `// TODO`, stubs, or placeholders. Every feature ships loading, error, and empty states and all layers, wired.
- **Done means:** the unit works end to end; no invariant above is violated; `tsc --noEmit` passes for every touched package; `eslint` is clean on touched files; the UI is responsive (mobile < 768px, desktop ≥ 1280px) with both variants updated; `pnpm build` passes; and this file is updated if structure, invariants, storage, or open items changed.
- **New feature checklist:** `LogCategory`/`LogAction` entries → schemas folder (5 files, exported) → `tables.ts` → `pnpm db:generate` + `pnpm db:migrate` → DAL → Repo → Routes → mount in `workers/api/index.ts` → `-data.ts` → pages.

## Open Items

- **Migrations:** `0024` (`status_change_notes`) and `0025` (`saved_filters`) were applied to staging on 2026-08. `0026` (drops `notes` table + its search triggers/index rows, relabels `contacts.source = 1` to Manual), `0027` (drops `job_search_frameworks`) `0028` (drops the AI-research, scoring, draft and A/B columns from `companies`/`contacts`/`contact_history`; strips `fitBands` from saved filters) and `0029` (drops unused `failed_at`/`retry_count` on `companies`/`contacts` and `jobs.match_score`) are generated but not yet applied — run `pnpm db:migrate` from `apps/backend`. Verify any newer migration is applied before assuming a table exists.
- **Status-change notes (browser check):** the popover from all 6 single-entity surfaces, bulk note over a batch, and the mobile bulk bars not clipping the inline textarea have never been checked in a live session.
- **Capture extension — never verified against real LinkedIn end to end:**
  - The Follow-ups section, the Contacts tab and the toolbar badge have never been loaded in a live browser session either. The badge's background Clerk client (`syncHost` → session) is the least certain link: if it gets no session the badge just stays blank.
  - Generate a real CRX key (`.env.example` has the openssl commands) and fill `apps/extension/.env`; add `chrome-extension://<id>` to `ALLOWED_CORS_ORIGIN` in the staging and production wrangler vars; register it in Clerk via `PATCH /v1/instance` `allowed_origins`.
  - Whether JSON-LD or Voyager payloads exist on authenticated renders (if neither, every field falls back to `<title>`); the AI parse path has never run against live Workers AI.
  - **Known data bug:** the "first line after Contact info = company" heuristic returns a school for profiles with no current employer (e.g. a contact stored with company "The NorthCap University").
  - Threads: only one real thread validated; group chats, InMails, sponsored and attachment-only messages are unverified. LinkedIn renders no year, so conversations older than 12 months are misdated. `TODAY`/`YESTERDAY` separators are never seen live. Messages above the first date separator are shown disabled. Consecutive messages from one sender log as a single entry; shared posts log as their card text.
  - The parse → contact search → bulk log sequence has never run in-browser end to end.
  - The panel polls the LinkedIn tab every ~2.5s while open (a deliberate departure from "nothing runs until you click"); revert to event-driven + Rescan if unwanted.
- **Mobile parity:** Settings mobile layout pass (currently reuses the desktop form). Visual verification of earlier phases needs an authenticated browser session.
- **Tasks gap:** `getPastTasks` filters `dueAt < today`, so a task completed before its scheduled date is missing from both the day view and Past tasks until that date passes.
- **Known baseline:** `apps/backend` `tsc --noEmit` has 10 pre-existing errors (none in recently touched files); `packages/schemas`, `apps/web`, and `apps/extension` are at 0. Don't introduce new ones.
- **Testing:** the vitest/`cloudflare:test` harness works locally, but authenticated-route assertions still need a live Clerk session token.
