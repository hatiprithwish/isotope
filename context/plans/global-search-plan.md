# Global Search — Implementation Plan

> Cmd+K palette. FTS5 over Companies, Jobs, Contacts, Notes. User-scoped. Built to add new entities cheaply.

## 0. Research Findings (verified against repo + docs)

- **D1 supports FTS5** virtual tables + triggers (Cloudflare D1 docs confirm FTS5 + fts5vocab). BM25 ranking built in via `rank` column / `bm25()`.
- **drizzle-kit cannot generate virtual tables or triggers** — schema DSL has no FTS5 concept. FTS objects live in a **hand-written migration** appended to `src/db/migrations/`, tracked in the D1 migrations journal like every other file. This is the one deviation from "run `db:generate`".
- **Existing search is LIKE-based** (`CompaniesDAL.ts:192`, `ContactsDAL.ts`, `TasksDAL.ts`) — per-entity, no ranking. Global search is new infra, not a refactor of these.
- **No cmdk / Command component** exists. `cmdk` must be added (asked separately).
- **All 4 target tables have `createdBy` (text, clerkId)** — row-level scoping key.
- **D1 caveat:** `d1 export` unsupported when virtual tables present — drop/recreate FTS around export. Note in runbook.
- Migration journal currently at `0011_isotope.sql`; next is `0012`.

## 1. Architecture — the extensible core

Single FTS5 table, **not one per entity**. Every searchable row is one FTS row tagged with its source. Adding an entity = add rows to this table + a resolver, no schema change.

### FTS table shape (contentless / external-content hybrid → we use **standalone content**)

```sql
CREATE VIRTUAL TABLE search_index USING fts5(
  entity_type UNINDEXED,   -- 'company' | 'job' | 'contact' | 'note'
  entity_id   UNINDEXED,   -- PK in source table
  created_by  UNINDEXED,   -- clerkId, for row-level scoping (filtered, not matched)
  title,                   -- weighted high
  body,                    -- weighted low
  tokenize = 'porter unicode61 remove_diacritics 2'
);
```

- `entity_type` + `entity_id` = the pointer back to the real row. `UNINDEXED` cols are stored, returned, filterable in SQL, but not tokenized.
- `created_by` UNINDEXED → scope with plain `WHERE created_by = ?` (fast, exact) instead of polluting the match query.
- Two content columns (`title`, `body`) let `bm25(search_index, 10.0, 1.0)` weight title hits 10× over body.

### Why standalone (not external-content) content tables

External-content FTS ties one FTS table to exactly one source table via rowid. We index **4 heterogeneous tables into one index** — external-content can't express that. Standalone means triggers write the projected text into `search_index` directly. Slightly more storage; buys the unified index and trivial extensibility.

### The projection contract (the extensibility seam)

Each entity defines **what text represents it**. Central registry:

```ts
// packages/schemas/src/search/SearchCommon.ts
export enum SearchEntityType {
  Company = "company",
  Job = "job",
  Contact = "contact",
  Note = "note",
}

// title/body projection per entity — the ONE place new entities plug in
export const SEARCH_PROJECTIONS = {
  [SearchEntityType.Company]: {
    table: "companies",
    title: "name",
    body: ["industry", "location", "notes"],
  },
  [SearchEntityType.Job]: { table: "jobs", title: "title", body: ["description", "skills"] },
  [SearchEntityType.Contact]: {
    table: "contacts",
    title: "name",
    body: ["designation", "email", "notes"],
  },
  [SearchEntityType.Note]: { table: "notes", title: "title", body: ["body"] },
} as const;
```

Triggers are **generated from** this contract (a small codegen script emits the SQL), so a new entity means: add one enum member + one projection entry + rerun the trigger-gen. See Phase 5.

## 2. Sync strategy — keep FTS current

Per source table, 3 triggers (INSERT / UPDATE / DELETE) write to `search_index`. Example for notes:

```sql
CREATE TRIGGER notes_ai AFTER INSERT ON notes BEGIN
  INSERT INTO search_index(entity_type, entity_id, created_by, title, body)
  VALUES ('note', new.id, new.created_by, new.title, new.body);
END;

CREATE TRIGGER notes_ad AFTER DELETE ON notes BEGIN
  DELETE FROM search_index WHERE entity_type='note' AND entity_id=old.id;
END;

CREATE TRIGGER notes_au AFTER UPDATE ON notes BEGIN
  DELETE FROM search_index WHERE entity_type='note' AND entity_id=old.id;
  INSERT INTO search_index(entity_type, entity_id, created_by, title, body)
  VALUES ('note', new.id, new.created_by, new.title, new.body);
END;
```

- 4 tables × 3 = 12 triggers, all generated from `SEARCH_PROJECTIONS`.
- Backfill existing rows in the same migration: `INSERT INTO search_index SELECT ... FROM <table>` per entity.
- Triggers keep it correct without app code touching the index — DALs stay unchanged.

## 3. Query mechanics

```sql
SELECT entity_type, entity_id, title,
       snippet(search_index, 3, '<mark>', '</mark>', '…', 12) AS snippet,
       bm25(search_index, 10.0, 1.0) AS score
FROM search_index
WHERE search_index MATCH ?           -- sanitized user query
  AND created_by = ?                 -- row-level scope
ORDER BY score                       -- ascending: best (most negative) first
LIMIT 30;
```

- **Query sanitization is mandatory** — raw user input into MATCH throws on bad syntax. Wrap each token as a prefix phrase: `"foo"* "bar"*`. Strip FTS operators from user text; build the MATCH string ourselves.
- Group results by `entity_type` app-side for the palette's sectioned UI.

## 4. Layered build — follows golden files exactly

### Phase 1 — Schemas (`packages/schemas/src/search/`) — shipped

- `SearchCommon.ts` — `SearchEntityType` enum, `SEARCH_PROJECTIONS`, `SearchResultItem` type (`entityType`, `entityId`, `title`, `snippet`, `score`).
- `SearchApiRequest.ts` — `ZSearchApiRequest` (Zod: `q: string().min(1)`, `limit`). **Dropped `types` filter** — no precedent in this repo for array-valued query-string params (all existing `z.array()` usages are body-validated bulk ops); revisit if the frontend needs per-entity filtering later.
- `SearchApiResponse.ts` — `SearchApiResponse extends ApiResponse { results?: SearchResultItem[] }`.
- `SearchDALRequest.ts` — `SearchDALRequest { query: string; createdBy: string; limit?: number }`.
- `index.ts` barrel → exported from `packages/schemas/src/index.ts`.
- Added `LogAction.GlobalSearch` in `log.ts` (no separate `Search` category needed — reused existing `LogCategory.DAL`).

### Phase 2 — Migration (hand-written) — shipped

