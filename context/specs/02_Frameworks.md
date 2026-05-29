# Company Research Framework Form — Implementation Brief

Read and fully understand `CLAUDE.md` before writing any code.
Read `design/screens/onboarding/jsx` and understand every design decision
before writing a single line of UI code. Do not deviate from it.

---

## What you're building

A structured form that collects the user's company evaluation preferences,
sends them to an AI endpoint to generate a natural-language framework
document, lets the user review and edit the generated text, then saves it
as a versioned row in the `frameworks` DB table.

```sql
CREATE TABLE frameworks (
  id          BIGSERIAL PRIMARY KEY,
  created_by     TEXT NOT NULL,             -- Clerk user ID
  type        integer NOT NULL,             -- 1 = 'company research',  2 = 'job search' , 3 = 'ab testing'
  content     TEXT NOT NULL,             -- generated natural-language framework text
  form_inputs TEXT,                      -- JSON snapshot of the form state that produced this text
  version     smallint NOT NULL,          -- 1, 2, 3... per user per type
  is_customized boolean NOT NULL DEFAULT false,
  created_at  TEXT NOT NULL             -- ISO 8601
);

-- desc by version, take the first one = latest
CREATE INDEX idx_frameworks_created_by
  ON frameworks (created_by, type, version);
```

The form lives in two places:

- Onboarding wizard: `/onboarding/step-1`
- Settings: `/settings/frameworks?tab=company`

Both use the same shared component: `CompanyResearchFrameworkForm.tsx`.
No logic differences — only layout wrapper differences.

---

## Route and file structure for frontend

```
web/src
    /shared/
        /forms
            - CompanyResearchFrameworkForm.tsx ← shared form component
        /fields
            - ScoredCriteriaField.tsx ← the repeatable per-criterion builder
    /routes/_authenticated/
        - onboarding/step-1.tsx ← wraps CompanyResearchFrameworkForm
        - settings?tab=frameworks ← also wraps CompanyResearchFrameworkForm
        - -data.ts ← for data fetching
```

For backend & packages file structure, check already existing patterns from Notes feature.

---

## Form fields

All fields pre-populated from Appendix A defaults on first load.
If an existing saved framework exists (settings context), pre-populate
from the latest saved version instead.

### 1. Salary Range

- Two number inputs: Min LPA and Max LPA
- Defaults: min 12, max 16
- Validation: min < max, both required, both ≥ 0

### 2. Acceptable Locations

- Multi-select + free text (tag input pattern)
- Pre-populated options: Remote, Hybrid (India), On-site (India)
- User can add custom city/region tags via free text
- At least one location required

### 3. Ethics Red Flags

- Multi-select + free text (tag input pattern)
- Pre-populated from Appendix A: data privacy violations, active regulatory
  action, public reputation scandals, predatory monetization (dark patterns,
  surveillance)
- User can add custom flags via free text
- User can remove any pre-populated flag
- Empty state: allowed (user may choose no ethics gate)

### 4. Scored Criteria (repeatable)

This is the core of the form. Each criterion is a sub-form with:

- `name` (text input, required) — e.g. "Work-Life Balance & Culture"
- `why_it_matters` (textarea, required) — user's reasoning
- `what_to_look_for` (textarea, required) — signals to check
- `weight` (stepper 0–5, required) — contribution to total score
- `auto_no_go` (checkbox) — if scored 0, kills company regardless of total

Controls:

- "Add criterion" button appends a blank criterion at the bottom
- Each criterion has a remove button (trash icon). Minimum 1 criterion required.
- Drag-to-reorder (priority order matters — P1 is highest priority)
- Priority label (P1, P2, P3…) shown as a read-only badge, auto-updates on reorder

Defaults: P1–P8 from Appendix A pre-populated in order:
P1 Work-Life Balance & Culture (weight 5)
P2 Manager Quality & Role Clarity (weight 5)
P3 Company Stability (weight 4)
P4 Learning & Mentorship (weight 4)
P5 Clear Advancement Pathways (weight 3)
P6 Tech Health & Stack (weight 3)
P7 Team Integration & Culture (weight 2)
P8 Impactful Projects (weight 1)

