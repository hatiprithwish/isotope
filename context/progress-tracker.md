# Progress Tracker - Isotope

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- spec 03 — Jobs Feature

## Completed

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

- **Spec 05 — Email Job Ingestion**:
  - `LogAction`: Added `InboundEmailReceived`, `InboundEmailFetchFailed`, `InboundUrlExtracted`, `InboundScrapeStarted`, `InboundScrapeFailed`, `InboundJobInserted` to `packages/schemas/src/log.ts`.
  - `Constants.ts`: Added `BROWSER_RUN_URL`, `INBOUND_ATS_DOMAINS`, `INBOUND_JOB_PATHS`, `BROWSER_RUN_PROMPT`, `BROWSER_RUN_TIMEOUT_MS`.
  - `CompaniesDAL.ts`: Added `findCompanyByName` (case-insensitive `lower()` LIKE match, scoped to user).
  - `EmailInboundRoutes.ts`: `POST /api/email-inbound` — public, no auth. Verifies Resend svix signature via `resend.webhooks.verify()`. Returns 400 on bad sig, 200+ignore for non-`email.received` events. Extracts userId from `to[0]` local part, enqueues `{ type: "InboundJobAlert", action: "Process", emailId, userId }` to `ISOTOPE_QUEUE`, returns 200 immediately.
  - `SettingsRoutes.ts`: `GET /settings/inbound-address` — `checkAuth` required. Returns `{ isSuccess: true, address: "{userId}@{RESEND_INBOUND_DOMAIN}" }`.
  - `InboundJobAlertHandler.ts`: Queue consumer for `InboundJobAlert` messages. Fetches email HTML from Resend. Extracts job URLs via href regex + ATS domain / job-path filters. Resolves tracking redirects via HEAD fetch. Deduplicates in-flight + against existing DB URLs. For each new URL: calls Cloudflare Browser Run `/json` (30s timeout), resolves or creates stub company (`CompanyStatusIntEnum.WaitingHuman`), inserts via `JobsDAL.createJob()` with `type=LLM, status=WaitingForHuman`. Acks every message.
  - `workers/api/index.ts`: Mounted `EmailInboundRoutes` at `/api/email-inbound` (public, before auth routes) and `SettingsRoutes` at `/settings`.
  - `workers/processor/index.ts`: Routes `InboundJobAlert` messages to `inboundJobAlertHandler`.
  - `workers/processor/wrangler.jsonc`: Added `d1_databases` binding for `isotope-db` in staging + production envs (processor needs DB).
  - `workers/processor/.dev.vars.example`: Added `RESEND_API_KEY`.
  - `apps/web/src/routes/_authenticated/settings/index.tsx`: Replaced "A/B Testing" tab with "Account" tab. Added `AccountTab` component — fetches `/settings/inbound-address`, displays read-only address field with copy-to-clipboard button (✓ icon feedback).
  - `-JobDetailBody.tsx` + `-JobPanelDetails.tsx`: Description section now always rendered. When `job.description` is null, shows warning banner (WarningCircleIcon + "Edit this job to paste the description manually").
  - **Manual steps required**: Run `pnpm generate-types:api` and `pnpm generate-types:processor` after deploying to regenerate `worker-configuration.d.ts` with new bindings. Set secrets via `wrangler secret put RESEND_WEBHOOK_SECRET`, `RESEND_INBOUND_DOMAIN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `RESEND_API_KEY` for both API and processor workers.

## In Progress

- None.

## Next Up

- None.

## Open Questions

- None.

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

## Session Notes

- Pre-existing TypeScript errors in `ContactsRepo.ts`, `NotesRepo.ts`, `notes.test.ts`, and contacts panel files are unrelated to this unit and were present before this change.
