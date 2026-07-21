# Progress Tracker - Isotope

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- None — Contact detail company context just completed. Awaiting next unit.

## Completed

- **Contact detail — company context (2026-07-21)**: Opening a contact (page route or slide-out panel) now shows the parent Company, all Jobs at that company, and all other Contacts at that company, alongside the contact's own info.
  - **`jobId` removed from Contact entirely** — contacts are only ever tied to a Company now, never a specific Job. Removed from `ZContactBase` (`packages/schemas/src/contacts/ContactsCommon.ts`), the `contacts` table (migration `0012_isotope.sql`, `ALTER TABLE contacts DROP COLUMN job_id` — **not yet applied to remote D1, `pnpm db:migrate` still needs to be run**), `ContactsDAL` (insert/selects/update, 6 spots), `ContactsRepo.updateContact`, and the bulk-edit "Job" column + `JobSelect` usage in `-DesktopContactsTable.tsx` (the only UI entry point that ever set it). `JobSelect.tsx` itself untouched — still used elsewhere for the Jobs entity.
  - **New endpoint**: `GET /companies/:id/jobs` (`CompaniesRoutes.ts`) → `JobsRepo.getJobsByCompany` → `JobsDAL.getJobsByCompany` (mirrors the existing `getContactsByCompany` pattern exactly — join on `companies`, filter `createdBy` + `companyId`, `.limit(20)` with a `// TODO: paginate` comment since pagination is deferred). New `GetJobsByCompanyDALRequest` type in `JobsDALRequest.ts`. `ContactsDAL.getContactsByCompany` also capped at `.limit(20)` with the same TODO (was previously unbounded).
  - **Shared detail component**: extracted `-ContactDetailContent.tsx` — the full contact header/tabs/body/footer, previously duplicated independently between the page route (`$contactId/index.tsx`) and the slide-out side panel (`-DesktopPanel.tsx`'s `ContactPanelContent`). Both surfaces now render this one component, differing only via props (`onClose`/`onExpand` for the panel, `onBack` for the page, shared `onDeleted`). Tab order changed from Draft/History/About to **History/About/Draft** in both surfaces (`ContactDetailTab` type + `TABS` array in the shared component).
  - **New `-CompanyContext.tsx`**: renders inside `AboutTab` (after Notes, before "Mark as dead") — Company summary card (status + fit-band badges, click-through to `/companies/$companyId`), Jobs list (click-through to `/jobs/$jobId`, empty state "No jobs tracked at this company yet"), Other Contacts list (excludes the current contact by id, click-through to `/contacts/$contactId`, empty state "No other contacts at this company yet"). Follows the existing `-LinkedContacts.tsx` list-row visual pattern.
  - **`-LinkedContacts.tsx` fix (in scope, same iteration)**: contact rows on the Company detail page previously had no click handler at all — now navigate to `/contacts/$contactId` on click (row changed from `div` to `button`).
  - **New query**: `JobsQueries.byCompany(companyId, getToken)` in `apps/web/src/routes/_authenticated/jobs/-data.ts`, hitting the new endpoint.
  - Verification: `tsc --noEmit` clean in `packages/schemas` and `apps/web` (zero errors). `apps/backend` has the same 21 pre-existing unrelated errors as the unmodified baseline (`EnvConfig.ts`, `dbClient.ts`, `AiProvider.ts`, `NotesRepo.ts`, `notes.test.ts`, `JobDiscoveryWorkflow.ts` — none touch files changed in this unit). `eslint` clean on every file touched or created in this unit; all remaining lint errors/warnings are pre-existing and in untouched files.
  - **Outstanding**: `pnpm db:migrate` (applies to remote **staging** D1, shared infra) has not been run — needs explicit user confirmation before executing, per the session's risk-of-shared-state rule.

- **spec 01 — Workers AI setup**: Added `"ai": { "binding": "AI" }` to `wrangler.jsonc` (base + staging + production envs). Ran `wrangler types` to regenerate `worker-configuration.d.ts` — `AI: Ai` now present in all env interfaces. Removed stale `@cloudflare/workers-types` entry from `tsconfig.json` (package not installed; superseded by generated runtime types). Created `apps/backend/src/providers/ai.ts` — `AiProvider` class with `run()` and `runWithRetry()` methods; `AI_MODELS` constants for Sonnet (general) and Haiku (personalisation research only).

- **Spec 003A — Jobs Database Schema**:
  - Schema: Added `jobs` table to `apps/backend/src/db/tables.ts`. 15 columns, 3 indexes (UNIQUE on `url`, IDX on `created_by`, IDX on `company_id`). `status` + `type` as IntEnum integers; `skills` as JSON text; `match_score` nullable real (v2.0 reserved).
  - Enums: Created `packages/schemas/src/jobs/JobsCommon.ts` — `JobStatusIntEnum` / `JobTypeLabelEnum` + label enums, int→label maps, `ZJobBase`, `ZJob`. Exported from `packages/schemas/src/index.ts`.

- **Spec 003B — Jobs Zod Schemas & System Contracts**:
  - `JobsApiRequest.ts`: `ZCreateJobApiRequest` (title + url required, url validated via `z.url()`; company_id, description, location, salary, source optional). `ZUpdateJobApiRequest` (all fields optional).
  - `JobsApiResponse.ts`: `CreateJobApiResponse`, `GetJobApiResponse`, `GetJobsApiResponse`, `UpdateJobApiResponse` — all extend `ApiResponse`.
  - `JobsDALRequest.ts`: `CreateJobDALRequest`, `FindJobDALRequest`, `GetJobsDALRequest`, `UpdateJobDALRequest`.
  - `jobs/index.ts`: exports all four modules.
  - `log.ts`: Added `CreateJob`, `GetJobDetails`, `ListJobs`, `UpdateJob`, `DeleteJob`, `RunJobIngestion`, `DuplicateJobBlocked` to `LogAction` enum.
  - Verification: `tsc --noEmit` clean; `ZCreateJobApiRequest.safeParse` without url fails Zod as expected.
  - Migration: Generated `src/db/migrations/0005_isotope.sql`, applied to remote D1 (`isotope-db`).
  - TypeScript: No new errors. Pre-existing errors in ContactsRepo/NotesRepo/notes.test unchanged.

- **Spec 003C — Jobs Backend Routes**:
  - `JobsDAL.ts`: `createJob`, `getJobDetails`, `getJobsList` — all tenant-scoped (`WHERE created_by = ?`), try/catch on every method, AppLogger on error + not-found paths, skills JSON parsed on read.
  - `JobsRepo.ts`: `createJob` (forces `type=Manual`, defaults `status=Applied`), `getJobDetails`, `getJobs` — AppLogger.info at start of each op; delegates to DAL.
  - `JobsRoutes.ts`: `POST /`, `GET /`, `GET /:id` — checkAuth first, zValidator on body/param, 201/200/404/500 status codes.
  - `index.ts`: Mounted at `/jobs` (linter normalised from `/v1/jobs`).
  - TypeScript: No new errors (pre-existing ContactsRepo/NotesRepo/notes.test errors unchanged).

- **Spec 003C — Jobs Status Enum Fix**:
  - Replaced 6-value status enum (Applied/Screening/Interview/Offer/Rejected/Withdrawn) with correct 8-value set: 1=NotStarted, 2=WaitingForHuman, 3=Accepted, 4=Applied, 5=CompanyAdded, 6=Interviewing, 7=Offer, 8=Rejected.
  - `NotStarted` is the default for Manual jobs (`type=1`); `WaitingForHuman` is the default for LLM jobs (`type=2`).
  - `jobStatusIntToLabel` map updated with explicit `Record<JobStatusIntEnum, JobStatusLabelEnum>` type.
  - `JobsRepo.createJob` default status changed from `Applied` → `NotStarted`.
  - No DDL migration needed (column type unchanged; dev/staging DB had no real rows).

- **spec 02 — Company Research Framework Form**:
  - DB: Added `frameworks` table to `apps/backend/src/db/tables.ts`. Generated migration `0004_isotope.sql` and applied to remote D1.
  - Schemas: Created `packages/schemas/src/frameworks/` — `FrameworksCommon.ts` (enums, `ScoredCriterion`, `CompanyFrameworkFormInputs`, `Framework`), `FrameworksApiRequest.ts`, `FrameworksApiResponse.ts`, `FrameworksDALRequest.ts`, `index.ts`. Added `FrameworkTypeIntEnum` (1=CompanyResearch). Exported from `packages/schemas/src/index.ts`.
  - Log: Added `GenerateFramework`, `SaveFramework`, `GetLatestFramework`, `GetFrameworkVersions` to `LogAction` enum.
  - Backend: `FrameworksDAL.ts` — `getLatestFramework`, `getFrameworkVersions`, `createFramework`. `FrameworksRepo.ts` — `generateCompanyFramework` (calls AiProvider with structured system prompt + user message), `saveCompanyFramework` (auto-increments version), `getLatestCompanyFramework`, `getCompanyFrameworkVersions`. `FrameworksRoutes.ts` — `POST /frameworks/generate`, `PUT /frameworks/company`, `GET /frameworks/company`, `GET /frameworks/company/versions`. Mounted in `index.ts`.
  - CSS: Added `--accent-bg` / `--accent-text` tokens to `apps/web/src/styles.css` (light/dark mode) as they were not yet defined.
  - Frontend shared: `apps/web/src/shared/fields/ScoredCriteriaField.tsx` — repeatable criterion builder with weight stepper, auto-no-go toggle, expand/collapse detail rows, drag-reorder on desktop and up/down arrows on mobile. `apps/web/src/shared/forms/CompanyResearchFrameworkForm.tsx` — full 6-section form (salary, locations tag-input, ethics tag-input, scored criteria, decision bands, auto no-go summary), validate-before-generate, live computed band example, "See an example" collapsible (onboarding only).
  - Frontend data: `apps/web/src/routes/_authenticated/onboarding/-data.ts` — `FrameworksQueries`, `useGenerateFramework`, `useSaveFramework` with explicit `onError` toast handlers.
  - Onboarding route: `apps/web/src/routes/_authenticated/onboarding/step-1.tsx` — wizard step 1 with form→review→navigate state machine; wizard header with progress dots; sticky footer with contextual actions.
  - Settings route: `apps/web/src/routes/_authenticated/settings/index.tsx` — Company Research Framework section with view (current framework + version history), edit (form), and review (editable textarea + save) steps. Relative timestamp helper.

- **Spec 003D — Jobs Frontend Data View**:
  - `-data.ts`: `JobsQueries` class with `list`, `count`, `detail` static methods + `useJobs`, `useJobsCount` hooks.
  - `-JobStatusBadge.tsx`: `JobStatusBadge` (8-status map) + `JobTypeBadge` (Manual/LLM with AI tokens).
  - `-JobsTable.tsx`: 8 columns (source/type defaultHidden), `AppTablePagination` rendered at bottom via `pagination` prop passed from parent.
  - `-JobDetailDrawer.tsx`: `JobDetailPanel` (desktop inline sliding aside, `w-100`) + `JobDetailMobileDrawer` (vaul bottom sheet `h-[90vh]`). Both controlled by `jobId: number | null`.
  - `AppTable`: Added `defaultHidden?: boolean` to `AppTableColumn`. Added `toolbarLeft?: ReactNode` prop.
  - `index.tsx`: Full route with `validateSearch` (`panel?: number`), client-side pagination (page size 20, sliced from server results), desktop flex-row layout, mobile list + mobile drawer.

- **Spec 003D+ — Jobs Search**:
  - Server-side search via SQLite `LIKE %term%` across `jobs.title`, `jobs.location`, `jobs.salary`, and `companies.name` (LEFT JOIN). Empty or absent `searchText` returns all jobs.
  - `LogAction.SearchJobs` added to `log.ts`.

- **Spec 003E — Manual Entry & Edit Form**:
  - Backend: `updateJob` added to `JobsDAL` (partial-field update via dynamic `setValues`, ownership check), `JobsRepo` (maps `UpdateJobApiRequest` → `UpdateJobDALRequest`), `PATCH /jobs/:id` route in `JobsRoutes.ts`.
  - `UpdateJobDALRequest` in `packages/schemas` updated to `Partial<NullableDALFields<...>>` so only `id`+`createdBy` are required — all update fields optional.
  - `-data.ts`: `useCreateJob` (`POST /jobs`) and `useUpdateJob` (`PATCH /jobs/:id`) mutation hooks with mandatory `onError` toast handlers. Sentry captured globally via `queryClient.ts` `mutations.onError`.
  - `-CompanySelect.tsx`: autocomplete dropdown — fetches all companies, filters by search input, supports clear, keyboard-accessible.
  - `-JobEntryForm.tsx`: TanStack Form dual-mode form. Create mode: all fields, required validation on `title` + `url`. Edit mode: pre-populated from `initialData`, same fields fully editable. Submits to correct mutation based on presence of `initialData.id`. Success: toast + `onSuccess()`. Required fields block submission with inline errors.
  - `index.tsx`: `formMode` state (`null | "create" | Job`). "Add job" button in both mobile and desktop headers. Edit button (pencil icon) in `JobDetailPanel`/`JobDetailMobileDrawer` header — passes job to `setFormMode`. Form rendered in modal overlay.
  - `-JobDetailDrawer.tsx`: `onEdit?: (job: Job) => void` prop added; pencil icon button shown when `onEdit` + loaded job both present.

- **Spec 003F — Job Search Framework**:
  - DB: Added `job_search_frameworks` table to `tables.ts` (15 columns, `idx_job_fw_user` index). Migration `0007_isotope.sql` generated and applied to remote D1.
  - Schemas: `packages/schemas/src/frameworks/` — `FrameworksCommon.ts` (`ZPrioritisedSkill`, `ZFramework`, `ZFrameworkInput`), `FrameworksApiRequest.ts`, `FrameworksApiResponse.ts`, `FrameworksDALRequest.ts` (`GetFrameworkDALRequest`, `CreateFrameworkDALRequest`, `SaveFrameworkDALRequest`), `index.ts`. Exported from `packages/schemas/src/index.ts` as `export * from "./frameworks"`. Old `job-search-frameworks/` directory deleted.
  - LogAction: `SaveFramework`, `GetFramework` in `packages/schemas/src/log.ts`.
  - Constants: `JOB_SEARCH_FRAMEWORK_DEFAULTS` in `apps/backend/src/config/Constants.ts` — single backend source of truth for default values.
  - Backend: `FrameworksDAL.ts` — `getFrameworkDetails`, `saveFramework` (fetches version, JSON-stringifies arrays, calls `createFramework`, sets `isCustomized: true`), `createFramework` (raw insert + prunes to 5 versions), `createDefaultIfAbsent` (idempotent seed from Constants). `FrameworksRepo.ts` — `seedDefault`, `getFrameworkDetails`, `saveFramework` (pure delegation to DAL — no DB logic). Routes: `GET /frameworks/job-search`, `POST /frameworks/job-search` in `FrameworksRoutes.ts`.
  - User seeding: `UsersRepo.syncClerkUser` calls `fwRepo.seedDefault(clerkId)` after successful upsert — every new user gets a default framework row with `isCustomized: false`.
  - Frontend data: `FrameworkQueries` (key: `["frameworks","job-search","latest"]`), `useSaveFramework` in `apps/web/src/routes/_without_nav/onboarding/job-search-framework/-data.ts`.
  - Frontend forms: `apps/web/src/shared/forms/JobSearchFrameworkForm.tsx` — reusable form using `FrameworkInput` type. Location section in right column (below Search Settings). No hardcoded defaults — always hydrated from DB row.
  - Onboarding route: `apps/web/src/routes/_without_nav/onboarding/job-search-framework/index.tsx` — skeleton while `isPending || !framework`; redirects to `/jobs` only when `framework.isCustomized === true`; passes DB row as `initialValues`.
  - Settings route: `apps/web/src/routes/_authenticated/settings/frameworks.tsx` — no `max-w` constraint; `showNotice = !noticeDismissed && framework != null && !framework.isCustomized`; skeleton while `isPending || !framework`; no hardcoded defaults.
  - Jobs page: `hasFramework` checks `frameworkQuery.data?.framework?.isCustomized` (not mere row presence); Discover button navigates to onboarding if `!hasFramework`.

- **Spec 003G — Job Discovery Workflow**:
  - `WebSearchProvider.ts`: `WebSearchProvider` interface + `TavilySearchProvider` — maps Tavily `/search` endpoint to `WebSearchResult[]`. `time_range` param for recency; throws on non-200.
  - `JobDiscoveryWorkflow.ts`: `JobDiscoveryWorkflow extends WorkflowEntrypoint` — 6 durable steps: fetch-framework → web-search (per targetRole query, URL-deduped) → extract-jobs (Workers AI JSON extraction) → filter-jobs (required skills hard-gate) → dedup-jobs (against existing `jobs` table) → insert-jobs (bulk insert, one-by-one with continue-on-error).
  - `JobsDAL.ts`: `getExistingUrls` (Set of existing URLs for dedup) + `bulkInsertJobs` (one-by-one, logs per-failure, returns insert count).
  - `JobsRepo.ts`: `discoverJobs` — checks framework, triggers `JOB_DISCOVERY_WORKFLOW.create()`, returns 400 if no customized framework.
  - `JobsRoutes.ts`: `POST /jobs/discover` — returns 202 immediately; 400 if no framework.
  - `wrangler.jsonc`: `workflows` binding `JOB_DISCOVERY_WORKFLOW` → `JobDiscoveryWorkflow` in base + staging + production envs. `TAVILY_API_KEY` placeholder var added.
  - `index.ts`: `export { JobDiscoveryWorkflow }` — required by Cloudflare Workflows runtime.
  - `wrangler types` re-run — `JOB_DISCOVERY_WORKFLOW: Workflow<...>` and `TAVILY_API_KEY: string` now in generated `Env`.
  - Frontend: `useDiscoverJobs` mutation in `-data.ts`. Both Discover buttons (desktop header + mobile banner) wired — disabled + "Searching…" while pending, success toast on 202, redirect to onboarding on 400, error toast on other failures.

- **Spec 04 — Contact History (CRUD)**:
  - LogAction: Added `GetContactHistory`, `CreateContactHistory`, `UpdateContactHistory`, `DeleteContactHistory` to `packages/schemas/src/log.ts`.
  - Schemas: Added `ContactHistoryDirectionEnum` (me/contact) and `ContactHistoryChannelEnum` (email/linkedin) to `ContactsCommon.ts`. Added `ZLogContactHistoryApiRequest` (direction+channel+body+sentAt), `ZUpdateContactHistoryApiRequest` to `ContactsApiRequest.ts`. Added `UpdateContactHistoryApiResponse`, `DeleteContactHistoryApiResponse` to `ContactsApiResponse.ts`. Added `FindContactHistoryDALRequest`, `UpdateContactHistoryDALRequest` to `ContactsDALRequest.ts`.
  - DAL: Updated `getContactHistory` (orderBy sentAt, correct LogAction). Updated `createContactHistory` (auto-increment sequencePosition for sent messages from prior max). Added `updateContactHistory` (body/sentAt/subject patch, ownership check). Added `deleteContactHistory` (ownership-scoped delete).
  - Repo: Added `logContactHistory` (derives `type` from direction+channel, e.g. `email_sent`). Added `updateContactHistory`, `deleteContactHistory`.
  - Routes: Changed `POST /:id/history` to use `ZLogContactHistoryApiRequest` via `logContactHistory`. Added `PATCH /:id/history/:historyId` and `DELETE /:id/history/:historyId`.
  - Frontend data: Updated `useCreateContactHistory` to use `LogContactHistoryApiRequest`. Added `useUpdateContactHistory`, `useDeleteContactHistory` mutation hooks.
  - Frontend UI: Replaced read-only `HistoryTab` with interactive version — `ComposeForm` (direction toggle, channel toggle, date picker, textarea), `EditHistoryForm` (inline edit per message), per-message edit/delete icon buttons, Touch N label on outgoing messages, reply count in header.

- **Spec 003H — Jobs Delete + Bulk Actions**:
  - Schemas: `ZDeleteJobApiRequest`, `ZBulkDeleteJobsApiRequest`, `ZBulkUpdateJobsApiRequest` added to `JobsApiRequest.ts`. `DeleteJobApiResponse`, `BulkDeleteJobsApiResponse`, `BulkUpdateJobsApiResponse` added to `JobsApiResponse.ts`. `DeleteJobDALRequest`, `BulkDeleteJobsDALRequest`, `BulkUpdateJobsDALRequest` added to `JobsDALRequest.ts`. `LogAction.BulkDeleteJobs`, `LogAction.BulkUpdateJobs` added to `log.ts`.
  - DAL: `deleteJob` (ownership-scoped DELETE, 404 if not found), `bulkDeleteJobs` (inArray DELETE, returns count), `bulkUpdateJobs` (inArray UPDATE status, returns count) added to `JobsDAL.ts`.
  - Repo: `deleteJob`, `bulkDeleteJobs`, `bulkUpdateJobs` delegation methods added to `JobsRepo.ts`.
  - Routes: `DELETE /jobs/:id` (404 on not-found), `DELETE /jobs/bulk` (body: `{ ids }` ), `PATCH /jobs/bulk` (body: `{ ids, status }`) registered in `JobsRoutes.ts`. Bulk routes registered before `/:id` to avoid param conflict.
  - Frontend data: `useDeleteJob`, `useBulkDeleteJobs`, `useBulkUpdateJobs` hooks added to `-data.ts`. `useDeleteJob.onSuccess` removes detail query cache entry. Bulk hooks invalidate `keys.all()`.
  - `JobPanelContent`: trash icon button in header; on delete → toast + calls `onDelete?.(id)`. `onDelete` prop threaded through `JobDetailPanel` / `JobDetailMobileDrawer`.
  - `JobsTable`: checkbox column added (select-one per row), select-all toggle in toolbar. Bulk action bar in toolbar replaces search when rows selected: status select + Apply, Delete, Clear.
  - `MobileJobsList`: "Select" toggle enters select mode; per-card checkbox; sticky bottom action bar with status select + Apply + Delete while in select mode.
  - `index.tsx`: `handleBulkDelete`, `handleBulkStatusUpdate`, `handlePanelDelete` wired; panel URL cleared on delete; all bulk mutations threaded into table + mobile list.

- **Spec 06 — Queue Setup**:
  - Created `isotope-queue` (producer binding `ISOTOPE_QUEUE`) and `isotope-queue-dlq` (DLQ — no consumer).
  - API worker entry point moved: `src/index.ts` → `workers/api/index.ts`. Wrangler config + .dev.vars files moved into `workers/api/`.
  - Processor worker entry point created at `workers/processor/index.ts` — `queue()` handler boilerplate; routes messages via `message.ack()` / `message.retry()`.
  - `workers/api/wrangler.jsonc`: added `queues.producers` binding for `isotope-queue` in staging + production envs.
  - `workers/processor/wrangler.jsonc`: consumer binding for `isotope-queue` with `dead_letter_queue: "isotope-queue-dlq"`, `max_retries: 3`, `max_batch_size: 10`, `max_batch_timeout: 30`.
  - `src/api/.dev.vars` + `.dev.vars.example`, `src/processor/.dev.vars` + `.dev.vars.example` created.
  - `package.json` scripts split into `dev:api`, `dev:processor`, `build:api`, `build:processor`, `deploy:api`, `deploy:processor`, `generate-types:api`, `generate-types:processor`.
  - CI: `deploy-worker-staging.yml` + `deploy-worker-production.yml` updated — workingDirectory → `apps/backend/src/api`, secrets path → `src/api/.dev.vars.example`.
  - CI: `deploy-worker-staging.yml` + `deploy-worker-production.yml` updated — each now deploys both API worker and processor worker in sequence within the same job.
  - **Manual steps required**: Run `wrangler queues create isotope-queue` and `wrangler queues create isotope-queue-dlq` in Cloudflare dashboard or CLI before deploying. Run `pnpm generate-types:api` and `pnpm generate-types:processor` (from `apps/backend/`) to regenerate `worker-configuration.d.ts` for each worker.

- **Browser Run redirect resolution + budget gate**:
  - `InboundJobAlertHandler.resolveRedirectUrl`: `HEAD` fetch with `redirect: "follow"` resolves email tracking URLs (e.g. `awstrack.me`) to final destination before scraping. 10s timeout, falls back to original on error. Resolved URL re-checked against blocklist. DB stores the final URL, not the tracker URL — fixes null title/description bug where Browser Run was scraping the tracker redirect page instead of the job page.
  - `BrowserRunBudgetDAL.ts`: `isShutdown()` reads single-row `browser_run_budget` table, auto-resets counter when `now >= reset_at` (lazy monthly reset — no cron needed), returns `true` when `used_seconds >= 28,800`. `recordUsage(elapsedSeconds)` atomically increments via SQL `used_seconds + ?`, inserts row on first call. Fails open on D1 error.
  - `browser_run_budget` table added to `tables.ts`. Migration `0008_isotope.sql` generated and applied to remote D1.
  - `packages/schemas/src/browserRunBudget/`: `BrowserRunBudgetCommon.ts` (types + `IncrementBrowserRunBudgetDALRequest`), `index.ts`. Exported from `packages/schemas/src/index.ts`.
  - `LogAction`: Added `BrowserRunBudgetChecked`, `BrowserRunBudgetShutdown`, `BrowserRunBudgetRecorded`, `BrowserRunBudgetReset`.
  - `Constants.ts`: Added `BROWSER_RUN_MONTHLY_BUDGET_SECONDS = 36_000`, `BROWSER_RUN_SHUTDOWN_THRESHOLD = 0.8`, `BROWSER_RUN_SHUTDOWN_SECONDS = 28_800`.
  - Gate in `InboundJobAlertHandler`: `isShutdown()` checked before each `scrapeJobUrl` call — skips scrape + logs warn if shutdown. Wall-clock elapsed time measured and passed to `recordUsage()` after each call.

- **Spec 05 — Email Job Ingestion**:
  - `LogAction`: Added `InboundEmailReceived`, `InboundEmailFetchFailed`, `InboundUrlExtracted`, `InboundScrapeStarted`, `InboundScrapeFailed`, `InboundJobInserted` to `packages/schemas/src/log.ts`.
  - `Constants.ts`: Added `BROWSER_RUN_URL`, `BROWSER_RUN_PROMPT`, `BROWSER_RUN_TIMEOUT_MS`. (Note: `INBOUND_ATS_DOMAINS` and `INBOUND_JOB_PATHS` were added then removed — see architecture decision below.)
  - `CompaniesDAL.ts`: Added `findCompanyByName` (case-insensitive `lower()` LIKE match, scoped to user).
  - `EmailInboundRoutes.ts`: `POST /api/email-inbound` — public, no auth. Verifies Resend svix signature via `resend.webhooks.verify()`. Returns 400 on bad sig, 200+ignore for non-`email.received` events. Extracts userId from `to[0]` local part, enqueues `{ type: "InboundJobAlert", action: "Process", emailId, userId }` to `ISOTOPE_QUEUE`, returns 200 immediately.
  - `SettingsRoutes.ts`: `GET /settings/inbound-address` — `checkAuth` required. Returns `{ isSuccess: true, address: "{userId}@{RESEND_INBOUND_DOMAIN}" }`.
  - `InboundJobAlertHandler.ts`: Queue consumer for `InboundJobAlert` messages. Fetches email HTML from Resend. Extracts all unique `https://` hrefs (no ATS domain filter — job alert emails wrap links in tracking redirects that defeat domain checks). Deduplicates against existing DB URLs. For each new URL: calls Cloudflare Browser Run `/json` (30s timeout) which follows redirects and scrapes the final landing page. If Browser Run returns null title, falls back to URL path slug. Resolves or creates stub company (`CompanyStatusIntEnum.WaitingHuman`). Inserts via `JobsDAL.createJob()` with `type=LLM, status=WaitingForHuman`. Acks every message.
  - `workers/api/index.ts`: Mounted `EmailInboundRoutes` at `/api/email-inbound` (public, before auth routes) and `SettingsRoutes` at `/settings`.
  - `workers/processor/index.ts`: Routes `InboundJobAlert` messages to `inboundJobAlertHandler`.
  - `workers/processor/wrangler.jsonc`: Added `d1_databases` binding for `isotope-db` in staging + production envs (processor needs DB).
  - `workers/processor/.dev.vars.example`: Added `RESEND_API_KEY`.
  - `apps/web/src/routes/_authenticated/settings/index.tsx`: Replaced "A/B Testing" tab with "Account" tab. Added `AccountTab` component — fetches `/settings/inbound-address`, displays read-only address field with copy-to-clipboard button (✓ icon feedback).
  - `-JobDetailBody.tsx` + `-JobPanelDetails.tsx`: Description section now always rendered. When `job.description` is null, shows warning banner (WarningCircleIcon + "Edit this job to paste the description manually").
  - **Manual steps required**: Run `pnpm generate-types:api` and `pnpm generate-types:processor` after deploying to regenerate `worker-configuration.d.ts` with new bindings. Set secrets via `wrangler secret put RESEND_WEBHOOK_SECRET`, `RESEND_INBOUND_DOMAIN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `RESEND_API_KEY` for both API and processor workers.

- **Spec 07 — Tasks / Follow-ups Feature**:
  - Schemas: `packages/schemas/src/tasks/` — `TasksCommon.ts` (`TaskStatusIntEnum` Pending=1/Completed=2/Missed=3, `TaskStatusLabelEnum`, `ZTask`/`ZTaskWithMeta` with joined `contactName`/`companyName`/`designation`/`overdueByDays`, `ZTaskCalendarDay`), `TasksApiRequest.ts`, `TasksApiResponse.ts`, `TasksDALRequest.ts`, `index.ts`. Exported from `packages/schemas/src/index.ts`. `LogAction` entries added: `GetTasksCalendar`, `GetTasksForDate`, `GetPastTasks`, `SearchTasks`, `UpdateTaskStatus`, `SyncFollowUpTask`, `SweepOverdueTasks`, plus `UpdateNextTouchDueAt` (Contacts).
  - DB: `tasks` table added to `apps/backend/src/db/tables.ts` (`id`, `createdBy`, `contactId` nullable FK, `title`, `dueAt`, `status`, `note`, `completedAt`, `createdAt`, `updatedAt` — all date/timestamp columns `t.text()` to match the 100% existing precedent across every other table, even though `code-standards.md` nominally says integer timestamps; flagging the discrepancy rather than silently introducing a one-off column type). Migration `0009_isotope.sql` generated and applied to remote D1.
  - Backend: `TasksDAL.ts` (`getTasksCalendar`, `getTasksForDate` — special-cases `date === today` to roll overdue Pending/Missed tasks forward, `getPastTasks`, `searchTasks`, `updateTaskStatus`, `syncFollowUpForContact` — upserts the contact's one open Pending task, `sweepOverdueTasks` — system-wide, no `created_by` filter). `TasksRepo.ts`, `TasksRoutes.ts` (`POST /tasks/calendar`, `POST /tasks/day`, `GET /tasks/past`, `POST /tasks/search`, `PATCH /tasks/:id`). Mounted at `/tasks` in `workers/api/index.ts`.
  - `ContactsDAL.updateNextTouchDueAt` added (partial single-column update — deliberately not reusing `ContactsDAL.updateContact`, which nulls out every unset field). `ContactsRepo.logContactHistory` now calls a new private `scheduleFollowUp` after any `*_sent` message: sets `contacts.nextTouchDueAt = sentAt + Constants.TASK_FOLLOWUP_INTERVAL_DAYS` (7) and calls `TasksRepo.syncFollowUpForContact`. This is the first code that ever actually writes `nextTouchDueAt` — previously dead schema.
  - Cron: `TaskMissedSweepHandler.ts` (new `handlers/` file) — sweeps overdue `Pending` → `Missed` daily. Wired via a new `scheduled()` export on the API worker (`workers/api/index.ts`, alongside existing `fetch()`) and `triggers.crons: ["5 0 * * *"]` added to `workers/api/wrangler.jsonc` (staging + production). First cron trigger in the codebase — `wrangler types` re-run for `ScheduledController` ambient type.
  - Frontend: `apps/web/src/routes/_authenticated/today/` renamed to `.../tasks/` (`git mv`) — replaced the 9-line placeholder. `-utils.ts` (pure date helpers, no date library — native `Date`, since `apps/web` has no `dayjs`/`date-fns` dependency and none was worth adding for this). `-data.ts` (`TasksQueries` + `useTasksCalendar`/`useTasksForDay`/`usePastTasks`/`useSearchTasks`/`useUpdateTaskStatus`, mandatory `onError` toasts). `-WeekStrip.tsx`, `-TaskRow.tsx`, `-TaskSection.tsx` (shadcn `Collapsible`). `index.tsx` — week strip + rolling 7-day sections (`useQueries`) + collapsed Past tasks section + search (replaces the day-sections view entirely when non-empty, per user's plan).
  - shadcn: added `checkbox.tsx`, `collapsible.tsx`, `badge.tsx` via `npx shadcn add` (`-c apps/web`) — all draw on the already-installed unified `radix-ui` package, no new npm dependency.
  - Nav: `HomeUtils.NAV_ITEMS` — `today`/`HouseIcon`/`/today` → `tasks`/`ClipboardTextIcon`/`/tasks`. Root `routes/index.tsx` redirect target updated to `/tasks`.
  - Contact deep link: `contacts/$contactId/index.tsx` gained `validateSearch` (`?tab=draft|history|about`), initial `activeTab` hydrated from it, tab clicks now also update the URL search param. `-TaskRow.tsx`'s "View conversation" link navigates to `/contacts/$contactId?tab=history`.
  - Verification: `tsc --noEmit` clean in all three packages (only pre-existing, unrelated `CompaniesCommon.ts`/`EnvConfig.ts`/`NotesRepo.ts`/etc. errors present before this change). `eslint` clean on every touched file. Ran both workers + web dev servers on non-default ports (8788/3001, to avoid the user's already-running 8787/3000 instances) — confirmed `/tasks/*` routes are mounted and `checkAuth`-gated (401 without token), and `/` → `/tasks` SSR redirect resolves the `_authenticated/tasks/` route successfully with no server errors. Could not verify the authenticated UI visually — no Clerk sign-in credentials available in this session.

- **Tasks feature code-review remediation (2026-07-05)** — 20 findings from a full staged-diff review fixed before commit:
  - **Day boundary unified**: backend "today" was worker-UTC `dayjs()` in 5 places while the frontend keyed dates in local time — broke the Today overdue rollup, `overdueByDays`, and sweep timing for non-UTC users. Now `Constants.APP_UTC_OFFSET_MINUTES` (330, IST) + `Utility.getDateKey()/getTodayDateKey()` is the single owner; all five call sites go through it. `ZDateKey` (YYYY-MM-DD regex) added to schemas and used by task request validators.
  - **Follow-up sync unified**: `ContactsRepo.resyncFollowUp(contactId)` recomputes from `getLastSentHistory` and runs after every history mutation — create (was using the just-logged `sentAt`, so backfilling an old message dragged the due date into the past), update (previously never resynced despite `sentAt` being editable), delete. It aborts when the read fails (`isSuccess` checked — previously a transient D1 error destructively cleared `nextTouchDueAt` and deleted the pending task), and writes the task first, `nextTouchDueAt` only on success, so the two representations can't diverge. `getContactDetails` full-row fetch dropped; `TasksDAL.syncFollowUpForContact` resolves the contact name itself (single narrow column) on the insert path.
  - **DAL contract**: `syncFollowUpForContact`/`deletePendingFollowUp`/`sweepOverdueTasks` returned `void`/`number` and swallowed errors — now all return `{isSuccess}` responses. Sweep uses `meta.changes` instead of materializing `.returning()` rows, and is invoked through `TasksRepo` (was handler → DAL, skipping a layer).
  - **Status labels moved to Repo**: `withMeta`/label mapping removed from `TasksDAL` (returns raw `TaskRecord` rows, new DAL response types in schemas); `TasksRepo.withMeta/withStatusLabel` is the one mapping site, per the documented NotesRepo pattern.
  - **Query fixes**: `searchTasks` escapes `%`/`_`/`\` with `LIKE … ESCAPE '\'` (raw input previously acted as wildcards); `getPastTasks` orders `dueAt DESC` (was ASC — >50 past tasks hid all recent ones) and the unused `count` query/field is gone; calendar no longer filters out `Missed` (new `hasMissed` on `TaskCalendarDay`, red dot in WeekStrip); composite index `IDX_tasks_created_by_due_at` replaces the single-column `created_by` index (migration `0010_isotope.sql` generated — **remote `db:migrate` not yet run**).
  - **History-type convention owned by schemas**: `buildContactHistoryType()`, `CONTACT_HISTORY_SENT_TYPES`, `_sent`/`_received` suffix constants in `ContactsCommon.ts` — replaces the `like(type, "%_sent")` pattern (where `_` was an unintended single-char wildcard), the repo's string interpolation, and HistoryTab's hardcoded literals. `getLastSentHistory` now returns typed `GetLastSentHistoryApiResponse`.
  - **History delete scoped to contact**: `deleteContactHistory` filters on `contactId` too and returns not-found when 0 rows change (previously `DELETE /contacts/999/history/42` deleted contact 7's row and resynced contact 999); history route params validated with `regex(/^\d+$/)`; PATCH history now passes `contactId` and triggers resync.
  - **Frontend**: Tasks page has error states for all four queries (none existed); day/search/past cards all render through one refactored `TaskSection` (collapsible flag, optional dateLabel — kills the triple copy-paste and the stray `·` separator); `updatingTaskId` derived from `mutation.isPending + variables` (redundant state + unhandled `mutateAsync` rejection removed); toggle mutation patches day/search caches via `setQueriesData` and background-invalidates past/calendar only (was awaited `invalidateQueries(all)`); duplicate `Content-Type` headers dropped (apiClient default); `-utils.ts` uses `toLocaleDateString` instead of hand-rolled month/weekday tables; unused `badge.tsx` deleted; contact detail `activeTab` derived from the URL search param (back/forward now switch tabs); query hooks follow the golden notes pattern (page-level `useAuth`, `TasksQueries.x(…, getToken)`).
  - **Cron logging**: `scheduled()` chains `disposeLogger()` after the sweep settles (was concurrent `waitUntil`s — dispose raced the sweep and could drop its logs).
  - **Dependency hygiene**: `wrangler` restored to `^4.0.0` (resolves 4.104.0; was an ephemeral pkg.pr.new PR-snapshot build) and `minimumReleaseAge: 10080` un-commented in `pnpm-workspace.yaml`.
  - Verification: `tsc --noEmit` and `eslint` clean on all touched files (pre-existing unrelated errors unchanged).

## In Progress

- None.

## Next Up

- None.

## Open Questions

- The original Today Dashboard's other 6 sections (Needs your input, Needs attention, Drafts ready, Stalled drafts, Companies to review, Jobs to review) were never implemented and are not part of the Tasks page — decide whether/where they should live (a separate page, or folded into Tasks) as a future unit.
- Received messages (`*_received` contact history) do not currently cancel or complete the contact's open follow-up task — a reply from the contact still leaves the follow-up Pending until its due date. Worth a future decision on whether replies should auto-complete or auto-cancel the pending follow-up.

## Architecture Decisions

- Workers AI binding named `AI` — consistent with Cloudflare convention and the `Ai` type in generated runtime types.
- `AiProvider` wraps `env.AI` in a class (matching `ClerkProvider` pattern already in codebase) — instantiated per request inside route handlers.
- `AI_MODELS.haiku` reserved exclusively for contact personalisation research per `code-standards.md`; all other AI work uses `AI_MODELS.sonnet`.
- `@cloudflare/workers-types` removed from `tsconfig.json` — `wrangler types` generates equivalent runtime types and the package was not installed.
- `frameworks` table uses integer `type` column (`FrameworkTypeIntEnum`) and auto-incremented `version` per user per type — latest is always `ORDER BY version DESC LIMIT 1`.
- Onboarding step-1 navigates to `/today` on framework save (step-2 route does not exist yet — will be updated when spec 03 is implemented).
- `--accent-bg` / `--accent-text` CSS tokens added to `styles.css` Block 4 — were referenced in ui-context.md but not yet defined.
- `Constants.DEFAULT_COMPANY_RESEARCH_FRAMEWORK` — canonical Appendix A framework document stored as a markdown string constant in `apps/backend/src/config/Constants.ts`. Injected into the `generateCompanyFramework` system prompt as a reference template.
- **Query route convention** — read-only endpoints that need a request body use `POST /jobs/query` sub-paths within the same resource router. All routes for a resource stay in one `<Feature>Routes.ts` file. `Constants.DEFAULT_PAGE_NO` and `Constants.DEFAULT_PAGE_SIZE` applied in Repo so routes and DAL stay decoupled from default business logic.

- **Browser Run rate limiting storage choice** — KV rejected (eventual consistency → race condition: two concurrent queue batches both read stale count, both proceed past threshold). Durable Objects rejected (overengineered for ≤3,600 calls/month volume; idle GB-second cost). D1 chosen: serialized SQLite writes eliminate race conditions; 2 D1 ops/call costs $0 against the 75M free ops/month; ~5ms overhead is negligible against a 10s scrape call. Lazy monthly reset (checked on every `isShutdown()` read) eliminates need for a cron job.

- **Browser Run redirect resolution** — Tracker/redirect URLs (e.g. `awstrack.me`, `click4.instahyre.com`) stored as source URL in DB caused Browser Run to scrape the redirect interstitial instead of the job page, resulting in null title/description. Fix: `HEAD` fetch with `redirect: "follow"` resolves to final URL before scraping and before storing in DB.

- **Tasks table date columns as text, not integer timestamps** — `code-standards.md` says timestamps should be `t.integer({ mode: "timestamp" })`, but every single existing table (`users`, `companies`, `contacts`, `contact_history`, `jobs`, `notes`) uses `t.text()` + `Utility.getCurrentISOTimestamp()`. Followed the 100% real precedent over the written-but-unfollowed rule rather than introduce the first inconsistent table.
- **Follow-up task auto-creation lives in `ContactsRepo`, not a new cron reading `contact_history`** — the moment a sent message is logged is the natural trigger (matches the "7 days later (no reply)" language in `project-overview.md`); a cron scanning for "was a message sent 7 days ago with no matching newer row" would be equivalent but slower to reflect and harder to reason about. `TasksRepo.syncFollowUpForContact` is called directly from `ContactsRepo`, not via an HTTP round-trip.
- **Missed-task cron is the first `scheduled()` handler in the codebase** — added directly to the existing API worker (`workers/api/index.ts`) rather than a new dedicated worker, since it's a lightweight daily sweep with no queue/workflow needs of its own.
- **Inbound email URL extraction strategy** — ATS domain + job-path filtering was dropped. Job alert emails (e.g. Instahyre) wrap every link in a tracking redirect domain (e.g. `click4.instahyre.com`) so the final ATS hostname is never visible pre-click. The new approach extracts all unique `https://` hrefs and passes them directly to Browser Run, which follows redirects natively and scrapes the final page. Non-job pages return null/partial data which is still stored (title falls back to URL path slug). This is simpler and handles all email providers without needing a domain allowlist.

## Session Notes

- Pre-existing TypeScript errors in `ContactsRepo.ts`, `NotesRepo.ts`, `notes.test.ts`, and contacts panel files are unrelated to this unit and were present before this change.
