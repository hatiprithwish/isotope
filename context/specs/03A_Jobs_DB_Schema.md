# Delta Spec 003A: Jobs Feature — Database Schema & Migration

## 1. Context & Objective

This is Unit 1 of the Jobs Feature implementation. Your sole objective is to define the `jobs` table in the Drizzle schema, apply the necessary performance indexes, and execute the database migration.
**Do not write API routes, UI components, or workflow logic in this execution step.**

## 2. Technical Constraints (Cloudflare D1 + Drizzle)

- **Target File:** `apps/worker/src/db/tables.ts`
- **Dialect:** SQLite (Cloudflare D1).
- **Array Handling:** Since SQLite does not support native arrays, the `skills` column must be defined as text but typed to parse as a string array at the application layer.
- **Timestamps:** Must follow the correct pattern already present in tables.ts
- **Multi-tenancy:** The `created_by` column is mandatory for Clerk User ID scoping.

## 3. Schema Definition

Implement the `jobs` table alias exactly as follows:

- `id`: Primary key (bigint, generated/UUID)
- `status`: Integer (not null) - maps to Enum
- `title`: Text (not null)
- `company_id`: Integer (Foreign key referencing existing `companies` table)
- `url`: Text (Must have a UNIQUE INDEX applied for aggressive deduplication)
- `location`: Text
- `salary`: Text
- `source`: Text
- `type`: Integer (not null. Values: 1 = manual, 2 = LLM)
- `description`: Text
- `skills`: Text (JSON stringified array of text)
- `created_by`: Text (not null, Clerk User ID)
- `match_score`: Number (nullable, deferred to v2.0, but keep the column)
- `created_at`: text (not null)
- `updated_at`: text

## 4. Execution Steps

1. Open `apps/worker/src/db/tables.ts` and add the `jobs` table definition.
2. Ensure the unique index on `url` is correctly declared within the Drizzle table definition.
3. Add the table export to the schema registry.
4. Run `pnpm db:generate` to create the SQL migration file.
5. Run `pnpm db:migrate` to apply the changes to the local D1 database.

## 5. Verification & State Handoff

- **Verification Gate:** Run `tsc --noEmit` to verify the schema addition has not broken any existing type exports.
- **Documentation Gate:** You must update `context/architecture.md` to document the new table and its invariants.
- **Handoff:** Update `context/progress-tracker.md`. Move "Spec 003A — Jobs Database Schema" to the **Completed** section, and list "Spec 003B — Shared Schemas & Backend Routes" under **Next Up**.
