# Progress Tracker — Isotope

Update this file after every meaningful implementation change.

## Current Phase

- Pre-build — context files complete, build plan not yet written

## Current Goal

- Define the full build plan (`context/specs/00-build-plan.md`) and write Unit 01 spec before any code is written

## Completed

- PRD v2.0 (`jobtracker_PRD.md`) — all product decisions finalised
- Design system v3.0 (`design.md`) — all UI/UX decisions finalised
- CSS design tokens (`system/colors_and_type.css`) — light + dark mode tokens locked
- Context files written:
  - `context/project-overview.md`
  - `context/architecture.md`
  - `context/code-standards.md`
  - `context/ai-workflow-rules.md`
  - `context/ui-context.md`
  - `context/progress-tracker.md`
  - `CLAUDE.md` (entry point)

## In Progress

- None yet.

## Next Up

1. Write `context/specs/00-build-plan.md` — decompose entire build into ordered units
2. Unit 01 — Project scaffolding: TanStack Start + Hono + Cloudflare D1 + Clerk + Tailwind + Figtree font + design tokens wired up + `CLAUDE.md` present
3. Unit 02 — DB schema: all tables created in D1 (`companies`, `contacts`, `jobs`, `frameworks`)
4. Unit 03 — Auth: Clerk sign-up/sign-in, desktop split-panel layout, SSO callback screen
5. Unit 04 — Onboarding: path selection screen + Quick Start flow + framework seeding
6. Unit 05 — Onboarding wizard: 3-step form (Company Research → Job Search → A/B Config)
7. Unit 06 — Sidebar + global layout shell (desktop + mobile tab bar)
8. Unit 07 — Today page: 7 sections + desktop 2-column layout + AI Activity Card
9. Unit 08 — Companies page: table + filter bar + Add company form
10. Unit 09 — Company detail panel: score card, criteria table, AI summary, footer actions
11. Unit 10 — Company research cron: 3-stage AI research + failure handling
12. Unit 11 — Contacts page: table + filter bar + Add contact form
13. Unit 12 — Contact detail panel: 3-tab structure (Draft | History | About)
14. Unit 13 — Contact finder cron: Apollo search + enrichment + Haiku personalisation
15. Unit 14 — Drafting cron: Touch 1/2/3 generation + A/B assignment
16. Unit 15 — Jobs page: table + filter bar + Add job form + Discover jobs
17. Unit 16 — Job detail panel + job review flow
18. Unit 17 — Morning digest email: Resend integration + 4-section HTML email
19. Unit 18 — Settings: Frameworks tab (edit flow + versioning)
20. Unit 19 — Settings: Analytics tab (A/B data table + bar chart)
21. Unit 20 — Settings: Digest tab + Account tab
22. Unit 21 — Re-engagement cron + Dead marker + Re-engage scheduler
23. Unit 22 — Polish: empty states, error states, stalled draft detection, loading skeletons

## Open Questions

- None at this stage — all product and technical decisions resolved in PRD v2.0.

## Architecture Decisions

- **Stack:** Hono on Cloudflare Workers (backend) + TanStack Start (frontend) + Cloudflare D1 (database) + Clerk (auth) + Resend (email) + Apollo (contacts) + Anthropic Claude API (AI) — see `architecture.md` for full detail.
- **Framework storage:** Two types — fixed system prompts (codebase constants, not per user) + user-owned frameworks (D1 `frameworks` table, fetched fresh at runtime per LLM call).
- **Multi-tenancy:** Every DB table has `user_id` (Clerk ID). All queries scope by `user_id`. No cross-user data access.
- **A/B testing:** Strict alternation (A/B/A/B) at draft time. Variant never changes per contact. Win condition = user clicks "Mark as Replied".
- **Deep links:** Plain app URLs — no signed tokens, no expiry. Clerk session middleware handles auth on load.
- **Cron failure handling:** `failed_at` + `retry_count`. After 3 failures → `status = Failed`. All AI cron jobs implement this pattern.
- **Apollo pre-dedup:** ≥0.90 confidence (first name exact + high designation similarity at same company) → skip enrichment before consuming a credit. LinkedIn URL dedup is definitive post-enrichment check.

## Session Notes

- First session: write `context/specs/00-build-plan.md` using the Next Up list above as a starting point. Refine ordering, merge or split units as needed, then write Unit 01 spec and begin.
- Reference `.design/screens/*.jsx` files for exact component markup patterns when building each screen.
- The CSS token file (`src/system/colors_and_type.css`) from `.design/system/colors_and_type.css` should be copied into the project and imported globally — do not recreate it.
