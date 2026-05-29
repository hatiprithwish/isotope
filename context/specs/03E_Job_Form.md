# Delta Spec 003E: Jobs Feature — Manual Entry & Edit Form

## 1. Outcomes

- **Functional Dual-Purpose Form:** A validated, user-friendly form component capable of both adding new job listings and editing existing job records.
- **Full Editability:** Every field within an existing job record must be fully editable by the user.
- **Strict Contract Adherence:** Seamless integration with TanStack Form and the pre-defined Zod validation schemas established in Unit 003A.
- **Resilient Error State:** Explicit error handling and success state management tied directly to the global UI toast system for both creation and update actions.

## 2. Scope Boundaries

- **In-Scope:**
  - Construction of a reusable frontend form component supporting both "Create" and "Edit" modes.
  - TanStack Form state management handling initial data population.
  - Mutation hooks connecting to both the `POST /jobs` endpoint (for additions) and the `PATCH /jobs/:id` endpoint (for edits).
- **Explicitly Out-of-Scope:** Any LLM workflow ingestion logic, database schema modifications, or backend routing changes (these were handled in prior units).

## 3. Constraints & Tech Stack Assumptions

- **Form Management:** Must utilize TanStack + shadcn Form for state and validation handling. When in "Edit" mode, the form must pre-populate with the existing job's data.
- **UI Components:** Must strictly use existing Shadcn UI input elements extended via Tailwind custom tokens (Text Input, Select/Autocomplete, Textarea).
- **Error Handling Invariant:** Both mutation hooks (`useCreateJob` and `useUpdateJob`) must declare an explicit `onError` handler that surfaces the failure via `toast.error(...)` from `sonner`. Silent or absent `onError` handlers are forbidden. Also make sure we are sending errors to Sentry.

## 4. Prior Decisions Archetype

- **Validation Contract:** The form payload must map exactly to the `CreateJobRequest` or `UpdateJobRequest` Zod schemas generated during the shared schema phase.
- **Required Fields:** `title`, `company_id`, and `url` are strictly required and must block submission if empty in either mode.
- **Optional Fields:** `description`, `location`, `salary`, and `source` are optional but must be rendered and editable in the UI.
- **Job Type:** Frontend won't send anything. At the repository level, when we are mapping API requests to data access layer requests, we will append `type: 1` (Manual) here.

## 5. Task Breakdown

- [ ] **Task 1:** Create/Update the mutation hooks in `apps/web/src/routes/_authenticated/jobs/-data.ts`. Ensure `useCreateJob` maps to `POST /jobs` and create a new `useUpdateJob` hook mapping to `PATCH /jobs/:id`. Both must implement the mandatory `onError` toast handler.
- [ ] **Task 2:** Build the `CompanySelect` autocomplete sub-component to allow users to search and link a job to an existing `company_id`.
- [ ] **Task 3:** Construct the main `-JobEntryForm.tsx` co-located component utilizing TanStack Form. It must accept an optional `initialData` prop to determine if it is in "Add" or "Edit" mode and pre-populate fields accordingly.
- [ ] **Task 4:** Wire the form submission to execute the correct mutation (`useCreateJob` if no ID is present, `useUpdateJob` if an ID is present). Handle successful saves by triggering a table refresh, displaying a success toast, and closing the panel/clearing the state.

## 6. Verification Criteria

- **Verification Gate A (Create Mode):** Attempt to submit the form with empty required fields (`title`, `company_id`, `url`) and verify that TanStack Form blocks the submission and displays inline validation errors.
- **Verification Gate B (Edit Mode):** Open an existing job, modify every single field (including optional ones), and submit. Verify that the frontend sends a `PATCH` request, the backend returns a success status, and the UI table reflects the updated data instantly.
- **Verification Gate C (Validation):** Input an invalid string into the `url` field during an edit and verify that the Zod validation catches the formatting error before network execution.
- **Handoff:** Update `context/progress-tracker.md`. Move "Spec 003E — Manual Entry & Edit Form" to the **Completed** section, and list "Spec 003F — Cloudflare Workflow LLM Pipeline" under **Next Up**.