### 5. Decision Band Thresholds

- Two number inputs: Strong Fit threshold (%) and Conditional Fit threshold (%)
- Defaults: Strong Fit ≥ 80%, Conditional Fit ≥ 60%
- Validation: Strong > Conditional, both between 1–99
- Helper text: "Weak Fit = anything below Conditional threshold"
- Show computed example: "With 8 default criteria, max = 135.
  Strong Fit ≥ 108, Conditional Fit ≥ 81." Updates live as user
  changes criteria/weights.

### 6. Auto No-Go Flags

- Derived from the Scored Criteria field — not a separate input
- Shown as a read-only checklist reflecting `auto_no_go` state from
  each criterion. Clicking an item jumps to that criterion in the form.
- "If any of these criteria score 0, the company is rejected regardless
  of total score."
- If no criteria have auto_no_go checked: show empty state "None set —
  enable Auto No-Go on any criterion above."

---

## "See an example" panel (onboarding context only)

Collapsible section. Collapsed by default.

Contains:

1. A filled example of the form (static, not interactive)
2. A short excerpt of the generated framework text it produces
3. One line explaining the downstream AI effect, e.g.:
   "When Work-Life Balance weight is 5, the AI flags any company where
   Glassdoor WLB rating is below 3.8 as a likely miss."

Do not show this panel in the settings context.

---

## API: POST /api/frameworks/generate

**Trigger:** User clicks "Generate Framework" button.
**Input:** Full form state as JSON (all 6 field groups above).
**Behaviour:** Calls Claude API with a system prompt that converts the
structured form data into a natural-language framework document.
The generated text is the actual string injected into the company
research cron at runtime.
**Output:** `{ framework_text: string }`
**Loading state:** Button shows spinner + "Generating…" during the call.
The rest of the form remains interactive.
**Error state:** If the call fails, show an inline error below the button.
Do not clear the form.

**Validation before calling:** Run full form validation first.
If invalid, surface field errors and do not fire the API call.

---

## Review & Edit step

After a successful `/api/frameworks/generate` response:

- Transition the view to show a full-height textarea pre-filled with
  `framework_text`
- User can freely edit the text
- "Back to form" link re-opens the form with the original inputs intact
  (do not reset on back navigation)
- "Save framework" primary button saves to DB

This is a step transition within the same page — not a new route.
Track step state locally: `"form" | "review" | "saved"`.

---

## Save behaviour: PUT /api/frameworks/company

On "Save framework":

- Creates a new versioned row in the `frameworks` table:
  `{ user_id, type: "company_research", content: framework_text, updated_at }`
- In settings context: show success toast "Framework saved" and remain
  on the review step with the saved text.
- In onboarding context: navigate to `/onboarding/wizard/step-2` on success.
- On error: show inline error. Do not navigate away.

---

## Settings-specific behaviour

- Load and display the current active framework text (latest version) in
  a read-only box at the top of the page before the form
- Show "Last saved: [relative timestamp]" next to the framework label
- Show a version history dropdown (last 5 versions, each with its
  timestamp). Selecting a version restores it into the review textarea
  for re-saving (does not auto-save)
- "Edit framework" button opens the form pre-filled with the latest
  saved form inputs (if stored) OR leaves fields at defaults if only
  raw text was ever saved

---

## Design constraints (non-negotiable)

- Tailwind only. No inline styles.
- Use design tokens from styles.css.
- Responsive: mobile-first. On mobile, the ScoredCriteria drag-to-reorder
  becomes up/down arrow buttons instead of drag handles.

# Appendix A — Company Research Framework (Default Template)

### Stage 1 — Pre-Filters (Hard Constraints)

Both must pass. If either fails, stop — do not score.

