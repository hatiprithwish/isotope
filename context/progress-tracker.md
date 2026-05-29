# Progress Tracker - Isotope

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- spec 02 — Company Research Framework Form

## Completed

- **spec 01 — Workers AI setup**: Added `"ai": { "binding": "AI" }` to `wrangler.jsonc` (base + staging + production envs). Ran `wrangler types` to regenerate `worker-configuration.d.ts` — `AI: Ai` now present in all env interfaces. Removed stale `@cloudflare/workers-types` entry from `tsconfig.json` (package not installed; superseded by generated runtime types). Created `apps/worker/src/providers/ai.ts` — `AiProvider` class with `run()` and `runWithRetry()` methods; `AI_MODELS` constants for Sonnet (general) and Haiku (personalisation research only).

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

## In Progress

- None.

## Next Up

- Next spec unit (spec 03)

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
