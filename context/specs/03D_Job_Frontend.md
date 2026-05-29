# Delta Spec 003D: Jobs Feature — Frontend Data View & Detail Drawer

## 1. Outcomes

- **Jobs List Data Table:** A responsive, interactive client-side TanStack data table displaying fetched job records, use `AppTable` component for this.
- **Stateful Details Drawer:** A Shadcn UI Drawer that slides in smoothly to display full job details, controlled entirely via URL parameters rather than isolated local state.
- **Non-Blocking Refresh:** A dedicated refresh action at the bottom of the table that seamlessly refetches the data layer without triggering a full browser reload.

## 2. Scope Boundaries

- **In-Scope:**
  - Implementation of `apps/web/src/routes/_authenticated/jobs/-data.ts` for TanStack Query definitions (`useQuery`).
  - Construction of the main route page at `apps/web/src/routes/_authenticated/jobs/index.tsx`.
  - Creation of the `-JobsTable.tsx` with client-side column visibility toggling.
  - Creation of the `-JobDetailDrawer.tsx` co-located component.
- **Explicitly Out-of-Scope:**
  - The "Add New Job" manual entry form (deferred to Unit 4).
  - LLM automation or Cloudflare workflows.
- **Scope Addition (implemented):**
  - `GET /jobs/count` backend route added to support `AppTablePagination` (requires `totalRecords`). Added `GetJobsCountApiResponse`, `CountJobs` log action, `getJobsCount` DAL method, `countJobs` Repo method.

## 3. Constraints & Tech Stack Assumptions

- Must follow design consistency throughout the app. Use `.design/screens/jobs.jsx` as reference.
- **Data Fetching:** Must use `apiClient` and TanStack Query. The loading state must display a 5-row skeleton using `bg-(--surface-raised)`.
- **Table UI Rules:**
  - Row height must be strictly `h-12.5` (50px).
  - Hover state on rows must use `bg-(--surface-raised)`.
  - No zebra striping is permitted.
  - Header row must use `bg-card border-b border-border`.
- **Drawer UI Rules:**
  - Width must be fixed to `w-[400px]` on desktop and switch to a full-screen drawer on mobile breakpoints.
  - The open/close state of the drawer **must** be derived from the `?panel=[id]` URL parameter.
- **Column Visibility:** The "Source" and "Type" columns must exist in the table definition but be programmatically set to hidden on initial render.

## 4. Prior Decisions Archetype

- **Status Badges:** The `status` integer must map to the exact CSS badge classes defined in the UI context (e.g., `1` = `warning` / "Needs review", `2` = `success` / "Accepted").
- **Type Badges:** The `type` integer (1 = Manual, 2 = LLM) should utilize an AI specific token `bg-(--ai-bg) text-(--ai-text)` when displaying the LLM type.

## 5. Task Breakdown

- [x] **Task 1:** Create the data layer in `apps/web/src/routes/_authenticated/jobs/-data.ts`. Define the `JobsQueries` class and the `useJobs` / `useJobsCount` hooks.
- [x] **Task 2:** Build the Shadcn TanStack table component. Implement the column definitions, including rendering the `company_id` as a clickable link and applying the correct custom status badges.
- [x] **Task 3:** Implement the column visibility toggle feature in the table header/toolbar, ensuring "Source" and "Type" are hidden by default. `AppTablePagination` rendered at table bottom.
- [x] **Task 4:** Build the `-JobDetailDrawer.tsx` component. Map its visibility and content to the `?panel=[id]` URL query parameter.
- [x] **Task 5:** Assemble the components in the `index.tsx` route, ensuring responsive behaviors map correctly to mobile viewports.

## 6. Verification Criteria

- **Verification Gate A:** Verify that clicking the refresh button triggers a background network request and updates the table without flashing a full page reload.
- **Verification Gate B:** Verify that clicking a table row updates the URL to `?panel=[id]` and smoothly animates the drawer into view.
- **Verification Gate C:** Verify that the "Source" and "Type" columns are hidden on first load, but can be successfully toggled back into view via the UI.
- **Handoff:** Update `context/progress-tracker.md`. Move "Spec 003D — Jobs Frontend Data View" to the **Completed** section, and list "Spec 003E — Manual Entry Form" under **Next Up**.
