# AI Workflow Rules — Isotope

## Approach

Build Isotope incrementally using a spec-driven workflow. The context files define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behaviour from scratch. When a spec conflicts with your instinct, the spec wins. If the spec is wrong, raise it as an open question before implementing.

## Scoping Rules

- Work on one feature unit at a time. A unit is a single, scoped, verifiable piece of work.
- Do not implement anything outside the current unit's spec — even if it looks obviously needed.
- Do not combine UI changes, DB schema changes, and background task changes in a single implementation step.
- Do not install packages that are not needed by the current unit. Install dependencies just in time.
- Do not modify fixed system prompt files unless the unit explicitly targets them.
- Do not touch shared UI components in `src/components/ui/` unless the unit explicitly targets them.

## When to Split Work

Split an implementation step if it combines any of the following:

- Frontend UI changes and backend/cron changes
- DB schema migrations and application logic
- Multiple unrelated API routes or DB tables
- Any AI or cron job change combined with a UI change
- Behaviour that is not fully defined in the current spec

If a change cannot be verified end-to-end in a single focused session, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behaviour not defined in the context files or the current spec file.
- If a requirement is ambiguous, resolve it against `project-overview.md` and `architecture.md` before implementing. If still unclear, add an open question to `progress-tracker.md` and stop.
- If a requirement is genuinely missing from the spec, add it as an open question in `progress-tracker.md` before continuing. Do not guess.
- Do not introduce a new status value, cron job, DB column, or AI behaviour that is not explicitly named in the context files.

## Status Transitions — Rules

Never implement a status transition that is not defined in `architecture.md`. The authorised transitions are:

- **Company:** Not Started → Waiting for Human → Accepted by Human → Contacts Added → [Interviewed | Offer | Rejected | Failed]
- **Contact:** Not Started → Draft Ready → In Pipeline (seq 1→2→3) → Dead → Re-Engage → Draft Ready → [Replied | Closed | Failed]
- **Job:** Waiting for Human → [Rejected | Accepted → Company Added → Applied | Interviewing | Offer | Rejected]

Any transition not listed above is out of scope. Raise it as an open question.

## Framework Fetching — Rule

Every LLM call must fetch the user's framework fresh from D1 at call time. The pattern is always:

```sql
SELECT content FROM frameworks
WHERE user_id = ? AND type = ?
ORDER BY updated_at DESC
LIMIT 1
```

Never pass a module-level cached framework to an LLM call. Never use a default or seed value at call time — only the user's latest saved version.

## A/B Testing — Rules

- A/B variant is assigned at draft time using strict alternation (A/B/A/B in cron processing order).
- Once assigned, `ab_variant` never changes for that contact — not even across re-engagement.
- `ab_variable` is fetched fresh from the user's A/B framework at draft time. Existing contacts keep their original variable.
- The win condition is only `ab_replied = true` — set when user clicks "Mark as Replied". No other signal counts.

## Cron Jobs — Rules

- Cron handlers must be idempotent. Re-running for an already-processed record must produce no side effects.
- Failure handling is mandatory on every cron job: catch exceptions, set `failed_at = now`, increment `retry_count`. After `retry_count >= 3` → `status = Failed`. Never silently swallow exceptions.
- Cron jobs do not run inline in HTTP request handlers — always via Cloudflare Cron Triggers.
- The 7-day contact sequence timer (`next_touch_due_at`) is computed from `last_touch_at` — which is set only when the user clicks "Mark as Sent" and confirms. Never set from draft generation time.

## Protected Files — Do Not Modify Without Explicit Instruction

- `src/frameworks/email-drafting.ts` and `src/frameworks/contact-search.ts` — fixed system prompts. Immutable unless the unit spec explicitly targets them.
- `src/components/ui/*` — shared design-system components. Do not change a shared component to fix a page-specific issue — create a page-specific variant instead.
- `src/db/` schema files — only modify when the unit spec includes a DB migration.
- Design tokens in `src/system/colors_and_type.css` — do not add, remove, or change token values.

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- If a DB column is added or a status is introduced → update `architecture.md`
- If a new folder or file pattern is introduced → update `code-standards.md`
- If a framework type changes or a cron schedule changes → update `architecture.md`
- If scope changes (feature added or removed) → update `project-overview.md`

Always update `progress-tracker.md` after completing a unit.

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope — all checklist items in the spec file are verified.
2. No invariant defined in `architecture.md` was violated.
3. TypeScript compiles with no errors (`tsc --noEmit` passes).
4. No console errors in the browser for the affected pages.
5. The feature is responsive — verified at mobile (<768px) and desktop (≥1280px).
6. `npm run build` passes.
7. `progress-tracker.md` is updated: current unit marked complete, next unit listed.
