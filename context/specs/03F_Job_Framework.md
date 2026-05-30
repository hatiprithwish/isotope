# Job Search Framework

**Feature:** Job Search Framework — CRUD, UI, DB schema, and Discover Jobs button integration

---

## 1. Outcome

When this spec is fully implemented:

- A `job_search_frameworks` table exists in D1 with typed columns for every form field.
- A user who clicks "Discover Jobs" on the Jobs page with no saved framework is redirected to `/onboarding/job-search-framework`, fills in the form (pre-populated with defaults), saves it, and is redirected back to `/jobs` with a success toast.
- A user who already has a saved framework clicks "Discover Jobs" and nothing happens beyond the button click — no redirect, no form. The trigger logic for the Cloudflare Workflow is explicitly out of scope for this spec.
- A user who visits Settings → Frameworks sees three tabs: Job Search (fully functional), Company Research (coming soon), A/B Testing (coming soon).
- On the Job Search tab, the user sees their last saved framework values and can edit and re-save at any time.
- All API endpoints follow the existing Hono router pattern in the codebase. Auth follows the existing Clerk pattern already established in the codebase — do not deviate from it.

---

## 2. Scope boundaries

### In scope

- D1 migration: `job_search_frameworks` table
- Default constants file: Appendix C values as TypeScript constants
- API: `GET /frameworks/job-search` — fetch latest saved framework for authed user
- API: `POST /frameworks/job-search` — save new version
- Frontend route: `/onboarding/job-search-framework` — first-time setup page
- Frontend route: `/settings/frameworks` — settings page with three tabs
- "Discover Jobs" button integration — redirect to onboarding route if no framework exists, otherwise no-op (button is visually active but trigger logic is not wired)
- Toast on return to `/jobs` after first save

### Out of scope — do not build, do not scaffold

- Cloudflare Workflow or any job discovery trigger logic
- LLM web search integration
- Scraper logic of any kind
- `POST /api/jobs/discover` endpoint
- Company Research framework form or table
- Contact Search framework form or table
- A/B Testing configuration form or table
- Framework prose generation (no LLM call on save — save typed field values only)
- Version history UI (dropdown to restore previous versions) — store versions in DB but do not build the restore UI

---

## 3. Database schema

### Migration file

Create a new D1 migration file. Follow the existing migration naming convention in the codebase.

```sql
CREATE TABLE job_search_frameworks (
  id                   TEXT PRIMARY KEY,
  created_by              TEXT NOT NULL, -- clerk idxs
  target_roles          TEXT NOT NULL DEFAULT '[]',
  is_remote             BOOELAN NOT NULL DEFAULT 0,
  required_skills               TEXT NOT NULL DEFAULT '[]',
  skills    TEXT NOT NULL DEFAULT '[]',
  min_salary_lpa       REAL NOT NULL DEFAULT 10,
  min_exp        DECIMAL NOT NULL DEFAULT 2,
  max_exp        DECIMAL NOT NULL DEFAULT 5,
  preferred_locations  TEXT NOT NULL DEFAULT '[]',
  -- Pipeline controls
  recency_window  INTEGER NOT NULL DEFAULT 7, -- in days

  -- Meta
  version    INTEGER NOT NULL DEFAULT 1,
  isCustomized         BOOLEAN NOT NULL DEFAULT 0,
);
```

---

## 4. Default constants

Create a constants file at a path consistent with how other constants are organised in the codebase. Export the following:

```ts
export const JOB_SEARCH_FRAMEWORK_DEFAULTS = {
  targetRoles: ["Backend Engineer", "SDE-1", "SDE-2", "Software Engineer", "Backend Developer"],
  isRemote: true,
  requiredSkills: ["Node.js", "Express.js"],
  minSalary: 10,
  minExp: 2,
  maxExp: 5.5,
  skills: ["AWS", "Cloudflare Workers", "Node.js", "Express.js"],
  locations: ["Remote", "India (any city)"],
  recencyWindow: 10,
} as const;
```

---

## 6. API endpoints

Both endpoints live in the existing Hono API Worker. Follow the existing router structure, file organisation, and auth middleware pattern exactly as established in the codebase.

