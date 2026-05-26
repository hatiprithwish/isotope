# Product Requirements Document

## Isotope — AI-Powered Job Search Operations Platform

**Version:** 2.0  
**Author:** Prithwish Hati  
**Date:** May 2026  
**Stack:** Hono + Cloudflare Workers + Cloudflare D1 + TanStack Start  
**Auth:** Clerk  
**Email Delivery:** Resend  
**App Domain:** `app.isotope.work`

---

## 1. Product Overview

Isotope is a multi-user, AI-first web application that helps job seekers manage their entire job search pipeline — from company discovery and research, to contact outreach, to application tracking. AI handles research, drafting, sequencing, and daily prioritisation. Humans only review, approve, and send.

The mental model is a **calm daily ritual**: the user arrives each morning, sees exactly what needs attention on the Today screen, acts on it, and leaves feeling in control.

---

## 2. Core Design Principles

- **Status-driven everything.** Every record in every database has a status. All AI automation is triggered by status transitions, not manual triggers.
- **Human in the loop at key gates.** AI researches and drafts; humans approve before anything moves forward.
- **Two types of AI instruction — fixed system prompts and user-owned frameworks.** Email drafting and contact search are fixed system-level processes that do not vary per user — they are baked into the LLM system prompt permanently (sourced from Appendices B and D). Company research, job search, and A/B testing vary per user — each user builds and owns their own version via a structured form builder. The LLM always fetches the latest saved version of a user-owned framework at runtime — never a cached version.
- **Form-first framework building.** User-owned frameworks are never written from scratch. Users fill a structured form; the system generates the full framework text; the user reviews and optionally edits the text before saving.
- **Multi-user from day one.** All user-owned frameworks, A/B configurations, and pipeline data are scoped to individual users. Fixed system prompts are shared infrastructure — not stored per user.
- **Context-aware drafting.** Every draft is aware of the full conversation history, cross-channel activity, company context, job description (when available), and personalisation research.

---

## 3. User Onboarding

### 3.1 Sign-Up Flow

- Users sign up via Clerk (email/password + social SSO).
- Auth screen (desktop): split-panel layout. Left brand panel shows tagline "Find your exact match.", 3 product bullet points, and footer "v1.7 · Secured by Clerk · Made for engineers in India". Right panel: Clerk form. SSO buttons in 2-column grid on desktop, stacked on mobile.
- SSO callback screen: animated 3-dot pulse loader, "Signing you in…" heading.
- After account creation, the user is presented with two onboarding paths:
  - **Quick start** — All three user-owned frameworks are seeded from Appendix A/C/E defaults and saved as v1 immediately. The wizard is skipped entirely. AI jobs can run right away.
  - **Full setup** — The standard onboarding wizard guides the user through all three framework forms step by step (see §3.3). Frameworks can still be skipped — skipped frameworks are flagged as incomplete and block AI jobs until completed.
- Frameworks seeded via Quick start are **not** flagged as incomplete. They are marked with `seeded_from_default: true` in the `frameworks` table. A persistent amber defaults banner appears in Settings → Frameworks for each seeded framework.

### 3.2 Onboarding Path Selection Screen

**Desktop layout:** Two cards side by side + footer note.

**Quick Start card:** Shows connected accounts (Google, Apollo, Resend — each with green "Connected" indicator), defaults preview grid (Salary band, Locations, Required skills, A/B variant), primary "Quick start" CTA. Label: "Recommended · 30 sec".

**Full Setup card:** Label "~8 min", secondary CTA.

**Footer note:** "Either way, the fixed system prompts (email drafting, contact search) are already active — they apply to everyone identically and are not user-configurable."

**Mobile layout:** Full-bleed hero (Wordmark xl, tagline "Your job search, on autopilot.", amber time strip "AI works 1:00 – 2:00 AM · digest at 8:00 AM") + two stacked cards. No preview grid on mobile.

### 3.3 Framework Types

| Type                      | Frameworks                                | Per User? | Editable?          | Storage               |
| ------------------------- | ----------------------------------------- | --------- | ------------------ | --------------------- |
| **Fixed system prompts**  | Email Drafting, Contact Search            | No        | No                 | Codebase / env config |
| **User-owned frameworks** | Company Research, Job Search, A/B Testing | Yes       | Yes — form builder | `frameworks` DB table |

Fixed system prompts are not stored per user and do not appear in the onboarding wizard. They DO appear in Settings → Frameworks as a read-only reference section.

### 3.4 Onboarding Wizard — User-Owned Frameworks

The wizard covers the three user-owned frameworks. Each follows the same **form → generated text → review → save** flow.

Each form step includes a collapsible "See an example" panel. Collapsed by default.

**Wizard steps:**

| Step | Framework                  | Can Skip?                |
| ---- | -------------------------- | ------------------------ |
| 1    | Company Research Framework | Yes — flagged incomplete |
| 2    | Job Search Framework       | Yes — flagged incomplete |
| 3    | A/B Testing Configuration  | Yes — flagged incomplete |

**Mobile Step 1 — Company Research:**
Live summary strip at top: Selected count (accent), High priority count (accent-text), Dealbreakers count (danger-text). Criteria list with importance rating (Low/Medium/High) per selected criterion and Dealbreaker toggle when importance=High. "Add your own criterion" row at bottom. Review screen shows generated framework text + character count. Footer: Back + Save & continue.

**Mobile Step 2 — Job Search:**
Fields: Target role titles (tag input), Hard-required skills (OR logic), Prioritised skills (High/Medium), Minimum salary (₹ LPA), Experience range, Results cap (default 20), Recency window (7/14/30 days). Footer: Skip ghost + Generate framework primary.

**Mobile Step 3 — A/B Config:**
Active variable (dropdown, 5 options), Variant A card (Question-based + example), Variant B card (Observation-based + example), Assignment: "Alternate (A/B/A/B…)" — labelled "v1 only". Footer: Skip ghost + Generate & finish primary.

**Desktop Step 1 — 4 form cards + sticky right rail:**
Cards: Stage 1 Pre-filters (salary range, locations), Stage 2 Ethics gate (flag tags), Stage 3 Scored criteria (drag handle, name, weight stepper, auto no-go toggle, delete), Decision bands (Strong fit ≥ / Conditional fit ≥ inputs). Right rail: sticky amber AI box with example framework narrative. Footer (sticky): Skip ghost + "Save & next: Job Search →" secondary + "Generate framework" primary (spark icon).

**Quick Start confirmation screen:** "You're set up." (26px 600), check circle in `--accent-bg`, amber time indicator "Next run: tonight · 1:00 AM IST", "What runs overnight" card, "Take me to Today" full-width primary CTA.

### 3.5 Framework Form Specs

#### Company Research Framework Form

| Field                       | Input Type                      | Notes                                                                                             |
| --------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| Salary range (min–max, LPA) | Number range                    | Used in Stage 1 pre-filter                                                                        |
| Acceptable locations        | Multi-select + free text        | Remote, Hybrid, On-site; cities                                                                   |
| Ethics red flags to check   | Multi-select + free text        | Pre-populated with defaults; user can add/remove                                                  |
| Scored criteria             | Per-criterion form (repeatable) | Criterion name, why it matters, what to look for, weight (0–5). User can add, remove, or reorder. |
| Decision band thresholds    | Number inputs                   | Strong Fit ≥ X, Conditional Fit ≥ Y                                                               |
| Auto No-Go criteria         | Checkbox per criterion          | Which criteria, if scored 0, auto disqualify                                                      |

#### Job Search Framework Form

| Field                            | Input Type                                | Notes                      |
| -------------------------------- | ----------------------------------------- | -------------------------- |
| Target role titles               | Tag input                                 |                            |
| Hard-required skills             | Tag input                                 | e.g. Node.js OR Express.js |
| Prioritised skills               | Tag input with priority (High/Medium/Low) |                            |
| Minimum salary (LPA)             | Number                                    |                            |
| Experience range (min–max years) | Number range                              |                            |
| Results cap                      | Number                                    | Default: 20                |
| Recency window                   | Buttons                                   | 7 / 14 / 30 days           |

#### A/B Testing Configuration Form