- `src/db/migrations/0013_isotope.sql` (not 0012 — an unrelated migration landed first) — `CREATE VIRTUAL TABLE search_index`, 12 triggers, backfill inserts.
- Registered in `src/db/migrations/meta/_journal.json` + `meta/0013_snapshot.json` copied forward from `0012_snapshot.json` (new `id`/`prevId` chain only — schema unchanged, since `tables.ts` wasn't touched).
- Validated against a scratch local SQLite db before touching D1: backfill, MATCH+bm25+snippet, all 3 trigger types, and `created_by` row-scoping all confirmed correct.
- **Correction:** the repo only has `db:migrate` (remote). No `db:migrate:local` script exists — don't reference one. **Do NOT run `db:generate`** — nothing in `tables.ts` changed.
- Not yet applied to the real D1 database — deliberate manual step (`pnpm db:migrate`) for you to run when ready.

### Phase 3 — Backend (Routes → Repo → DAL) — shipped

- `SearchDAL.ts` — single `search(params: SearchDALRequest)` method. Raw `sql` MATCH query via `this.db.all(sql\`…\`)`(no Drizzle table object exists for the virtual table).`buildMatchQuery()`sanitizes free text into safe FTS5 prefix-phrase syntax (strips`"`/`_`/`^`, tokenizes, ANDs quoted `"tok"_`terms) so arbitrary user input can never throw a MATCH syntax error. try/catch +`AppLogger.error`, `response = { isSuccess: false }` shape.
- `SearchRepo.ts` — thin: maps `{ userId, q, limit }` → DAL params.
- `SearchRoutes.ts` — `GET /`, `checkAuth` + `zValidator("query", ZSearchApiRequest)`, `clerkUserId`, instantiate repo, `c.json(response, 200|500)`.
- Mounted `app.route("/search", SearchRoutes)` in `workers/api/index.ts`.
- Typechecked clean; verified live against running dev servers (backend :8787) — `/search` correctly 401s without a token, matching every other route.

### Phase 4 — Frontend (Cmd+K palette) — shipped

- Added `cmdk@^1.1.1` via `npx shadcn@latest add command -c apps/web` (declined overwrite prompts for pre-existing `button.tsx`/`input.tsx`/`textarea.tsx`) — pulled in `command.tsx`, `dialog.tsx`, `input-group.tsx`.
- **Bug found in the generated `CommandDialog`:** it never renders a `<Command>` root — `CommandInput`/`CommandList` would've had no cmdk context. Fixed by wrapping `<Command>` inside the palette component itself (not editing the shadcn-generated file, per project convention).
- Set `shouldFilter={false}` on `Command` — results are already ranked server-side via `bm25()`; cmdk's default client fuzzy-filter would otherwise re-filter/hide valid matches.
- `_authenticated/-search-data.ts` — `SearchQueries` class, `useQuery` keyed on debounced `q` (via existing `useDebouncedValue` hook, 300ms), `enabled: q.length > 0`. Follows `NotesQueries` pattern.
- `useGlobalSearchShortcut.ts` — new hook, Cmd/Ctrl+K listener. Checks `e.code` not `e.key` (mirrors the fix from a recent Alt+T commit — Mac key remapping breaks `e.key`). Unlike the existing `useAddShortcut`, fires even when focus is in an input (standard palette UX) and correctly syncs its ref inside `useEffect` rather than during render (the golden `useAddShortcut.ts` has a latent `react-hooks/refs` lint violation — not fixed there, out of scope, but avoided in the new hook).
- `-GlobalSearchPalette.tsx` — sectioned results by `entityType`, routes to detail pages. **Route param shapes verified against actual route files**, not guessed: jobs/contacts/notes use path params (`Route.useParams()`), companies uses a `panel` query param (no dedicated detail route).
- Mounted in `_authenticated/route.tsx`.
- Typechecked + linted clean. Started both dev servers and confirmed clean boot + wired routing; did **not** click-test in an actual browser — no `chromium-cli`/Playwright available in this environment, and the app sits behind live Clerk auth with no test-mode bypass. Flagged as unverified rather than assumed working.

### Phase 5 — Extensibility tooling — shipped

- `apps/backend/scripts/genSearchTriggers.ts` — reads live `SEARCH_PROJECTIONS` from `@app/schemas`, emits the exact 3-trigger + backfill SQL block per entity. Run via `pnpm search:gen-triggers`.
- **Needed `tsx`** (added as a real `apps/backend` devDependency, approved) — plain `node` can't run this repo's TS source because `packages/schemas` uses extensionless directory imports (`export * from "./users"`), which only bundlers (Vite/wrangler/esbuild) resolve, not native Node ESM.
- **Verified correct two ways:** (1) script output diffed byte-for-byte identical to the hand-written `0013_isotope.sql` triggers; (2) simulated adding a 5th entity (`Task`) to `SEARCH_PROJECTIONS`, reran the script, confirmed correct trigger SQL generated with zero other code changes, then reverted the simulation.
- **"Add a new searchable entity" runbook** (below).

## 5. Adding a future entity — the payoff

To make entity `X` searchable, in order:

1. Add `X = "x"` to `SearchEntityType` in `packages/schemas/src/search/SearchCommon.ts`.
2. Add `X`'s projection to `SEARCH_PROJECTIONS` (table name, title col, body cols).
3. `cd apps/backend && pnpm search:gen-triggers` → prints the 3 triggers + backfill INSERT for every entity, including the new one.
4. Copy the new entity's block into a new hand-written migration `apps/backend/src/db/migrations/00NN_isotope.sql` (bump the number, add a `_journal.json` entry, copy the previous `meta/NNNN_snapshot.json` forward with a fresh `id`/`prevId`. See `0013_isotope.sql` / `0013_snapshot.json` for the reference shape). Apply with `pnpm db:migrate`.
5. Add one case to `resultRoute()` in `apps/web/src/routes/_authenticated/-GlobalSearchPalette.tsx` mapping the new `entityType` to its detail route, and one entry each to `ENTITY_LABELS`/`ENTITY_ICONS` in the same file.

No DAL/Repo/Route changes. No API shape change. Verified this end-to-end during Phase 5 by simulating a 5th entity — steps 1–3 alone produced correct trigger SQL with zero other code touched.

## 6. Risks / decisions

- ~~**cmdk package**~~ — resolved: `cmdk@^1.1.1` installed, approved.
- ~~**Snippet column index**~~ — resolved: ordinal 3 verified correct against the live table DDL and confirmed via scratch-DB testing in Phase 2.
- ~~**Contacts title field**~~ — resolved: `name` as title, `designation/email/notes` as body, per the shipped `SEARCH_PROJECTIONS`.
- **Not yet applied to real D1** — `0013_isotope.sql` exists and is validated locally but `pnpm db:migrate` hasn't been run against the actual database. The palette will 500 on every search until this runs.
- **`types` filter dropped from scope** — `ZSearchApiRequest` only takes `q`/`limit`. No query-string array convention exists in this repo to build on; add when the frontend actually needs per-entity filtering.
- **Reindex/rebuild path** — not built. If triggers ever miss (bulk import bypassing the ORM, manual D1 edits), there's no admin op to resync `search_index` from source tables. Would be `DELETE FROM search_index; ` + the 4 backfill INSERTs from `0013_isotope.sql`, re-run manually — not scripted.
- **`d1 export` breaks with virtual tables** — not yet documented anywhere operational (e.g. a deploy/ops runbook). Drop `search_index` before export, recreate after.
- **Browser click-test not done** — dev servers verified clean boot + correct auth-gating on `/search`, but the palette itself (open/type/select/navigate) was never driven in an actual browser — no `chromium-cli`/Playwright in this environment, and the app has no test-mode auth bypass.

## 7. Status

All 5 phases shipped in code. **Remaining before this is live:**

1. Run `pnpm db:migrate` (from `apps/backend`) to apply `0013_isotope.sql` to the real D1 database.
2. Click-test the palette in an actual authenticated browser session — never done end-to-end (see §6).

| Phase                     | Size                                 | Status                                     |
| ------------------------- | ------------------------------------ | ------------------------------------------ |
| 1 Schemas                 | S                                    | Shipped                                    |
| 2 Migration + triggers    | M (SQL-heavy, careful)               | Shipped, unapplied to real D1              |
| 3 Backend DAL/Repo/Routes | S–M (mirrors golden files)           | Shipped                                    |
| 4 Frontend palette        | M (new component, keyboard, routing) | Shipped, browser-untested                  |
| 5 Extensibility tooling   | S                                    | Shipped, verified via simulated 5th entity |

Difficulty was medium as predicted. Genuinely novel parts were the FTS5 SQL and the palette UI, exactly as scoped — but three assumptions in the original plan turned out wrong in practice: no `db:migrate:local` script exists, `types` filtering had no query-string precedent to build on, and `tsx` had to be added as a new dependency for the codegen script since plain Node can't resolve this repo's internal package imports.