### GET /frameworks/job-search

Returns the latest saved framework for the authenticated user.

**Deserialisation:** Parse all JSON array columns before returning. Return native arrays and booleans — not raw strings.

---

### POST /frameworks/job-search

Saves a new framework version for the authenticated user. Always inserts a new row — never updates existing rows.

All fields required.

---

## 7. Frontend routes

### 7.1 /onboarding/job-search-framework

**Purpose:** First-time framework setup. User arrives here only when they have no saved framework and clicked "Discover Jobs."

**Layout:** Full page. No sidebar. No topbar. horizontally centred in viewport. This is an onboarding page — it should feel focused and calm.

**Loader behaviour:**

- Fetch `GET /api/frameworks/job-search`.
- If the response returns a non-null framework, the user already has one saved. Redirect immediately to `/jobs`. They should not be on this page.
- If null, render the page with `JOB_SEARCH_FRAMEWORK_DEFAULTS` pre-populated into the form.
- Page title: "Set up your job search criteria"
- Subtitle paragraph:
  > "Before searching for jobs, tell us what you're looking for. AI will use these criteria to filter and rank every job it finds — only showing you roles that actually match. You can update these anytime from Settings → Frameworks."
- Divider below header.

2. **Form** — It should have all the fields.

3. Submit button: "Save and continue" — calls `POST /api/frameworks/job-search` with form values, then redirects to `/jobs`. No cancel or skip button on this page. The user must save to proceed.

---

### 7.2 /settings/frameworks

**Purpose:** View and edit saved frameworks. Persistent home for all framework configuration.

**Layout:** Standard app layout — sidebar + main content area.

**Topbar:** "Frameworks" as page title. No CTA button in topbar.

**Tabs:** Three tabs rendered as pill/chip style below the topbar.

| Tab | Label            | State            |
| --- | ---------------- | ---------------- |
| 1   | Job Search       | Fully functional |
| 2   | Company Research | Coming soon      |
| 3   | A/B Testing      | Coming soon      |

Default active tab: Job Search.

**Coming soon tab content** (Company Research and A/B Testing):

- Centred in the content area.
- No other content. No buttons. No placeholder form.

**Job Search tab — loader behaviour:**

- Fetch `GET /api/frameworks/job-search`.
- If null (no framework saved): render form with `JOB_SEARCH_FRAMEWORK_DEFAULTS` pre-populated and a notice banner at the top of the form (see below).
- If non-null: render form with the fetched values pre-populated. Show last updated metadata.

**Job Search tab — content structure:**

1. **Notice banner** — only shown when `isCustomized = false` OR when no framework exists:
   - Message: "You're using default criteria. Update these to match your actual preferences — AI will use them for every future job search."
   - Dismissable per session only (not persisted). Dismissed on close icon click.

2. "Last updated: [relative timestamp] · Version [framework_version]"

3. **Form** — same component as onboarding page.

**Toast on successful save from settings:**

- Message: "Job search criteria updated"

---

## 8. Form component specification

This is a single reusable component used on both `/onboarding/job-search-framework` and `/settings/frameworks`. It receives initial values as props and calls an `onSubmit(values: JobSearchFrameworkInput)` callback. It does not know which page it is on.

All form state is local to the component. No global state management.

### Field specifications

---

**Section: Roles**  
Section label: "Target roles" — Figtree 11px 600 uppercase, `--text-muted`, 0.06em tracking.

**Field: Role titles**  
Label: "Job titles to search for"  
Sublabel: "AI will search for jobs matching any of these titles" — Figtree 12px, `--text-secondary`  
Input type: Tag input  
Behaviour:

- Renders existing values as removable tags
- Text input at the end of the tag list — pressing Enter or comma adds a new tag
- Each tag has an × button to remove it
- Tag style: `--surface-2` background, `--border` border, `border-radius: 6px`, `padding: 3px 8px`, Figtree 12px 500
- × button: `--text-muted`, becomes `--text-primary` on hover
- Validation: at least one tag required. Show inline error if empty on submit.