| Field                     | Input Type     | Notes                                                           |
| ------------------------- | -------------- | --------------------------------------------------------------- |
| Active variable           | Dropdown       | Subject line, Preview text, CTA copy, Send time, Body structure |
| Variant A — style/pattern | Text + example | e.g. "Question-based"                                           |
| Variant B — style/pattern | Text + example | e.g. "Observation-based"                                        |
| Assignment method         | Radio          | Alternate (A/B/A/B) — only option in V1                         |

### 3.6 Editing Frameworks After Onboarding

All three user-owned frameworks are editable at any time from **Settings → Frameworks**. Each edit opens the same form → generated text → review → save flow. Every save creates a new versioned row. The five most recent versions are retained and restorable. The LLM always uses the latest saved version at runtime.

---

## 4. Data Model

### 4.1 Companies Database

| Field                | Type      | Notes                                                                                      |
| -------------------- | --------- | ------------------------------------------------------------------------------------------ |
| id                   | UUID      | Primary key                                                                                |
| user_id              | UUID      | FK → Users (Clerk user ID)                                                                 |
| name                 | String    |                                                                                            |
| website              | String    |                                                                                            |
| industry             | String    |                                                                                            |
| size                 | String    | e.g. 50–200, 1000+                                                                         |
| location             | String    |                                                                                            |
| stage1_salary_pass   | Boolean   | Pre-filter: salary band check                                                              |
| stage1_location_pass | Boolean   | Pre-filter: location check                                                                 |
| stage2_ethics_status | Enum      | `clear` / `flagged`                                                                        |
| stage2_ethics_notes  | Text      | AI notes on ethics flags                                                                   |
| fit_scores           | JSON      | Array of `{ priority, name, score, weight, score_confidence, overridden }`                 |
| weighted_score       | Integer   | Sum of (score × weight) across all criteria                                                |
| fit_band             | Enum      | `strong_fit` / `conditional_fit` / `weak_fit` / `disqualified`                             |
| ai_summary           | Text      | AI-generated research narrative                                                            |
| user_context         | Text      | User-supplied context (insider info, referrals). Injected into scoring prompt if non-null. |
| notes                | Text      | Manual user notes                                                                          |
| status               | Enum      | See §4.1.1                                                                                 |
| failed_at            | Timestamp | Set when cron fails. Null if no failure.                                                   |
| retry_count          | Integer   | Number of failed cron attempts. Default 0.                                                 |
| created_at           | Timestamp |                                                                                            |
| updated_at           | Timestamp |                                                                                            |

#### 4.1.1 Company Status Lifecycle

```
Not Started
    │
    ├── (cron fails, retry_count < 3) → failed_at set, retry_count++, retried next night
    ├── (retry_count = 3) → Failed ──► [surface in digest "Needs attention"; manual retry]
    │
    ▼ (cron: AI runs 3-stage company research)
Waiting for Human
    │
    ├── Rejected by Human ──► [terminal: retained in DB]
    │
    └── Accepted by Human
            │
            ▼ (cron: AI finds contacts)
        Contacts Added
            │
            ▼ (user updates manually)
            ├── Interviewed
            ├── Offer
            └── Rejected
```

All companies — including Rejected, Weak Fit, Disqualified — are retained permanently. The AI queries this history before suggesting new companies to avoid re-researching known ones.

---

### 4.2 Contacts Database

| Field                        | Type      | Notes                                                                                               |
| ---------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| id                           | UUID      | Primary key                                                                                         |
| user_id                      | UUID      | FK → Users                                                                                          |
| company_id                   | UUID      | FK → Companies                                                                                      |
| job_id                       | UUID      | FK → Jobs (nullable)                                                                                |
| name                         | String    |                                                                                                     |
| designation                  | String    |                                                                                                     |
| email                        | String    | Nullable                                                                                            |
| linkedin_url                 | String    | Nullable                                                                                            |
| linkedin_connected           | Boolean   | Whether connection request accepted                                                                 |
| sequence_position            | Integer   | Current touch point (1, 2, or 3)                                                                    |
| last_touch_at                | Timestamp | When last message was marked sent                                                                   |
| next_touch_due_at            | Timestamp | Computed: last_touch_at + 7 days                                                                    |
| dead_at                      | Timestamp | When contact was marked Dead                                                                        |
| re_engage_at                 | Timestamp | Computed: dead_at + 60 days                                                                         |
| ab_variable                  | String    | Which variable is being tested                                                                      |
| ab_variant                   | String    | `A` or `B`                                                                                          |
| ab_replied                   | Boolean   | Whether this contact replied (win condition)                                                        |
| status                       | Enum      | See §4.2.1                                                                                          |
| conversation_history         | JSON      | Chronological log of all touches (see §4.2.2)                                                       |
| draft_body                   | Text      | AI-generated draft (overwritten per touch)                                                          |
| draft_subject                | Text      | Email subject line                                                                                  |
| personalization_notes        | Text      | Claude Haiku summary from web research                                                              |
| manual_personalization_notes | Text      | User-supplied personalisation context. Takes precedence over personalization_notes in draft prompt. |
| reengagement_recommendation  | Text      | AI one-sentence recommendation on whether to re-engage or pivot. Set at Re-Engage transition.       |
| source                       | Enum      | `apollo` / `manual`                                                                                 |
| notes                        | Text      | Manual user notes                                                                                   |
| failed_at                    | Timestamp | Set when cron fails.                                                                                |
| retry_count                  | Integer   | Default 0.                                                                                          |
| created_at                   | Timestamp |                                                                                                     |
| updated_at                   | Timestamp |                                                                                                     |

#### 4.2.1 Contact Status Lifecycle

```
Not Started
    │
    ├── Both personalization_notes AND manual_personalization_notes ARE NULL
    │       → held at Not Started; surfaces in digest + Today "Needs your input"
    │       → draft runs once either field is populated, or user clicks "Generate anyway"
    │
    ├── (cron fails, retry_count < 3) → failed_at set, retry_count++, retried next night
    ├── (retry_count = 3) → Failed ──► [surface in digest "Needs attention"; manual retry]
    │
    ▼ (cron 1:00 AM: AI drafts Touch 1)
Draft Ready
    │
    ├── Draft Ready > 3 days without Mark as Sent → surfaces in digest as stalled (inline badge)
    │
    ▼ (user copies draft, sends manually, clicks "Mark as Sent" with inline confirm)
In Pipeline  (sequence_position = 1)
    │
    ├── 7 days no reply → cron drafts Touch 2 → Draft Ready (sequence_position = 2)
    │       └── sent → In Pipeline (seq = 2)
    │               ├── 7 days no reply → cron drafts Touch 3 → Draft Ready (seq = 3)
    │               │       └── sent → In Pipeline (seq = 3)
    │               │               └── 7 days no reply → Dead
    │               └── Reply → Replied
    │
    ├── Replied ──► (conversation continues; user manages manually)
    ├── Closed  ──► (positive outcome)
    └── Dead
            │
            ▼ (cron: re_engage_at <= now → Re-Engage)
        Re-Engage
            │
            ▼ (AI runs re-engage assessment → reengagement_recommendation stored)
            ▼ (cron 1:00 AM: AI drafts re-engagement Touch 1 with full prior history)
        Draft Ready (re-engagement: same 3-touch, 7-day structure restarts)
```

#### 4.2.2 Conversation History Schema

Append-only JSON array. Each entry:

```json
{
  "id": "uuid",
  "type": "email_sent | linkedin_sent | email_received | linkedin_received",
  "date": "ISO 8601 timestamp",
  "subject": "email subject or null",
  "body": "full message text",
  "sequence_position": 1,
  "ab_variable": "subject_line",
  "ab_variant": "A",
  "channel": "email | linkedin"
}
```

---

### 4.3 Jobs Database

| Field        | Type      | Notes                                                      |
| ------------ | --------- | ---------------------------------------------------------- |
| id           | UUID      | Primary key                                                |
| user_id      | UUID      | FK → Users                                                 |
| company_id   | UUID      | FK → Companies (nullable until company research triggered) |
| title        | String    |                                                            |
| jd_text      | Text      | Full job description text                                  |
| source_url   | String    | Where it was found                                         |
| source       | String    | `linkedin` / `naukri` / `ai_suggested` / `manual`          |
| salary_range | String    | Nullable                                                   |
| location     | String    |                                                            |
| status       | Enum      | See §4.3.1                                                 |
| notes        | Text      |                                                            |
| created_at   | Timestamp |                                                            |
| updated_at   | Timestamp |                                                            |