| Criterion   | What to Check                                                                                                                                           | Result      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Salary Band | Confirm offered CTC is within user's configured range (default: 12–16 LPA). Check JD, Glassdoor, AmbitionBox. If undisclosed, estimate from peer roles. | Pass / Fail |
| Location    | Role must be fully remote OR based in India. Hybrid with 2–3 days on-site in India is acceptable.                                                       | Pass / Fail |

---

### Stage 2 — Ethics Gate

Flag if any of the following are present. A flagged company is surfaced for conscious human review — it does not auto-disqualify.

**Red flags to check:** Known data privacy violations, active regulatory action, public reputation scandals, predatory monetization (dark patterns, surveillance). Check Glassdoor reviews, news, LinkedIn employee tenure patterns.

---

### Stage 3 — Scored Criteria

Score 0–5 × weight. Sum for `weighted_score`. Max = sum of (weight × 5) across all criteria.

| Score | Meaning                                           |
| ----- | ------------------------------------------------- |
| 5     | Fully met — clear, verifiable evidence            |
| 4     | Mostly met — strong signals, one minor gap        |
| 3     | Partially met — mixed signals. Flag for interview |
| 2     | Mostly not met — weak evidence, significant gaps  |
| 1     | Barely met — one weak signal only                 |
| 0     | Not met — no evidence or clear counter-evidence   |

| Priority | Criterion                      | Weight | Key Signals                                                                                                                                                               |
| -------- | ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Work-Life Balance & Culture    | 5      | JD language (flag: "family", "thrives under pressure", "many hats"). Glassdoor WLB rating ≥ 3.8. Avg. LinkedIn tenure ≥ 2 yrs. Fixed 5-day, ≤ 10hr/day norms.             |
| P2       | Manager Quality & Role Clarity | 5      | JD lists measurable outcomes (not just responsibilities). HM has mentorship history on LinkedIn. Role is a defined backfill or growth hire — not a vague opening.         |
| P3       | Company Stability              | 4      | Profitable or well-funded (runway ≥ 18 months). Headcount stable or growing. No recent mass layoffs. B2B SaaS, established product, or logistics preferred.               |
| P4       | Learning & Mentorship          | 4      | Dedicated learning budget or time (e.g. 20% time, L&D stipend). Senior engineers with mentorship history. Structured onboarding. Engineering blog or public talks.        |
| P5       | Clear Advancement Pathways     | 3      | Levelling framework exists (SDE1→SDE2, IC2→IC3). Internal promotions visible on LinkedIn. Performance review cycle defined. HM can articulate "great in 12 months."       |
| P6       | Tech Health & Stack            | 3      | Stack aligns with user's target skills. Engineering blog/GitHub shows modern practices (CI/CD, observability, microservices). Low Glassdoor complaints about legacy code. |
| P7       | Team Integration & Culture     | 2      | Team size proportional (not ≥ 30 engineers to one manager). Cross-functional collaboration in JD. Good peer review sentiment. Low internal-transfer churn.                |
| P8       | Impactful Projects             | 1      | Real users/revenue. Non-trivial engineering challenges (scale, reliability, ML, data). Ask in interview: "What shipped last quarter?"                                     |

---

### Decision Bands

| Band            | Score                                    | Decision                                            |
| --------------- | ---------------------------------------- | --------------------------------------------------- |
| Strong Fit      | ≥ 80% of max                             | Apply aggressively. Prioritise in pipeline.         |
| Conditional Fit | 60–79% of max                            | Apply if pipeline is thin. Flag gaps for interview. |
| Weak Fit        | < 60% of max                             | Skip unless strong internal connection.             |
| Auto No-Go      | Any criterion marked Auto No-Go scores 0 | No-Go regardless of total score.                    |

> Default max for the Appendix A configuration (8 criteria, weights summing to 27) is 135. Users who add, remove, or reweight criteria will have a different maximum — thresholds are always evaluated as a percentage of that user's actual maximum.
