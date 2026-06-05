# AI Workflow Rules — Isotope

## Approach

Build Isotope incrementally using a spec-driven workflow. The context files define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behaviour from scratch. When a spec conflicts with your instinct, the spec wins. If the spec is wrong, raise it as an open question before implementing.

## Scoping Rules

- Work on one feature unit at a time. A unit is a single, scoped, verifiable piece of work.
- Do not implement anything outside the current unit's spec — even if it looks obviously needed.
- Do not install packages that are not needed by the current unit. Install dependencies just in time.
- Do not modify fixed system prompt files unless the unit explicitly targets them.
- Do not touch shared UI components in `apps/web/src/components/` unless the unit explicitly targets them.

## When to Split Work

Split an implementation step if it combines any of the following:

- Multiple unrelated API routes or DB tables
- Any AI or cron job change combined with a UI change
- Behaviour that is not fully defined in the current spec

If a change cannot be verified end-to-end in a single focused session, the scope is too broad — escalate it to the user.

## Handling Missing Requirements

- Do not invent product behaviour not defined in the context files or the current spec file.
- If a requirement is ambiguous, resolve it against `project-overview.md` and `architecture.md` before implementing. If still unclear, add an open question to `progress-tracker.md` and stop.
- If a requirement is genuinely missing from the spec, add it as an open question in `progress-tracker.md` before continuing. Do not guess.
- Do not introduce a new status value, cron job, DB column, or AI behaviour that is not explicitly named in the context files.

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
