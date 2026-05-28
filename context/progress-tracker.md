# Progress Tracker - Isotope

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- Workers AI infrastructure setup

## Completed

- **spec 01 — Workers AI setup**: Added `"ai": { "binding": "AI" }` to `wrangler.jsonc` (base + staging + production envs). Ran `wrangler types` to regenerate `worker-configuration.d.ts` — `AI: Ai` now present in all env interfaces. Removed stale `@cloudflare/workers-types` entry from `tsconfig.json` (package not installed; superseded by generated runtime types). Created `apps/worker/src/providers/ai.ts` — `AiProvider` class with `run()` and `runWithRetry()` methods; `AI_MODELS` constants for Sonnet (general) and Haiku (personalisation research only).

## In Progress

- None.

## Next Up

- Next spec unit

## Open Questions

- None yet.

## Architecture Decisions

- Workers AI binding named `AI` — consistent with Cloudflare convention and the `Ai` type in generated runtime types.
- `AiProvider` wraps `env.AI` in a class (matching `ClerkProvider` pattern already in codebase) — instantiated per request inside route handlers.
- `AI_MODELS.haiku` reserved exclusively for contact personalisation research per `code-standards.md`; all other AI work uses `AI_MODELS.sonnet`.
- `@cloudflare/workers-types` removed from `tsconfig.json` — `wrangler types` generates equivalent runtime types and the package was not installed.

## Session Notes

- Pre-existing TypeScript errors in `ContactsRepo.ts`, `NotesRepo.ts`, and `notes.test.ts` are unrelated to this unit and were present before this change.