#### 4.3.1 Job Status Lifecycle

```
AI Suggested / Manually Added → Waiting for Human
    │
    ▼ (user reviews JD)
    ├── Rejected ──► [terminal]
    │
    └── Accepted
            │
            ▼ (if company not in DB: triggers company creation → Not Started)
            │  (if company exists and Accepted: skip research, proceed)
        Company Added
            │
            ▼ (user updates manually)
            ├── Applied
            ├── Interviewing
            ├── Offer
            └── Rejected
```

---

## 5. AI Workflows

### 5.1 Company Research (Triggered by Company Status: Not Started)

**Cron schedule:** Daily at 1:00 AM (per user timezone)  
**Input:** Company record + latest Company Research Framework (fetched from DB at runtime — never cached)

**Process — 3 stages in strict order:**

**Stage 1 — Pre-Filters (binary pass/fail):**

- Check salary band within user's configured range (default: 12–16 LPA). Verify via JD, Glassdoor, AmbitionBox.
- Check location: remote or India-based. Hybrid (2–3 days on-site in India) acceptable.
- If either fails → `fit_band = disqualified`, status → `Waiting for Human` with Stage 1 failure reason. Do not proceed to Stage 2.

**Stage 2 — Ethics Gate (pass/fail):**

- Check for: data privacy violations, active regulatory action, public reputation scandals, predatory monetisation.
- Sources: Glassdoor reviews, news search, LinkedIn employee tenure patterns.
- If flagged → `stage2_ethics_status = flagged`, document in `stage2_ethics_notes`. Still advance to scoring but surface flag prominently.
- A flagged Ethics Gate does NOT automatically disqualify — it surfaces for conscious human review.

**Stage 3 — Scored Criteria:**

Score each user-defined criterion 0–5, multiply by weight, sum for `weighted_score`. Maximum = sum of (weight × 5) across the user's criteria — varies per user.

If `user_context` is non-null, inject into scoring prompt before AI runs.

For each criterion, output `score` (0–5) and `score_confidence`:

- **high** — multiple corroborating sources
- **medium** — one or two signals, no contradictions
- **low** — no direct signals; score is inferred or estimated

