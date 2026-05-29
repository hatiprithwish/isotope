# Progress Tracker - Isotope

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- spec 03 — Jobs Feature

## Completed

- **spec 01 — Workers AI setup**: Added `"ai": { "binding": "AI" }` to `wrangler.jsonc` (base + staging + production envs). Ran `wrangler types` to regenerate `worker-configuration.d.ts` — `AI: Ai` now present in all env interfaces. Removed stale `@cloudflare/workers-types` entry from `tsconfig.json` (package not installed; superseded by generated runtime types). Created `apps/worker/src/providers/ai.ts` — `AiProvider` class with `run()` and `runWithRetry()` methods; `AI_MODELS` constants for Sonnet (general) and Haiku (personalisation research only).

- **Spec 003A — Jobs Database Schema**:
  - Schema: Added `jobs` table to `apps/worker/src/db/tables.ts`. 15 columns, 3 indexes (UNIQUE on `url`, IDX on `created_by`, IDX on `company_id`). `status` + `type` as IntEnum integers; `skills` as JSON text; `match_score` nullable real (v2.0 reserved).
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
  - DB: Added `frameworks` table to `apps/worker/src/db/tables.ts`. Generated migration `0004_isotope.sql` and applied to remote D1.
  - Schemas: Created `packages/schemas/src/frameworks/` — `FrameworksCommon.ts` (enums, `ScoredCriterion`, `CompanyFrameworkFormInputs`, `Framework`), `FrameworksApiRequest.ts`, `FrameworksApiResponse.ts`, `FrameworksDALRequest.ts`, `index.ts`. Added `FrameworkTypeIntEnum` (1=CompanyResearch). Exported from `packages/schemas/src/index.ts`.
  - Log: Added `GenerateFramework`, `SaveFramework`, `GetLatestFramework`, `GetFrameworkVersions` to `LogAction` enum.
  - Backend: `FrameworksDAL.ts` — `getLatestFramework`, `getFrameworkVersions`, `createFramework`. `FrameworksRepo.ts` — `generateCompanyFramework` (calls AiProvider with structured system prompt + user message), `saveCompanyFramework` (auto-increments version), `getLatestCompanyFramework`, `getCompanyFrameworkVersions`. `FrameworksRoutes.ts` — `POST /frameworks/generate`, `PUT /frameworks/company`, `GET /frameworks/company`, `GET /frameworks/company/versions`. Mounted in `index.ts`.
  - CSS: Added `--accent-bg` / `--accent-text` tokens to `apps/web/src/styles.css` (light/dark mode) as they were not yet defined.
  - Frontend shared: `apps/web/src/shared/fields/ScoredCriteriaField.tsx` — repeatable criterion builder with weight stepper, auto-no-go toggle, expand/collapse detail rows, drag-reorder on desktop and up/down arrows on mobile. `apps/web/src/shared/forms/CompanyResearchFrameworkForm.tsx` — full 6-section form (salary, locations tag-input, ethics tag-input, scored criteria, decision bands, auto no-go summary), validate-before-generate, live computed band example, "See an example" collapsible (onboarding only).
  - Frontend data: `apps/web/src/routes/_authenticated/onboarding/-data.ts` — `FrameworksQueries`, `useGenerateFramework`, `useSaveFramework` with explicit `onError` toast handlers.
  - Onboarding route: `apps/web/src/routes/_authenticated/onboarding/step-1.tsx` — wizard step 1 with form→review→navigate state machine; wizard header with progress dots; sticky footer with contextual actions.
  - Settings route: `apps/web/src/routes/_authenticated/settings/index.tsx` — Company Research Framework section with view (current framework + version history), edit (form), and review (editable textarea + save) steps. Relative timestamp helper.

- **Spec 003D — Jobs Frontend Data View**:
  - `-data.ts`: `JobsQueries` class with `list`, `count`, `detail` static methods + `useJobs`, `useJobsCount` hooks. Count hits `GET /jobs/count` (new endpoint added this session).
  - `GET /jobs/count` added to backend: `LogAction.CountJobs` in `log.ts`, `GetJobsCountApiResponse` in `JobsApiResponse.ts`, `getJobsCount` in `JobsDAL`, `countJobs` in `JobsRepo`, route in `JobsRoutes.ts`.
  - `-JobStatusBadge.tsx`: `JobStatusBadge` (8-status map) + `JobTypeBadge` (Manual/LLM with AI tokens).
  - `-JobsTable.tsx`: 8 columns (source/type defaultHidden), `AppTablePagination` rendered at bottom via `pagination` prop passed from parent. Custom hack footer removed.
  - `-JobDetailDrawer.tsx`: `JobDetailPanel` (desktop inline sliding aside, `w-100`) + `JobDetailMobileDrawer` (vaul bottom sheet `h-[90vh]`). Both controlled by `jobId: number | null`.
  - `AppTable`: Added `defaultHidden?: boolean` to `AppTableColumn` — columns participate in visibility toggling but start hidden. Added `toolbarLeft?: ReactNode` prop — renders left-side content in the toolbar row alongside the column-visibility (`…`) menu.
  - `index.tsx`: Full route with `validateSearch` (`panel?: number`), client-side pagination (page size 20, sliced from server results), `openPanel`/`closePanel` navigate helpers, desktop flex-row layout (table + inline panel), mobile list + mobile drawer.
  - **Pagination approach**: `totalRecords` from count API; list/search API returns results for current query; client slices by page. `AppTablePagination` renders standard prev/next/jump controls with refresh action.

- **Spec 003D+ — Jobs Search**:
  - Server-side search via `POST /jobs/list` with `{ searchText?: string }` body — replaces `GET /jobs`. SQLite `LIKE %term%` across `jobs.title`, `jobs.location`, `jobs.salary`, and `companies.name` (LEFT JOIN). Empty or absent `searchText` returns all jobs.
  - Schemas: `ZSearchJobsApiRequest`, `SearchJobsDALRequest` added to `packages/schemas/src/jobs/`. `LogAction.SearchJobs` added to `log.ts`.
  - Backend: `JobsDAL.searchJobs` (LEFT JOIN + conditional `or(like(...))` filter), `JobsRepo.searchJobs`, `POST /list` route with `zValidator`.
  - Frontend: `useJobs(searchText)` accepts search term, POSTs to `/jobs/list`; TanStack Query key includes term so each search is cached independently. `useDeferredValue` on the raw input prevents query-per-keystroke. Search bar rendered via `AppTable`'s `toolbarLeft` prop on desktop; stacked below title in mobile header. Page resets to 1 on every query change.

## In Progress

- None.

## Next Up

- Spec 003E — Manual Entry Form (Add New Job)

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
- `Constants.DEFAULT_COMPANY_RESEARCH_FRAMEWORK` — canonical Appendix A framework document stored as a markdown string constant in `apps/worker/src/config/Constants.ts`. Injected into the `generateCompanyFramework` system prompt as a reference template so the LLM outputs a document that matches the canonical structure and formatting, substituting the user's configured values (salary, locations, ethics flags, criteria, bands).

## Session Notes

- Pre-existing TypeScript errors in `ContactsRepo.ts`, `NotesRepo.ts`, `notes.test.ts`, and contacts panel files are unrelated to this unit and were present before this change.
