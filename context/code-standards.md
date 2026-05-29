# Code Standards

## General

- Keep modules small and single-purpose — a file that does more than one thing is a candidate to split
- Fix root causes — do not layer workarounds or conditional patches over broken behaviour
- Do not mix unrelated concerns in one component or route — UI, DB access, and business logic belong in separate layers
- Every feature must be end-to-end functional — no stubs, no TODOs, no placeholder functions
- All status transitions must be explicit — never infer status from field values, update `status` columns directly

## TypeScript

- Strict mode required throughout — no `@ts-ignore`, no `as any`
- Never use `any` — use `unknown` and narrow, or explicit interfaces from `packages/schemas`
- All types and Zod schemas live in `packages/schemas` — never define them in `apps/web` or `apps/worker`
- Validate unknown external input at system boundaries before passing inward
- DB column names are `snake_case`; TypeScript interfaces use `camelCase` — the Repo layer maps between them
- Enum columns stored as integers in DB using `t.integer().$type<IntEnum>()` — API response includes both the int value and a human-readable label

## TanStack Start

- All authenticated routes must be nested under `_authenticated/` — never place auth-required routes outside this boundary
- Route files are thin — import from `-data.ts` and co-located components, never write business logic inline
- Use `?panel=[id]` URL param pattern for detail panel state — panel open state must be derivable from the URL
- Always call `useAuth()` at page level and pass `getToken` into query and mutation hooks
- Loading state: `if (isPending) return <div>Loading...</div>`
- Error state: `if (isError) return <div>Failed to load.</div>`
- All API calls go through `apiClient` — never raw `fetch` in a component
- Co-located private components use `-` prefix (e.g. `-NoteCard.tsx`) — they are not routes

## Hono / Cloudflare Workers

- `checkAuth` middleware runs first on every route — unauthenticated requests return `401`
- `zValidator` validates body/param/query before any logic runs
- Route handlers delegate to the Repo — no business logic or DB queries directly in a handler
- Get `userId` via `c.get("clerkUserId")` — never trust client-supplied user IDs without re-querying
- Status codes: `201` create, `200` success, `404` not found, `500` error
- Instantiate Repo inside the handler: `const repo = new <Feature>Repo(c.env)`

## Styling

- Tailwind utility classes only — no inline `style={{}}` except for dynamic values impossible in Tailwind
- No CSS modules, no styled-components — shadcn components extended via `className` only, never modify files in `src/shadcn/ui/`
- Pixel-perfect and responsive — every component matches the design spec exactly using Tailwind tokens from `styles.css`; never approximate; use responsive prefixes (`md:`, `lg:`) for breakpoint differences
- Check `styles.css` for exact token names before writing color classes — e.g. `--surface-raised` → `bg-[var(--surface-raised)]`, `--border` → `border-border`
- Never write arbitrary pixel values when a Tailwind v4 class can express it — v4 accepts decimals (`w-1.25`, `gap-0.75`); check docs before using `[]`
- Flag any design value that cannot be expressed in Tailwind before writing anything — do not silently approximate

## AppTable

- Pass content into the toolbar row via the `toolbarLeft?: ReactNode` prop — do not add separate `<div>` rows between the page header and `<AppTable>` for toolbar-level controls (search inputs, filter chips, etc.)
- The toolbar row always renders; it contains `toolbarLeft` on the left and the column-visibility (`…`) menu on the right

## API Routes

- Parse and validate request body with `zValidator` before any logic runs
- Enforce `user_id` ownership: query the record and confirm `record.userId === clerkUserId` before any mutation
- Return consistent response shapes extending `ApiResponse` from `packages/schemas`
- Never return internal error messages or stack traces to the client

## AI / LLM Calls

- All LLM calls go through `ContextBuilder` to assemble the input bundle: fresh framework fetch + company record + job record (or null) + conversation history.
- Never pass a cached or module-level stored framework to an LLM call. Always fetch from D1 at call time.
- Wrap all LLM calls in try/catch. On failure: set `failed_at = now`, increment `retry_count`. After `retry_count >= 3`, set `status = Failed`.
- Claude Haiku is used exclusively for personalisation research (Step 5 of Contact Finder). All other AI work uses Claude Sonnet or higher.

## Logging

Logging is mandatory throughout the backend. Silent failures are forbidden.

**Backend (`AppLogger` in `apps/worker/src/providers/logger.ts`)**

- Every DAL method must log on every error path — both caught exceptions and "not found" branches — using `AppLogger.error()`.
- Every Repo / AI method must log at the start of meaningful operations (`AppLogger.info()`) and on all error paths (`AppLogger.error()`).
- Always pass `category` (`LogCategory`), `action` (`LogAction`), `message`, and `metadata` (the input params, redacted of secrets automatically by the sink). Pass `error` on exception paths.
- `LogCategory` and `LogAction` enums live in `packages/schemas/src/log.ts`. Add a new `LogAction` entry for every new feature operation before writing any log call — never use a string literal.
- Reference pattern: `NotesDAL` — logs every error branch; `AiProvider` — logs inference start, completion, and every retry/failure.

**Frontend (`-data.ts` mutation hooks)**

- Every `useMutation` must declare an `onError` handler that surfaces the failure via `toast.error(...)` from `sonner`.
- `onError` is the frontend's logging boundary — it is the only place a mutation failure becomes visible. Silent or absent `onError` is forbidden (see also architecture invariant #5).
- Reference pattern: `apps/web/src/routes/_authenticated/notes/-data.ts` — every mutation has an explicit `onError` toast.

## Data and Storage

- All types and Zod schemas belong in `packages/schemas/src/<feature>/` — the single source of truth
- DB table definitions live in `apps/worker/src/db/tables.ts` only — use `sqliteTable` aliased as `table`
- All timestamps: `t.integer({ mode: "timestamp" })` — never text
- Always include `createdAt` (notNull) and `updatedAt` (nullable) on every table
- Add index for all foreign key columns; add unique index where field must be unique
- After any schema change: run `pnpm db:generate` then `pnpm db:migrate` immediately — never defer

## File Organisation

- `packages/schemas/src/<feature>/` — Zod schemas and TypeScript types; one folder per feature with `Common`, `ApiRequest`, `ApiResponse`, `DALRequest`, and `index.ts`
- `apps/worker/src/data-access-layer/` — raw Drizzle DB operations only; one class per feature
- `apps/worker/src/repositories/` — business logic; maps API shapes to DAL params; one class per feature
- `apps/worker/src/routes/` — Hono route declarations; auth + validation only, delegate to Repo
- `apps/worker/src/config/` — `AppContext`, `EnvConfig`, `Constants`; environment and app-wide config
- `apps/web/src/routes/_authenticated/<feature>/` — page components, `-data.ts`, and `-`-prefixed co-located components
- `apps/web/src/shadcn/ui/` — shadcn component files; never modify directly
- `apps/web/src/utils/` — shared utility functions; check here before writing any new helper