**Score → fit_band mapping (percentage of user's maximum):**

| Band            | Threshold                         | Decision                                            |
| --------------- | --------------------------------- | --------------------------------------------------- |
| Strong Fit      | ≥ 80% of max                      | Apply aggressively. Prioritise in pipeline.         |
| Conditional Fit | 60–79% of max                     | Apply if pipeline is thin. Flag gaps for interview. |
| Weak Fit        | < 60% of max                      | Skip unless strong internal connection.             |
| Auto No-Go      | Any Auto No-Go criterion scores 0 | No-Go regardless of total.                          |

**Output:** Populate `fit_scores`, `weighted_score`, `fit_band`, `stage1_*`, `stage2_*`, `ai_summary`. Status → `Waiting for Human`. Surface in Today "Companies to review" and digest.

**On failure:** Set `failed_at = now`, increment `retry_count`. Retry if `retry_count < 3`. After 3 failures → `status = Failed`.

---

### 5.2 Contact Search (Triggered by Company Status: Accepted by Human)

**Trigger:** Company status → `Accepted by Human`  
**Input:** Company name + latest Contact Search Framework  
**Credit cost:** 1 Apollo credit per person enriched

**Process — 6 steps:**

**Step 1 — Apollo Search:** Call Apollo contact search with company name. Filter to hardcoded target title list (see §Appendix D). Returns up to 10 stubs (last names obfuscated).

**Step 1.5 — Conservative Pre-Dedup (before enrichment):**
Check Contacts DB for obvious match (first name exact + high designation similarity at same company, ≥ 0.90 confidence). If match found → log as `skipped_pre_dedup`, skip enrichment. No credit consumed. When in doubt → proceed.

**Step 2 — Enrichment (people/match):** Call Apollo `people/match` with `email_reveal = true`. Returns: full name, LinkedIn URL, work email. Costs 1 credit per person.

**Step 3 — Deduplication:** Check Contacts DB for existing record with same `linkedin_url` scoped to `user_id`. If match → skip. No duplicate created.

**Step 4 — Contact Record Creation:** Create record with `name`, `designation`, `email`, `linkedin_url`, `company_id`, `source: apollo`, `status: Not Started`.

**Step 5 — Personalisation Research:** For each new contact, run 3 DuckDuckGo searches:

1. `"[full name]" "[company name]" engineer`
2. `"[full name]" site:medium.com OR site:dev.to OR "talk" OR "conference"`
3. `"[full name]" site:github.com`

Feed results to Claude Haiku: _"Summarize anything useful for personalizing a cold email to this person — public writing, talks, open source work, professional interests, notable career moves. Be specific and brief. If nothing useful is found, return null."_

Write summary to `personalization_notes`. If null → surface contact in Today/digest "Needs your input".

**Step 6 — Company Status Update:** If ≥ 1 new contact created → company status: `Contacts Added`. If 0 → flag `no_contacts_found`, surface for manual review.

**Manual contact entry:** Users add contacts via "Add contact manually" button. Manual contacts enter at Step 4 directly (`source: manual`). Trigger same Haiku personalisation (Step 5). No Apollo credit consumed. Subject to same LinkedIn URL dedup.

---

### 5.3 Email + LinkedIn Draft Generation

**Cron schedule:** Daily at 1:00 AM  
**Trigger conditions:**

- `contact.status = Not Started` AND (`personalization_notes IS NOT NULL` OR `manual_personalization_notes IS NOT NULL`) → draft Touch 1
- `contact.status = Not Started` AND both null → hold; surface in Today/digest "Needs your input"
- `contact.status = In Pipeline AND next_touch_due_at <= now` (Touch 2 or 3)

**Context bundle passed to LLM:**

- User background and resume summary
- Latest Email Drafting Framework (never cached)
- Company record: AI summary, fit scores, ethics notes, user_context
- Job description text (if job_id linked; if null, write exploratory outreach)
- Full `conversation_history` for this contact
- Cross-channel awareness flag
- Personalisation context: `manual_personalization_notes` takes precedence; if both present, both passed
- Current `sequence_position` and `ab_variant`

**A/B testing:**

- Active variable fetched from user's A/B settings at draft time (never cached)
- **Variant A — Question-based:** Subject line as direct specific question. Pattern: _"Quick question about [their stack / team / challenge]"_
- **Variant B — Observation-based:** Subject line as specific observation. Pattern: _"Noticed you [scaled X / shipped Y / moved from A to B]"_
- **Assignment:** Strict alternation (A, B, A, B) in order contacts are processed. Stored in `ab_variant` at draft time — never changes for that contact.
- **Variable continuity:** When active variable changes, new contacts get the new variable. Existing contacts keep original variable for their entire sequence.
- **Win condition:** User clicks "Mark as Replied" → `ab_replied = true`.

**Draft logic per channel availability:**

| Email available | LinkedIn available + connected | Drafts generated                                      |
| --------------- | ------------------------------ | ----------------------------------------------------- |
| Yes             | No                             | Email draft only                                      |
| No              | Yes                            | LinkedIn DM draft only                                |
| Yes             | Yes                            | Both — LinkedIn DM references prior email on Touch 2+ |

**Output:** Draft in `draft_body` / `draft_subject`. Status → `Draft Ready`. Surface in Today/digest "Drafts ready".

**On failure:** Set `failed_at = now`, increment `retry_count`. Retry up to 3×. After 3 → `status = Failed`.

---

### 5.4 Re-Engagement Draft (Triggered by Contact Status: Re-Engage)

**Condition:** `contact.status = Re-Engage AND re_engage_at <= now`

**Step 1 — Re-engage assessment:**
Fetch all contacts at the same `company_id` for this user. Pass summary to LLM: _"Given these contacts and their statuses at [Company], recommend in one sentence whether to re-engage [Name] or pivot to another contact."_ Store in `contact.reengagement_recommendation`. Surfaces as amber banner above the contact panel tab bar.

**Step 2 — Draft:**
Same as §5.3, plus: full prior 3-touch sequence passed as context. Draft must feel like a natural continuation — not a cold restart.

**Output:** Draft in `draft_body`. Status → `Draft Ready`.

---

### 5.5 Job Discovery (AI-Suggested)

**Trigger:** "Discover jobs" button in app OR scheduled weekly  
**Input:** User's Job Search Framework + existing Jobs DB

**Process:**

1. Fetch user's Job Search Framework
2. Search external sources (LinkedIn, Naukri, company career pages)
3. Cross-check against existing Jobs DB — skip any JD already present
4. Create new job records with `status: Waiting for Human`
5. Surface in Today "Jobs to review" section and morning digest

---

## 6. Outreach Sequence Rules (Global, Fixed)

| Touch     | Channel                         | Timing                             | LLM instructions                                                      |
| --------- | ------------------------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Touch 1   | Email + LinkedIn (if connected) | On `Not Started` → `Draft Ready`   | First message. Lead with them. One frictionless CTA.                  |
| Touch 2   | Email + LinkedIn (if connected) | 7 days after Touch 1 marked Sent   | New angle or proof point. LinkedIn DM references prior email if sent. |
| Touch 3   | Email + LinkedIn (if connected) | 7 days after Touch 2 marked Sent   | Final angle. Acknowledge it's the last touch. Leave door open.        |
| Stop      | —                               | 7 days after Touch 3 with no reply | Status → Dead. Sets `dead_at`. Schedules `re_engage_at`.              |
| Re-engage | Email + LinkedIn                | 60 days after `dead_at`            | 3-touch sequence restarts. Full history as context.                   |

**Key rules:**

- The 7-day timer starts from when the user clicks "Mark as Sent" — not when the draft was generated.
- If LinkedIn connection not yet accepted (`linkedin_connected = false`), LinkedIn drafts are held.
- Every touch is aware of all prior touches across both channels via `conversation_history`.

---

## 7. Morning Digest Email

**Schedule:** Daily at user-configured time (default: 8:00 AM, user's timezone)  
**Delivery:** Resend → `digest@isotope.work` → user's registered Clerk email  
**Format:** HTML email, max-width 600px. Only sections with content are included.

**Section order (4 sections):**

### Section 1: Needs your input

- Contacts held at Not Started because both personalisation note fields are null
- For each: Name, Company, Designation, link to contact detail page

### Section 2: Drafts ready

- All contacts with `status: Draft Ready`
- For each: Name, Company, Touch #, Channel (Email / LinkedIn / Both), direct deep link
- **Stalled items** (Draft Ready > 3 days) shown INLINE in this section with "STALLED" badge and "Did you send it?" CTA in warning colours — no separate stalled section in the email

### Section 3: Companies to review

- All companies with `status: Waiting for Human`
- For each: Company name, fit_band verdict, Ethics flag if present, direct deep link

### Section 4: Needs attention

- Companies and contacts with `status: Failed`
- For each: Name, type (Company / Contact), failure reason if available, deep link with "Retry" action

**Deep links:** Plain app URLs (`app.isotope.work/contacts/[uuid]`). No signed tokens, no expiry. Clerk handles auth — unauthenticated users redirected to `/login?redirect=[original_url]`.

---

## 8. Frontend — Page Structure

### 8.1 Navigation & Routes

**Navigation:** 4 primary items — **Today | Companies | Contacts | Jobs**  
Plus: **Settings** (below divider in sidebar, gear icon on mobile).

**Route map:**

| Route                      | Layout                            | Notes                    |
| -------------------------- | --------------------------------- | ------------------------ |
| `/today`                   | Sidebar + 2-column content        | Primary landing page     |
| `/companies`               | Sidebar + table + optional panel  | Panel opens on row click |
| `/companies?panel=[id]`    | Sidebar + table + panel open      | Panel pre-opened         |
| `/companies/[id]`          | Fullscreen detail                 | Expand icon              |
| `/companies/[id]/contacts` | Company contacts subpage (mobile) | Apollo enrichment log    |
| `/contacts`                | Sidebar + table + optional panel  |                          |
| `/contacts?panel=[id]`     | Sidebar + table + panel open      |                          |
| `/contacts/[id]`           | Fullscreen detail                 |                          |
| `/jobs`                    | Sidebar + table + optional panel  |                          |
| `/jobs?panel=[id]`         | Sidebar + table + panel open      |                          |
| `/jobs/[id]`               | Fullscreen detail                 |                          |
| `/settings`                | Sidebar + 4-tab settings          |                          |

**Sidebar:** Wordmark `Isotope¹³` (15px 600 + 9px accent superscript). Nav items with icons. Settings below divider. User block (avatar, name, email) at bottom.

**Mobile:** Bottom tab bar (`MTabBar`) with Today, Companies, Contacts, Jobs.

---

### 8.2 Today Page

Primary landing screen. No table — purely an action digest with daily context.

**Mobile layout:** Single column. Header shows **Wordmark** (not page title) + bell icon + settings icon. Decorative circles behind header.

**Desktop layout:** 2-column grid — left column (1fr) + right sticky column (320px).

**Right column (sticky, desktop only):**

1. **AI Activity Card** (amber-accented): overnight run stats — Drafts written, Companies researched, Contacts found, etc.
2. **Pipeline Glance Card**: 4 counters — In conversation / Awaiting reply / Replied / Dead this week

**Desktop topbar:** "Today" title, sub-title with date + time ("Tuesday, May 20, 2026 · 8:14 AM IST"), notification bell with count badge, "Preview digest" secondary button.

**7 action sections (left column / mobile):**

| Section              | Source                                                           |
| -------------------- | ---------------------------------------------------------------- |
| Needs your input     | Contacts held at Not Started — both note fields null             |
| Needs attention      | Failed records (companies + contacts)                            |
| Drafts ready         | Draft Ready contacts (stalled shown inline with "STALLED" badge) |
| Stalled drafts       | Draft Ready > 3 days                                             |
| Companies to review  | Waiting for Human companies                                      |
| Jobs to review       | Waiting for Human jobs                                           |
| Follow-ups due today | In Pipeline, next_touch_due_at = today                           |

Footer text: "You're all caught up after these." — centred, 12px muted.

Each section header: icon + UPPERCASE label (11px 600) + count pill. Rows: `--surface` bg card, `border-radius: 10px`. Stalled rows include "Mark as sent" + "Open" buttons inline.

---

### 8.3 Companies Page

**Topbar:** "Companies" title + "Add company" primary button.  
**Filter bar:** Status chip, Fit Band chip.

**Mobile grouped sections:** "Needs review (N)" + "In progress (N)". Each row: avatar, name (with `⚠` ethics warning icon inline if flagged), industry · size, fit badge, score `{score}/{max}`.

**Desktop table columns:**

| Column   | Width | Content                                                                |
| -------- | ----- | ---------------------------------------------------------------------- |
| Company  | 28%   | Name (500) + `⚠` ethics icon inline if flagged + website (muted below) |
| Industry | 15%   | Muted text                                                             |
| Fit Band | 16%   | Fit band badge                                                         |
| Score    | 10%   | `{score}/{max}` primary, percentage muted below                        |
| Status   | 15%   | Status badge                                                           |
| Updated  | 8%    | Relative timestamp                                                     |

**There is NO separate Ethics column.** The ethics flag `⚠` (`color: var(--warning)`) is inline in the Company name cell.

**Company Detail Panel — sections top to bottom:**

1. **Header + footer buttons:**
   - Desktop footer (3 buttons): Reject (danger) + Accept (secondary) + Accept · find contacts (primary)
   - Mobile footer (2 buttons): Reject (danger) + Accept · find contacts (primary)
   - Retry button visible when `status = Failed`

2. **User context field** — labelled "Your context for AI". Freetext textarea. Appears at top of panel body, editable at any status.

3. **Score card:**
   - `{total}` (32px 600) + `/ {max}` (14px muted) + percentage right-aligned (green ≥80%, warning ≥60%, secondary otherwise)
   - Progress bar: 6px height, border-radius 3px, colour-coded fill
   - Threshold markers: `1px solid --border-strong` vertical lines at 60% and 80%
   - Scale labels: "Weak | Conditional 60% | Strong 80%"
   - Fit band badge + percentage below bar

4. **Pre-filter results** — "Salary" and "Location" pass/fail badges. Only after Stage 1.

5. **Ethics gate** — Only after Stage 2. "Ethics: clear" or "Ethics: flagged" badge. If flagged: danger callout with AI notes.

6. **Scored criteria table** — criterion name + weight (`w{N}`) + confidence (amber dot + "Low confidence" for low). Score stepper (minus/number/plus) if `Waiting for Human`; read-only otherwise. Desktop: weighted contribution column `{score × weight}` (11px muted right-aligned).

7. **Fit band summary** — large fit band badge + "Score: X / max Y". Updates live as scores edited.

8. **AI research summary** — full narrative. Collapsible after 4 lines. Amber AI research box.

9. **Linked contacts** — list with name, designation, status badge. "Add contact manually" button.

10. **Linked jobs** — list with title and status badge.

11. **Notes** — freetext textarea.

---

### 8.4 Company Contacts Subpage (Mobile)

Route: `/companies/[id]/contacts`

Header: Company name + "N people · N in pipeline". Plus icon for adding contacts manually.

**Apollo Enrichment Log card:**

- Stubs returned: 5
- Skipped pre-dedup: 1
- Enriched: 4
- Dedup by LinkedIn URL: 2
- Apollo credits used: 4 (in `--accent-text` 600)

Below: contact list rows in standard format.

---

### 8.5 Contacts Page

**Topbar:** "Contacts" title + "Add contact" primary button.  
**Filter bar (desktop):** 4 chips — Status (default "Draft ready"), Company ("All"), Channel ("All"), Fit ("All bands"). Row count right-aligned.  
**Mobile chips (7):** All, Draft ready, In pipeline, Needs input, Replied, Re-engage, Dead.  
**Mobile grouped sections:** "Drafts ready · ready to send (N)" → "In pipeline (N)" → "Other (N)".

**Desktop table columns:**

| Column  | Width  | Content                                   |
| ------- | ------ | ----------------------------------------- |
| Name    | ~2fr   | Name (500), designation (muted below)     |
| Company | ~1.4fr | Company name (500) + fit band badge below |
| Touch   | 80px   | T1/T2/T3 in `--accent` colour             |
| Channel | 1fr    | Channel badge                             |
| Status  | 110px  | Status badge                              |
| Next    | 90px   | Next touch date (muted)                   |

**Contact Detail Panel — 3-tab structure:**

Tab bar: Draft | History | About. History tab shows unread-count badge.

**Meta bar** (mobile, below header, above tabs): company link + fit band badge + status badge + A/B pill. flex-wrap row.

**Draft tab (content order):**

1. Section label: `✦ Touch {N} · {channel}` (left) + `Drafted {age} ago` (right)
2. Subject line box with "Copy" button
3. Body box with "Copy body" button
4. Desktop: "Copy subject + body" combined button below. Mobile: "Copy subject", "Copy body", "Copy all" buttons.
5. Context used in draft: amber AI box + user notes. "edit in About tab" link right-aligned.
6. Conversation history preview (1–2 most recent)
7. A/B variant callout (standard callout, not amber)
8. Panel footer (never scrolls): Mark as sent (primary) + Mark as replied (secondary) + spacer + Mark dead (danger — far right)

**Re-engage state:** Amber banner callout ABOVE the tab bar (not inside it) with AI recommendation + prior sequence log (Touch 1/2/3 dates + outcomes).

**History tab:**

- Thread summary bar: "N messages · 1 reply · Channel"
- Chat bubbles:
  - **Sent** (right-aligned): `border-radius: 16px 16px 4px 16px`, `--accent-bg` bg, user avatar right
  - **Received** (left-aligned): `border-radius: 16px 16px 16px 4px`, `--surface` bg, contact avatar left
  - max-width 82%, padding 11px 14px
- After thread if replied: "Marked as replied" success badge + timestamp

**About tab (content order):**

1. Identity card: name, designation, email (copy), phone (if present)
2. Contact channels card: email (copy) + LinkedIn (external link)
3. Linked company card: name + fit band badge + link
4. Sequence info card: Touch N of 3, Channel, A/B pill, Source (Apollo · enriched date)
5. Notes textarea
6. "Mark as dead" danger ghost at bottom

**"Mark as Sent" flow:**
Button replaced inline (no modal) with: "Did you send this to [Name]? [Not yet] [Yes, sent]". Mobile: after confirming, callout appears: "Sequence advances on confirmation. Touch 2 will be drafted at 1:00 AM if you don't hear back in 7 days."

**Contact "Needs Input" state:**

- Callout: "Held at Not Started. AI ran personalisation search but didn't find public writing, talks, or shared context."
- AI search results card: 3 search queries each with ✗ icon + "0 useful" + "Haiku returned null."
- Personalisation textarea with field help: "Saving this triggers a new draft tonight at 1:00 AM."
- Footer: "Generate anyway" secondary (spark icon) + "Save context" primary

**Contact "Failed" state:**

- Failure log card: 3 timestamped entries with warning icon + error string
- Footer: "View error log" ghost + "Retry now" primary

**Contact "Re-engage" state:**

- Amber banner above tabs: AI one-sentence recommendation
- Prior sequence card: Touch 1/2/3 dates + "no reply" + "Marked dead" date
- Footer: "Skip · don't send" secondary + "Send re-engage" primary

**New Contact Form:**
Full name*, Company* (search or add), Designation, Email, LinkedIn URL + "LinkedIn connection accepted" indicator, Personalisation context, Linked job (optional).
Help text: "Manual contacts skip the Apollo search. AI will still run personalisation research on Claude Haiku before drafting."

---

### 8.6 Jobs Page

**Desktop topbar:** "Jobs" title + "Discover jobs" (spark icon, secondary) + "Add manually" (plus icon, secondary).  
**Mobile:** Amber discover strip at top: "Find new jobs matching your framework" + "Discover" button.  
**Mobile chips (6):** All, Needs review (N), Accepted (N), Applied, AI suggested, Rejected.  
**Mobile grouped sections:** Needs review (N) + In progress (N) + Rejected (N).

**Desktop table columns:**

| Column   | Width | Content                               |
| -------- | ----- | ------------------------------------- |
| Title    | 2fr   | Job title (500) + company muted below |
| Company  | 1.2fr | Company name                          |
| Location | 0.8fr | Location                              |
| Salary   | 120px | Salary range badge (neutral)          |
| Status   | 110px | Status badge                          |
| Added    | 80px  | Relative timestamp                    |

**Job Detail Panel:**

- Meta row: status badge + fit badge + source badge + salary badge (flex-wrap)
- 2×2 meta grid: Company, Location, Salary, Added
- Linked company card with fit band badge
- Full JD text in scrollable box (desktop truncated to 700 chars)
- Source link row (mobile only): tappable row with external URL + external icon + chevron
- Notes textarea
- Footer (if `Waiting for Human`): "Reject" danger + "Accept · add company" primary

**New Job Form:**
Title, Company (linked), Location, Salary, Source URL, Source selector (4 buttons: LinkedIn / Naukri / Manual / Other), Job description textarea.

---

### 8.7 Settings Page

4 tabs: **Frameworks | Analytics | Digest | Account**

**Desktop tab bar:** horizontal, 44px height, below topbar, `--accent` underline on active tab.

---

#### Frameworks Tab

3 framework cards (Company Research, Job Search, A/B Testing). Each card:

- Title + "Using defaults" amber badge (if seeded — card gets amber border)
- Description + tags (surface-2 pills: "3 versions", "8 criteria", "Max 135 pts")
- "View versions" ghost + "Edit" secondary buttons
- Footer: "Updated {date} · v{N}" in 11px muted

**Defaults banner** (amber bg, if any framework is seeded):
"[Framework] is still using defaults. Personalise it to improve results." + "Edit now" secondary-sm.

**Fixed system prompts section** (below framework cards, read-only):
Listed with bullet dots. Header: "Fixed prompts — not user-configurable." Explanation text: these apply to all users identically, not in onboarding, not editable. Email Drafting and Contact Search shown for reference.

---

#### Analytics Tab

**Sufficient data state (≥ 20 contacts per variant):**

- Data table: Variant | Assigned | Replies | Rate (grid: `1fr 70px 60px 80px`)
- Visual bar chart: "A · Question" in `--accent`, "B · Observation" in `--amber`
- Confidence label: e.g. "moderate confidence" (inline text)
- Win condition card below chart
- **Switch active variable** section: radio list of 5 testable variables. Field help: "Historical results are retained when you switch. New contacts get the new variable; existing contacts keep theirs."

**Low data state (< 20 contacts per variant):**
"Not enough data yet. You need at least 20 contacts per variant."
Progress bars per variant (e.g. A: 8/20, B: 7/20) in `--border-strong`.

**There is no 20–50 "low confidence" tier.** The single threshold is 20 contacts per variant.

---

#### Digest Tab

- **Time selector:** Quick-select 7 AM / 8 AM / 9 AM + custom time input
- **Timezone:** Selector (default IST)
- **Delivery address:** User's email + green "Verified" badge + explanation: "Digest goes to your registered Clerk email. All digest links are plain app URLs — no expiry, no signed tokens."
- **Preview send:** "Send preview now" secondary button
- **Next digest callout:** `--success-bg` bg, green border-left. Text: "Next digest: Tomorrow, [date], at [time] [tz]."

---

#### Account Tab

- **Profile card:** name, email, edit icon, Username row, Member since row
- **Connected accounts:** Google (Connected) + GitHub (Not connected / Connect button)
- **Danger zone:** "Sign out of all devices" + "Delete account" — both secondary buttons in `--danger` colour

---

## 9. Cron Jobs Summary

| Job                    | Schedule                     | Trigger Condition                                                                               | Action                                                                                                                        |
| ---------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Company Research       | Daily 1:00 AM                | `company.status = Not Started AND (failed_at IS NULL OR retry_count < 3)`                       | Run 3-stage research → Waiting for Human. Failure: set failed_at, retry_count++. After 3 → Failed.                            |
| Contact Finder         | On status change             | `company.status = Accepted by Human`                                                            | Pre-dedup → Apollo search → people/match enrichment → LinkedIn URL dedup → create contacts → Haiku research → Contacts Added. |
| Email/LinkedIn Drafter | Daily 1:00 AM                | `contact.status = Not Started AND notes non-null` OR `In Pipeline AND next_touch_due_at <= now` | Draft touches, assign A/B → Draft Ready. On failure: retry up to 3×.                                                          |
| Re-engagement Drafter  | Daily 1:00 AM                | `contact.status = Re-Engage AND re_engage_at <= now`                                            | Re-engage assessment → reengagement_recommendation → draft Touch 1 → Draft Ready.                                             |
| Dead Marker            | Daily 1:00 AM                | `contact.status = In Pipeline AND seq = 3 AND last_touch_at + 7d <= now`                        | → Dead, set dead_at, compute re_engage_at                                                                                     |
| Re-engage Scheduler    | Daily 1:00 AM                | `contact.status = Dead AND re_engage_at <= now`                                                 | → Re-Engage                                                                                                                   |
| Stalled Draft Detector | Digest assembly time         | `contact.status = Draft Ready AND updated_at <= now - 3d`                                       | Surface as inline stalled in digest Section 2. No status change.                                                              |
| Morning Digest         | Daily (user-configured time) | Always                                                                                          | Compile 4 sections, send via Resend from digest@isotope.work                                                                  |
| Job Finder             | Weekly or on-demand          | Scheduled or manual trigger ("Discover jobs" button)                                            | Find new jobs, dedupe → Waiting for Human                                                                                     |

---

## 10. Technical Architecture

### 10.1 Stack

| Layer              | Technology                                                       |
| ------------------ | ---------------------------------------------------------------- |
| Backend            | Hono on Cloudflare Workers                                       |
| Database           | Cloudflare D1 (SQLite-compatible)                                |
| Frontend           | TanStack Start                                                   |
| AI                 | Anthropic Claude API (Claude Haiku for personalisation research) |
| Cron               | Cloudflare Workers Cron Triggers                                 |
| Email Delivery     | Resend (from: digest@isotope.work)                               |
| Auth               | Clerk                                                            |
| Contact Enrichment | Apollo API                                                       |
| Web Search         | DuckDuckGo (3 searches per contact for Haiku research)           |

### 10.2 Key Architectural Decisions

**Framework storage — two types:**

- **Fixed system prompts** (Email Drafting, Contact Search): codebase / env config. Same for all users. Not in DB.
- **User-owned frameworks** (Company Research, Job Search, A/B Testing): `frameworks` table with `(user_id, type, content, updated_at, seeded_from_default)`. Every AI job fetches `WHERE user_id = ? AND type = ? ORDER BY updated_at DESC LIMIT 1` at runtime. Last 5 versions retained per framework per user.

**Multi-tenancy:** Every table has `user_id` (Clerk user ID). All queries filter by `user_id`. No cross-user data access.

**Cron scoping:** Workers Cron Triggers fire globally. Each job queries all pending records across all users, then processes each user's records using that user's own framework fetched at runtime.

**Context bundle construction:** `ContextBuilder` service assembles the full LLM input before every AI call: latest framework + company record + job record (or null) + full conversation history. Passed as structured system + user messages to Claude API.

**A/B test tracking:** Variant assigned at draft time. `ab_variable`, `ab_variant`, `ab_replied` stored per contact. Analytics query aggregates reply rates by variant per user per variable.

**Deep links:** All digest links and fullscreen routes are plain app URLs (`app.isotope.work/...`). No signed tokens, no expiry. Clerk session middleware handles auth — unauthenticated users redirected to `/login?redirect=[original_url]`.

**Cron failure handling:** All AI cron jobs implement retry logic via `failed_at` + `retry_count`. On exception: set `failed_at = now`, increment `retry_count`, log error. After 3 failures: `status = failed`. Failed records surface in Today "Needs attention" and digest Section 4.

**Pre-dedup credit optimisation:** Conservative pre-dedup step before Apollo `people/match`. 0.90+ confidence threshold (first name exact + high designation similarity at same company). Post-enrichment LinkedIn URL dedup remains definitive check.

---

## 11. Out of Scope for V1

The following are explicitly deferred. Items marked **Post-V1 priority** are known gaps with planned future work.

- **LinkedIn API integration** _(Post-V1 priority)_ — All LinkedIn DM actions require manual copy-paste in V1. Full integration would allow direct send, auto-detect `linkedin_connected`, and DM delivery tracking.
- **Automated job portal scraping** _(Post-V1 priority)_ — Job discovery in V1 uses AI-assisted search. Structured crawling and real-time alerts deferred.
- Auto-sending emails
- Gmail API integration (no auto-send or inbox sync)
- Team or shared workspaces
- Calendar integration
- Mobile app (responsive web is the V1 mobile experience)
- Automated open/click tracking (reply tracking is manual)

---

## 12. Open Items

| #   | Item                                          | Status                        |
| --- | --------------------------------------------- | ----------------------------- |
| 1   | Company Research Framework (scored criteria)  | ✅ Resolved — see §Appendix A |
| 2   | Email Drafting Framework                      | ✅ Resolved — see §Appendix B |
| 3   | Contact Search Framework                      | ✅ Resolved — see §Appendix D |
| 4   | Job Search Framework                          | ✅ Resolved — see §Appendix C |
| 5   | Auth provider                                 | ✅ Resolved — Clerk           |
| 6   | Email delivery provider                       | ✅ Resolved — Resend          |
| 7   | A/B variant structure for first test variable | ✅ Resolved — see §Appendix E |

---

## Appendix A — Company Research Framework (Default Template)

> **Note:** This is the default template used to pre-populate the Company Research form for new users during onboarding. It is not hardcoded system behaviour. Each user's active framework is whatever they have saved in Settings — which may differ from this default. The AI always fetches the user's latest saved version at runtime.

### Stage 1 — Pre-Filters (Hard Constraints)

Both must pass. If either fails, stop — do not score.

| Criterion   | What to Check                                                                                                                                           | Result      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Salary Band | Confirm offered CTC is within user's configured range (default: 12–16 LPA). Check JD, Glassdoor, AmbitionBox. If undisclosed, estimate from peer roles. | Pass / Fail |
| Location    | Role must be fully remote OR based in India. Hybrid with 2–3 days on-site in India is acceptable.                                                       | Pass / Fail |

### Stage 2 — Ethics Gate

Flag if any of the following are present. A flagged company is surfaced for conscious human review — it does not auto-disqualify.

**Red flags to check:** Known data privacy violations, active regulatory action, public reputation scandals, predatory monetisation (dark patterns, surveillance). Check Glassdoor reviews, news, LinkedIn employee tenure patterns.

### Stage 3 — Scored Criteria

Score 0–5. Multiply by weight. Sum for weighted_score. Maximum = sum of (weight × 5) for all criteria.

| Score | Meaning                                           |
| ----- | ------------------------------------------------- |
| 5     | Fully met — clear, verifiable evidence            |
| 4     | Mostly met — strong signals, one minor gap        |
| 3     | Partially met — mixed signals. Flag for interview |
| 2     | Mostly not met — weak evidence, significant gaps  |
| 1     | Barely met — one weak signal only                 |
| 0     | Not met — no evidence or clear counter-evidence   |

| Priority | Criterion                      | Weight | Key Signals                                                                                               |
| -------- | ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------- |
| P1       | Work-Life Balance & Culture    | 5      | JD language (flag: "family", "thrives under pressure"). Glassdoor WLB ≥ 3.8. Avg LinkedIn tenure ≥ 2 yrs. |
| P2       | Manager Quality & Role Clarity | 5      | JD lists measurable outcomes. HM has mentorship history on LinkedIn. Defined backfill or growth hire.     |
| P3       | Company Stability              | 4      | Profitable or well-funded (runway ≥ 18 months). Stable or growing headcount. No recent mass layoffs.      |
| P4       | Learning & Mentorship          | 4      | Learning budget or 20% time. Senior engineers with mentorship history. Engineering blog.                  |
| P5       | Clear Advancement Pathways     | 3      | Levelling framework. Internal promotions visible on LinkedIn. Defined performance review cycle.           |
| P6       | Tech Health & Stack            | 3      | Stack aligns with target skills. Modern practices (CI/CD, observability). Low tech-debt complaints.       |
| P7       | Team Integration & Culture     | 2      | Proportional team size. Cross-functional collaboration in JD. Good peer review sentiment.                 |
| P8       | Impactful Projects             | 1      | Real users/revenue. Non-trivial engineering challenges.                                                   |

**Decision bands:**

| Band            | Score                             | Decision                                            |
| --------------- | --------------------------------- | --------------------------------------------------- |
| Strong Fit      | ≥ 80% of max                      | Apply aggressively. Prioritise in pipeline.         |
| Conditional Fit | 60–79% of max                     | Apply if pipeline is thin. Flag gaps for interview. |
| Weak Fit        | < 60% of max                      | Skip unless strong internal connection.             |
| Auto No-Go      | Any Auto No-Go criterion scores 0 | No-Go regardless of total score.                    |

> Default max for the Appendix A configuration (8 criteria, weights summing to 27) is 135. Users who add, remove, or reweight criteria will have a different maximum — thresholds are always evaluated as a percentage of that user's actual maximum.

---

## Appendix B — Email Drafting Framework (Fixed System Prompt)

> **Note:** This is a **fixed system prompt** — it applies to all users identically and is not user-configurable. It is not stored in the `frameworks` DB table and does not appear in onboarding. It appears in Settings → Frameworks as a read-only reference. It is injected into every email drafting LLM call at the system level.

### The Four-Check Filter

Run every draft through these before marking it ready. If it fails any one, rewrite.

1. **Get to the point** — Is the purpose clear by line 3? If not, cut.
2. **Instantly grab attention** — Does the opening line make them want to read the next line? If not, rewrite it.
3. **Answer WIIFM** — Is there one clear, specific reason for them to reply? If not, the draft isn't ready.
4. **Follow up without being rude** — Each follow-up adds a new angle or proof point. Never just bump the thread.

### Structural Rules

- **Length:** 5–9 sentences. Under 150 words ideal.
- **Opening:** Lead with something specific about them — their work, their company, a likely problem they have. Never open with who you are.
- **WIIFM:** One specific, verifiable reason for them to reply. Tied to their context, not generic.
- **Proof point:** One sharp metric or outcome. Numbers beat credentials.
- **CTA:** One small, frictionless ask. A yes/no question. Never ask for a meeting in the first touch.
- **Subject line:** Short, lowercase, specific. Never salesy.

### Personalization Standard

Personalization must be real and specific. Acceptable: specific observations about their company, role, public writing, or a verifiable company metric. Not acceptable: "I love your work" or any statement applicable to anyone.

### Follow-Up Rules

- Touch 2: New angle. Reference that the prior message went unanswered — briefly. Add a new observation or proof point.
- Touch 3: Final touch. New angle. Acknowledge it's the last message. Leave the door open warmly.
- Re-engagement (after 60 days): Feels like a resumption of the same conversation — not a cold restart.

### Channel-Specific Notes

- **Email:** Full subject line + body. Preview text matters.
- **LinkedIn DM (Touch 1):** Same core message. Slightly more conversational tone.
- **LinkedIn DM (Touch 2+):** If email was sent first, reference it: "I sent you an email last week but didn't hear back — reaching out here in case this is a better channel."

---

## Appendix C — Job Search Framework (Default Template)

> **Note:** This is the default template used to pre-populate the Job Search form for new users during onboarding. It is not hardcoded system behaviour. Each user's active framework is whatever they have saved in Settings.

### Search Scope

- **Recency:** Jobs posted within the last 7 days only.
- **Geography:** Any city in India. Remote roles preferred and ranked higher.
- **Results cap:** Top 20 best matches, ranked by fit.

### Target Role Titles

Backend Engineer, SDE / SDE-1 / SDE-2, Software Engineer, Software Developer, Backend Developer.

### Required Skills Filter (Hard Gate)

**Node.js OR Express.js MUST appear in the job description.** If neither present, exclude regardless of other signals.

### Prioritised Skills (Ranking Signal)

| Skill                        | Priority |
| ---------------------------- | -------- |
| Node.js                      | High     |
| Express.js                   | High     |
| AWS                          | Medium   |
| Cloudflare (Workers, D1, KV) | Medium   |

### Filters

| Parameter  | Constraint                                                              |
| ---------- | ----------------------------------------------------------------------- |
| Salary     | ≥ ₹10 LPA (exclude if explicitly lower ceiling; include if undisclosed) |
| Experience | 2–5 years                                                               |
| Location   | Any city in India; remote or hybrid acceptable                          |

### Ranking Logic

1. Node.js AND Express.js both present
2. Node.js OR Express.js + AWS
3. Node.js OR Express.js + Cloudflare
4. Node.js OR Express.js only
5. Remote > on-site (among ties)
6. More recent posting date (among ties)

---

## Appendix D — Contact Search Framework (Fixed System Prompt)

> **Note:** This is a **fixed system prompt** — it applies to all users identically, is not user-configurable, and is not stored in the `frameworks` DB table. It appears in Settings → Frameworks as a read-only reference.

### Target Title List (Hardcoded Filter)

Engineering Manager, Head of Engineering, VP of Engineering, VP Engineering, CTO, Chief Technology Officer, Technical Recruiter, Tech Recruiter, Talent Acquisition, Recruiting Manager, Director of Engineering, Engineering Lead, Backend Engineering Manager.

### Enrichment Pipeline

```
Apollo Search (company name + title filter)
    │
    ▼ Returns up to 10 stubs (last names obfuscated)
    │
    ▼ Pre-dedup check (conservative, per stub):
      - Query Contacts DB: first name exact + high designation similarity at same company
      - Threshold: ≥ 0.90 confidence → skip enrichment, log as skipped_pre_dedup
      - When in doubt → proceed to enrichment
    │
    ▼ For each non-skipped stub: call people/match (email_reveal = true)
      - Cost: 1 Apollo credit per person
      - Returns: full name, LinkedIn URL, work email
    │
    ▼ Deduplication check (definitive)
      - Query: linkedin_url = ? AND user_id = ?
      - Match → skip. No duplicate created.
    │
    ▼ Create contact record
      - Fields: name, designation, email, linkedin_url, company_id, source = apollo, status = Not Started
    │
    ▼ Personalisation research (per new contact)
      - Search 1: "[full name]" "[company]" engineer
      - Search 2: "[full name]" site:medium.com OR site:dev.to OR "talk" OR "conference"
      - Search 3: "[full name]" site:github.com
      - Feed to Claude Haiku: "Summarize anything useful for personalizing a cold email to this
        person — public writing, talks, open source work, professional interests, notable
        career moves. Be specific and brief. If nothing useful is found, return null."
      - Write to contact.personalization_notes
      - If null → surface in Today/digest "Needs your input"
    │
    ▼ Company status update
      - ≥ 1 new contact → company.status = Contacts Added
      - 0 contacts → flag no_contacts_found, status stays Accepted by Human
```

**Manual contact entry** bypasses Steps 1 (Apollo search) and 2 (enrichment). Enters at record creation with `source = manual`. Personalisation research runs identically. No Apollo credit consumed.

### Deduplication Rule

Deduplication is by `linkedin_url` scoped to `user_id`. Same person at different companies → treated as same person and deduplicated.

### Credit Management Note

Apollo credits consumed at enrichment time (Step 2). Conservative pre-dedup eliminates obvious duplicates before enrichment. Post-enrichment LinkedIn URL dedup remains definitive. Some duplicate spend still possible at the conservative threshold — acceptable tradeoff.

---

## Appendix E — A/B Testing Configuration (Default Template)

> **Note:** This is the default template for the A/B Testing form. Each user's active A/B configuration is whatever they have saved in Settings.

### Active Variable

**Subject Line** (first variable to test)

### Variant Definitions

| Variant | Style             | Pattern                                               | Example                                     |
| ------- | ----------------- | ----------------------------------------------------- | ------------------------------------------- |
| A       | Question-based    | Direct, specific question tied to recipient's context | _"Quick question about your backend stack"_ |
| B       | Observation-based | Specific observation about the recipient or company   | _"Noticed you scaled X to Y"_               |

The LLM generates actual subject line text at draft time using recipient context, company research, and `personalization_notes`. The variant definition is the **style instruction** — not a fixed template.

### Assignment Method

Strict alternation in the order contacts are processed by the cron job:

```
Contact 1 → Variant A
Contact 2 → Variant B
Contact 3 → Variant A
Contact 4 → Variant B
...
```

Assignment written to `ab_variant` at draft time. Never changes for that contact.

### Variable Continuity Rule

- **New contacts** receive the current active variable at draft time.
- **Existing contacts** retain their original variable and variant for their entire sequence including re-engagement.

### Win Condition & Tracking

| Metric              | How Tracked                     | Field               |
| ------------------- | ------------------------------- | ------------------- |
| Reply (primary win) | User clicks "Mark as Replied"   | `ab_replied = true` |
| Click (secondary)   | Manual in V1 — not auto-tracked | —                   |

### Analytics View (Settings → Analytics Tab)

| Variant               | Contacts Assigned | Replies | Reply Rate |
| --------------------- | ----------------- | ------- | ---------- |
| A (Question-based)    | N                 | N       | N%         |
| B (Observation-based) | N                 | N       | N%         |

**Confidence threshold:** < 20 contacts per variant → "Not enough data yet" — reply rate table hidden. ≥ 20 contacts per variant → table and chart shown.

There is no separate 20–50 "low confidence" tier. The single threshold is 20 contacts per variant.

### Available Variables for Future Tests

| Variable             | What Changes                                                 |
| -------------------- | ------------------------------------------------------------ |
| Subject line         | Style of the email subject (current)                         |
| Preview text         | Snippet visible below subject in inbox                       |
| CTA copy/placement   | Wording and position of the closing ask                      |
| Send time            | Morning (7–9 AM) vs evening (4–6 PM) in recipient's timezone |
| Email body structure | Short and punchy vs detailed with more context               |

---

_Document status: v2.0 — Reflects all design-phase decisions. See changelog below._

## v2.0 Changelog (from v1.7)

**Product / app changes:**

- App renamed from JobTracker to **Isotope**. App domain: `app.isotope.work`. Digest sent from `digest@isotope.work`.
- Wordmark redesigned as `Isotope¹³` with accent superscript (no dot).
- Navigation expanded from 3 to 4 items — **Today** added as primary landing page.
- Today screen added (§8.2) — primary daily home, replaces direct navigation to Companies table.

**Today screen (§8.2 — new):**

- Desktop 2-column layout: 7 action sections (left) + AI Activity Card + Pipeline Glance Card (right sticky).
- 7 sections mirror morning digest but with inline row actions.
- AI Activity Card (amber) shows overnight run stats.
- Pipeline Glance Card shows 4 pipeline counters.

**Companies (§8.3):**

- Ethics flag moved INLINE into Company name cell — no separate Ethics column.
- Score column shows `{score}/{max}` + percentage (not bare number).
- Score progress bar with threshold markers (60%, 80%) now in detail panel only (not table).
- Company detail footer: mobile = 2 buttons (Reject + "Accept · find contacts"), desktop = 3 (adds standalone Accept).

**Company Contacts Subpage (§8.4 — new):**

- Mobile subpage `/companies/[id]/contacts` with Apollo enrichment log card.

**Contacts (§8.5):**

- Contact detail panel redesigned with **3-tab structure**: Draft | History | About.
- History tab renders as chat bubbles (sent = accent-tinted right-aligned, received = surface border left-aligned).
- About tab: identity card, contact channels, linked company, sequence info, notes, mark dead.
- Draft tab order: draft → context used → history preview → A/B callout → footer actions.
- Re-engage banner appears ABOVE the tab bar (not inside it).
- Desktop filter bar adds Fit chip (4 chips total, not 3).
- Desktop table adds Channel and Next columns.
- Contact "Needs Input", "Failed", and "Re-engage" states fully specified.
- New contact form fields fully specified.

**Jobs (§8.6):**

- Topbar buttons: "Discover jobs" (spark icon) + "Add manually" (not "Add job" + "Find new jobs").
- Mobile: amber discover strip instead of separate button.
- Desktop table: Salary column added.
- Job detail: source link row on mobile. Footer: "Accept · add company" (not "Accept · find contacts").
- New job form: source selector (4 options) + source URL field.

**Settings (§8.7):**

- Expanded from 3 content sections to **4 full tabs**: Frameworks | Analytics | Digest | Account.
- Analytics tab: data table + visual bar chart + switch variable section. Single threshold at 20 contacts (no 20–50 tier).
- Digest tab: 7/8/9 AM quick-select + timezone + delivery address + next digest callout.
- Account tab: profile card, connected accounts, danger zone.
- Fixed system prompts: appear in Frameworks tab as read-only reference section (corrects prior v1.7 statement that they "do not appear in Settings").

**Digest (§7):**

- Reduced from 7 to **4 sections**. Stalled drafts merged inline into Drafts ready (STALLED badge). Jobs-to-review and follow-ups sections removed from email (in-app only via Today).
- Digest email sender: `digest@isotope.work`.

**Auth (§3.1):**

- Desktop split-panel layout specified. Tagline "Find your exact match." SSO callback screen with animated pulse loader.

**Onboarding (§3.2–§3.4):**

- Desktop path selection: connected accounts block (Google, Apollo, Resend) with "Connected" indicators.
- Desktop quick start card: defaults preview grid (2×2).
- Mobile: full-bleed hero with amber time strip. Quick start card: "Recommended · 30 sec" label.
- All 3 wizard steps fully specified (mobile + desktop).
- Quick start confirmation screen: "You're set up." check circle + amber time indicator + "What runs overnight" card.

**A/B analytics threshold (Appendix E):**

- Corrected: single threshold at 20 contacts per variant. Previous v1.7 showed 3 tiers (< 20, 20–50, > 50). The app shows no data below 20; above 20 shows data without a separate "low confidence" tier.
