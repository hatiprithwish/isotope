# Delta Spec 003B: Jobs Feature — Zod Schemas & System Contracts

## 1. Outcomes

- **Single Source of Truth:** Establish the definitive data validation contracts for the Jobs feature inside `packages/schemas/src/jobs/`.
- **Type Safety:** Provide strict TypeScript interfaces and Zod schemas for database requests (DAL), API boundaries, and shared entity models.
- **Observability Setup:** Expand the global `LogAction` enum to support Jobs-specific events before any backend routing is built.

## 2. Scope Boundaries

- **In-Scope:**
  - Creation of a new domain folder: `packages/schemas/src/jobs/`.
  - Implementation of `JobsCommon.ts`, `JobsApiRequest.ts`, `JobsApiResponse.ts`, `JobsDALRequest.ts`, and `index.ts`.
  - Definition of explicit integer Enums: `JobTypeIntEnum` (1 = Manual, 2 = LLM) and `JobStatusIntEnum`.
  - Zod validation schemas for the incoming "Add New Job" form payload (Title, Company ID, URL required; Description, Location, Salary, Source optional).
  - Expansion of `packages/schemas/src/log.ts`.
- **Explicitly Out-of-Scope:**
  - Database table creation or Drizzle migrations.
  - Hono route handlers, Repositories, or UI components.
  - Do not touch `apps/worker` or `apps/web`.

## 3. Constraints & Tech Stack Assumptions

- **Strict Placement:** All types and Zod schemas must reside exclusively in `packages/schemas`. Never define them locally in the web or worker apps.
- **Enum Handling Invariants:** Enum values must be typed to store as integers in the database, but API response types must accommodate returning both the integer value and a human-readable label.
- **Type Safety:** Strict mode is required. Never use `any`. Use `unknown` and narrow, or explicit Zod inferences.

## 4. Prior Decisions Archetype

- `match_score` is defined as a nullable number. The AI scoring calculation logic is deferred to v2.0, so the schema must accept nulls gracefully.
- `created_by` enforces multi-tenant boundaries and is mapped to a Clerk User ID string across all incoming requests.

## 5. Task Breakdown

- [ ] **Task 1:** Create `packages/schemas/src/jobs/JobsCommon.ts`. Define `JobTypeIntEnum` and `JobStatusIntEnum`. Export the base `Job` interface mapping to the intended database columns.
- [ ] **Task 2:** Create `JobsApiRequest.ts`. Define the `CreateJobRequest` schema enforcing the required fields (`title`, `company_id`, `url`) and validating the `url` string format.
- [ ] **Task 3:** Create `JobsApiResponse.ts` defining standard response shapes that extend the base `ApiResponse`.
- [ ] **Task 4:** Create `JobsDALRequest.ts` to type the raw database insertion parameters.
- [ ] **Task 5:** Update `packages/schemas/src/log.ts` to include new `LogAction` entries (e.g., `CreateJob`, `RunJobIngestion`, `DuplicateJobBlocked`).
- [ ] **Task 6:** Export all new schemas via `packages/schemas/src/jobs/index.ts` and ensure they are exported from the root `packages/schemas/src/index.ts`.

## 6. Verification & State Handoff

- **Verification Gate A:** Run `tsc --noEmit` from the root to verify no existing type exports were broken.
- **Verification Gate B:** Ensure a test or manual check confirms that a `CreateJobRequest` missing the `url` field fails Zod validation.
- **Handoff:** Update `context/progress-tracker.md`. Move "Spec 003A — Jobs Zod Schemas" to the **Completed** section, and list "Spec 003B — Database Migration" under **Next Up**.
