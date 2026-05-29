# Architecture — Isotope

## Stack

| Layer          | Technology                                               | Role                                                                |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| Frontend       | TanStack Start (React 19, TypeScript, Vite)              | Full-stack React framework; routing, SSR, Cloudflare Workers deploy |
| Backend / API  | Hono v4 on Cloudflare Workers                            | HTTP API handlers; auth middleware; business logic via Repo layer   |
| Database       | Cloudflare D1 (SQLite) + Drizzle ORM                     | All structured application data — users, companies, contacts, notes |
| Shared types   | `packages/schemas` (Zod v4 + TypeScript)                 | Single source of truth for all types, Zod schemas, and enums        |
| Styling        | Tailwind CSS v4 + CSS custom property tokens + shadcn/ui | UI styling; token system defined in `styles.css`                    |
| Auth           | Clerk (`@clerk/tanstack-react-start`, `@clerk/backend`)  | User sign-up, sign-in, session management, SSO                      |
| Server state   | TanStack Query                                           | Data fetching, caching, and mutation on the frontend                |
| Forms          | TanStack Form                                            | Form state and validation on the frontend                           |
| Icons          | `@phosphor-icons/react`                                  | Icon library                                                        |
| Logging        | `@logtape/logtape` via `AppLogger`                       | Structured logging across worker and DAL layers                     |
| Error tracking | Sentry                                                   | Runtime error capture                                               |
| Testing        | Vitest + React Testing Library                           | Unit and integration tests                                          |

## System Boundaries

- `packages/schemas/src/<feature>/` — Owns all Zod schemas and TypeScript types. The only place where request/response types and enums are defined. Shared by both `apps/web` and `apps/worker`.
- `apps/worker/src/data-access-layer/` — Raw Drizzle DB operations only. No business logic. Every method wraps in try/catch and returns a typed response object.
- `apps/worker/src/repositories/` — Business logic layer. Maps API request shapes to DAL params. The only layer that may call DAL methods.
- `apps/worker/src/routes/` — Hono route handlers. Auth middleware runs first (`checkAuth`), then `zValidator`, then delegates to Repo. Instantiates Repo per request.
- `apps/worker/src/index.ts` — Hono app entry point. Mounts all route groups, configures CORS, request ID, and logger middleware.
- `apps/web/src/routes/_authenticated/` — All authenticated frontend pages and co-located private components. Route layout wrapper enforces Clerk session check.
- `apps/web/src/routes/_authenticated/<feature>/-data.ts` — Frontend data layer per feature. `QueryOptions` classes with hierarchical keys, mutation hooks with explicit `onError` handlers, `apiClient` calls.

## Storage Model

- **Cloudflare D1 (primary database)**: All structured data — `users`, `companies`, `contacts`, `contact_history`, `notes`. Every table has a `created_by` column (Clerk user ID) as a scoping key. Multi-tenant by design.
- **No blob / file storage**: All content (AI summaries, draft bodies, personalization notes, conversation history) stored as text in D1 directly.

## Auth and Access Model

- Every user authenticates via Clerk. Clerk issues and manages session tokens.
- All worker API routes run `checkAuth` middleware first; unauthenticated requests receive `401`.
- Every DB table has `created_by` (Clerk user ID). Every query includes a `WHERE created_by = ?` filter — cross-user data access is structurally impossible.
- The `_authenticated` route wrapper in `apps/web` checks `useAuth().isSignedIn`; unauthenticated visitors see a sign-in prompt.
- Worker routes extract `clerkUserId` and `clerkEmail` from the verified Clerk token via `c.get("clerkUserId")`.

## Invariants

1. **Layer import order is strictly enforced: Routes → Repo → DAL → DB.** Routes never call DAL or Drizzle directly. Repos never call Drizzle directly.
2. **All types and Zod schemas live exclusively in `packages/schemas`.** No type or schema may be defined inside `apps/web` or `apps/worker`.
3. **Every DB query filters by `created_by`.** No query may return records belonging to a different user.
4. **Enum values stored as integers in DB; API responses include both the integer and the human-readable label.** The Repo `withLabels()` pattern maps int → label before returning to routes.
5. **Every mutation hook must declare an explicit `onError` handler that surfaces the error via the shadcn toast utility.** Silent or absent `onError` is forbidden.
6. **Every Drizzle schema change must be immediately followed by `pnpm db:generate` and `pnpm db:migrate`.** Migration files are committed in the same change as the schema modification.
7. **Default / canonical framework documents are stored as static string constants in `apps/worker/src/config/Constants.ts`, not in the database.** They are injected into AI system prompts as reference templates. The DB only stores user-customised versions saved after generation.
