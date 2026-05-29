### Delta Spec 003C: Jobs Feature — Backend Routing & Repository Layer

## 1. Context & Objective

This is Unit 3 of the Jobs Feature implementation. Your objective is to build out the backend CRUD operations for managing job records. Following the architectural boundaries of this codebase, you must implement three distinct layers: the Data Access Layer (DAL) for raw SQL/Drizzle queries, the Repository layer for core business logic and label mapping, and the Hono Route Handler layer for HTTP request validation, authentication, and execution.

Do not write frontend forms, UI layouts, or Cloudflare Workflows in this execution step.

---

## 2. Technical Constraints & File Triggers

All code must align strictly with the multi-tenant system configuration.

- **Data Access Layer (DAL):** `apps/worker/src/data-access-layer/JobsDAL.ts`
- **Repository Layer:** `apps/worker/src/repositories/JobsRepo.ts`
- **Routing Handlers:** `apps/worker/src/routes/JobsRoutes.ts`
- **System Mount Point:** Mount the new route group inside `apps/worker/src/index.ts` under the base path `/v1/jobs`.

---

## 3. Layer Specifications

### A. Data Access Layer (`JobsDAL`)

- Every query method must explicitly append a `WHERE created_by = ?` clause utilizing the authenticated Clerk User ID string passed from the request context. Cross-tenant queries or un-scoped updates are strictly forbidden.

- Every database modification or search operation must be wrapped in an independent `try/catch` block.

- On any catch block trigger or "Record Not Found" query result, you must immediately push a structured failure event to the persistence monitoring pipeline using `AppLogger.error()` before raising or mapping the exception inward.

- **Methods to implement:**
- `createJob(data: InsertJobDALRequest)`
- `getJobDetails(id: string, clerkUserId: string)`
- `getJobsList(clerkUserId: string)`

### B. Business Repository (`JobsRepo`)

- **Integer Mappings:**
- `type`: `1` $\rightarrow$ "Manual", `2` $\rightarrow$ "LLM".

- `status`: `1` $\rightarrow$ "Needs review" (Waiting for Human), `2` $\rightarrow$ "Accepted", `3` $\rightarrow$ "Applied", `4` $\rightarrow$ "Company Added", `5` $\rightarrow$ "Interviewing", `6` $\rightarrow$ "Offer", `7` $\rightarrow$ "Rejected",

### C. Hono Router Layer (`JobsRoutes`)

- Every route must register the standard authentication checkpoint (`checkAuth`) as its primary entry gate.

- Extract the `clerkUserId` from the request context variable using `c.get("clerkUserId")`.

- Every JSON payload or query parameter matrix must pass through a strict `zValidator()` schema compiler compiled in Unit 2 before parsing logic executes.

- **Required Endpoints:**
- `POST /` $\rightarrow$ Creates a new manual listing (`type = 1`). Returns `201 Created`.

- `GET /` $\rightarrow$ Fetches all job listings owned by the active user scope. Returns `200 OK`.

- `GET /:id` $\rightarrow$ Resolves an explicit detail row or triggers a `404 Not Found` if non-existent or owned by another tenant.

---

## 4. Operational Logging Commitments

You must embed comprehensive tracing across this layer using `AppLogger`. String literals for logging markers are forbidden; use the formal actions introduced during your contract definition phase:

- Log an execution trace (`AppLogger.info()`) when initiating row insertions or querying dataset sweeps.

- Log an explicit alert trace (`AppLogger.error()`) along with raw parameter metadata if authentication parameters fail validation blocks or lookup scopes miss target IDs.

---

## 5. Execution Pipeline

- [ ] **Task 1:** Generate `JobsDAL.ts` containing error-wrapped, multitenant SQL query abstractions passing strictly scoped query rules.

- [ ] **Task 2:** Generate `JobsRepo.ts` with explicit type conversion utilities and string enumeration label expanders.

- [ ] **Task 3:** Generate `JobsRoutes.ts` utilizing Hono router patterns, binding input validators, and ensuring authentication guards map contexts seamlessly.

- [ ] **Task 4:** Mount the route definitions inside the main gateway file `apps/worker/src/index.ts`.

---

## 6. Verification & State Handoff

- **Type Evaluation Boundary:** Run `tsc --noEmit` from the workspace root to guarantee that layer inputs/outputs map correctly to your schemas.
- **Multi-tenant Boundary Verification:** Inspect your SQL compile steps to ensure that no operational select, delete, or rewrite method can execute without anchoring against a `created_by` filter.

- **Handoff:** Update `context/progress-tracker.md`.