**Field: Remote preferred**  
Label: "Prefer remote roles"  
Sublabel: "Remote listings will be ranked higher when all else is equal"  
Input type: Toggle (boolean)  
Toggle style: 32px × 18px pill. When on: background `--accent`. When off: background `--border`. Knob is white 14px circle.

---

**Section: Hard requirements**  
Section label: "Hard requirements" — same label style as above.  
Section description: "Jobs missing all of these will be filtered out automatically" — Figtree 12px, `--text-secondary`, shown below the section label.

**Field: Required skills**  
Label: "Required skills (OR logic)"  
Sublabel: "At least one must appear in the job description"  
Input type: Tag input — same behaviour as role titles.  
Validation: at least one tag required. Show inline error if empty on submit.

**Field: Minimum salary**  
Label: "Minimum salary"  
Input type: Number input with unit label  
Layout: `[input field] LPA` — unit label sits inline to the right of the input.  
Input width: 100px.  
Validation: number ≥ 0.

**Field: Experience range**  
Label: "Experience range"  
Layout: `[min input] to [max input] years` — inline, unit label at end.  
Input width: 80px each.  
Validation: both required, min ≥ 0, max ≥ min.

---

**Section: Location**  
Section label: "Location"

**Field: Preferred locations**  
Label: "Preferred cities or regions"  
Sublabel: "Leave empty to accept any location"  
Input type: Tag input — same behaviour as role titles.  
No minimum — array can be empty.

---

**Section: Ranking signals**  
Section label: "Ranking signals"  
Section description: "Jobs with more of these skills will be ranked higher — they are not hard requirements" — Figtree 12px, `--text-secondary`.

**Field: Prioritised skills**  
Label: "Skills to prioritise"  
Input type: Compound repeater — each row has:

- Text input for skill name (flex: 1)
- Priority selector: three chip buttons side by side — "High", "Medium", "Low". Active chip: `--accent-bg` background, `--accent-text` text, `--accent` border. Inactive: `--surface-2` background, `--text-secondary` text, `--border` border.
- Remove button: × ghost icon, `--text-muted`, becomes `--danger` on hover

Below the list: "+ Add skill" ghost button that appends a new empty row with "Medium" pre-selected.  
No minimum — array can be empty.

---

**Section: Search settings**  
Section label: "Search settings"

**Field: Maximum results**  
Label: "Max jobs per search"  
Sublabel: "AI returns at most this many jobs per run"  
Input type: Number input, width 80px, unit label "jobs" to the right.  
Validation: integer 1–100.

**Field: Post recency**  
Label: "Only show jobs posted within"  
Input type: Segmented control — three options: "7 days", "14 days", "30 days".  
Style: pill-style button group. Active: `--accent-bg` bg, `--accent-text` text, `--accent` border. Inactive: `--surface-2` bg, `--text-secondary` text, `--border` border.

---

### Form layout rules

- Each section is separated by a `1px solid --border` divider.
- Section label sits 16px above the first field in the section.
- Field label sits directly above its input (8px gap).
- Sublabel sits 4px below the field label, before the input.
- Gap between fields within a section: 16px.
- All input fields follow the global input spec: `height: 36px`, `padding: 0 12px`, `border-radius: 8px`, `background: --bg`, `border: 1px solid --border`, focus border becomes `--accent`.
- Form max-width matches the page max-width (640px on onboarding, fluid on settings).

---

## 9. "Discover Jobs" button integration

The button already exists on the Jobs page. Wire it up as follows.

**Loader on the Jobs page:**  
Add a call to `GET /api/frameworks/job-search` in the Jobs page loader. The result is `framework: JobSearchFramework | null`.

**Button behaviour:**

```
if framework === null:
  navigate to /onboarding/job-search-framework
else:
  do nothing (button click has no effect beyond this check for now)
  // Trigger logic comes in the next spec
```

Do not disable the button when `framework !== null`. It should look and behave identically in both states — the only difference is what happens on click.

**No loading state on the button click.** The loader already resolved before the page rendered, so the null check is synchronous.

---

## 10. Toast on return to /jobs after first save

After the user saves from `/onboarding/job-search-framework`, they are redirected to `/jobs?framework_saved=1`.

On the Jobs page, read the `framework_saved` query param on mount. If present and equals `"1"`:

- Show a success toast: "Job search criteria saved. You're ready to find jobs."
- Remove the query param from the URL immediately (replace state, do not push) so the toast does not re-appear on refresh.
- Toast auto-dismisses after 4 seconds.

Toast style: `--surface` background, `1px solid --border`, `border-radius: 8px`, `padding: 10px 14px`. Green check icon on the left. Title "Job search criteria saved" Figtree 13px 500. Subtitle "You're ready to find jobs." Figtree 12px `--text-secondary`. Positioned bottom-right, 16px from edge.

---

## 11. Verification checklist

Work through every item manually after implementation. Do not mark this spec complete until all pass.

### Database

- [ ] Migration runs without error on a fresh D1 database
- [ ] `idx_job_fw_user` index exists and is used by the fetch query (verify with `EXPLAIN QUERY PLAN`)
- [ ] Inserting 6 rows for the same user leaves exactly 5 rows after the cleanup query

### GET /api/frameworks/job-search

- [ ] Returns `{ data: null }` for a user with no saved framework
- [ ] Returns correctly deserialised framework (arrays not strings, boolean not integer) for a user with a saved framework
- [ ] Returns 401 for an unauthenticated request

### POST /api/frameworks/job-search

- [ ] Saves correctly with all valid field values
- [ ] `framework_version` increments correctly across multiple saves
- [ ] Returns 400 with `fields` object when `role_titles` is empty
- [ ] Returns 400 with `fields` object when `required_skills` is empty
- [ ] Returns 400 when `exp_max_years` < `exp_min_years`
- [ ] Returns 400 when `recency_window_days` is not 7, 14, or 30
- [ ] Returns 401 for unauthenticated request
- [ ] After 6 saves, only 5 rows remain in the table for that user

### /onboarding/job-search-framework

- [ ] Page renders with all default values pre-populated from `JOB_SEARCH_FRAMEWORK_DEFAULTS`
- [ ] User with an existing framework is immediately redirected to `/jobs`
- [ ] Adding and removing tags works correctly for all tag inputs
- [ ] Priority chip selection works on prioritised skills rows
- [ ] Adding a new prioritised skill row pre-selects "Medium"
- [ ] Removing a prioritised skill row works
- [ ] Submitting with empty `role_titles` shows inline validation error
- [ ] Submitting with empty `required_skills` shows inline validation error
- [ ] Submitting with `exp_max_years` < `exp_min_years` shows inline validation error
- [ ] Successful save redirects to `/jobs?framework_saved=1`
- [ ] Button shows "Saving…" and is disabled during submission
- [ ] API error shows inline error banner

### /settings/frameworks

- [ ] Job Search tab is active by default
- [ ] Company Research tab shows "Coming soon" content only
- [ ] A/B Testing tab shows "Coming soon" content only
- [ ] Job Search tab renders with saved values when framework exists
- [ ] Job Search tab renders with defaults and notice banner when no framework exists
- [ ] Notice banner is dismissable and does not reappear within the same session
- [ ] "Last updated" line shows correct timestamp and version number
- [ ] Successful save shows success toast
- [ ] Toast auto-dismisses after 3 seconds

### Discover Jobs button

- [ ] Clicking with no framework navigates to `/onboarding/job-search-framework`
- [ ] Clicking with an existing framework does nothing

### Return toast

- [ ] Toast appears on `/jobs` when `?framework_saved=1` is in the URL
- [ ] Query param is removed from URL after mount (no `?framework_saved=1` visible to user)
- [ ] Toast does not appear on manual navigation to `/jobs`
- [ ] Toast auto-dismisses after 4 seconds

---

## 12. Prior decisions — do not revisit

These are locked. Do not propose alternatives.

- Separate `job_search_frameworks` table — not a shared `frameworks` table with a `type` column.
- No `form_data` JSON blob column — all fields are typed columns.
- No prose generation step — save typed values directly on form submit. The `content` column does not exist in this table.
- No version restore UI in this spec — store versions in DB, display version number, but no restore functionality.
- No Cloudflare Workflow trigger in this spec — button integration is UI-only.
- Auth and router patterns follow existing codebase conventions exactly — do not establish new patterns.
