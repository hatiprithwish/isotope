# Claude Instructions

> Non-negotiable. Every session. No exceptions.

## 0. Context

Read `context/architecture.md` before implementing or making any architectural decision. It holds scope, stack, boundaries, standards, storage, invariants, workflow, and open items. For frontend work also read `context/ui-context.md` (theme, colours, typography, components).

Update `context/architecture.md` when a change alters structure, storage, invariants, standards, or open items — before moving on. History lives in git, not in the docs.

## 1. Operating principles

**Scan before code.** Read the file tree, open the closest golden file (listed in `architecture.md`), match its naming, imports, and placement, then write. If you haven't read an existing file in the domain, you may not write new code. If no pattern exists, flag it.

**Plan before any change spanning more than one file.** Output this and wait for explicit confirmation:

```
PLAN:
- Files to create: [list]
- Files to modify: [list]
- Golden file I am mirroring: [file path]
- New packages needed: [none OR "X@Y — add it?"]
- Ambiguities: [none OR single specific question]

Confirm to proceed.
```

**Ambiguity halt.** If a requirement is unclear or conflicts with the architecture, stop and ask ONE question: "To implement X, I need to know Y. What is Y?" Do not guess.

**Complete implementations only.** No `// TODO`, placeholders, or stubs. Every feature ships end to end — data, loading, error, and empty states, all layers, wired up. Deliver all files in one response. If a function is called, it exists.

## 2. Dependencies and docs

- Check `package.json` before referencing any library. Never invent package names or guess APIs.
- Never add a package without proposing it first: "This requires `X@Y`. Add it?" Never add one that has a native browser equivalent.
- For any third-party API: check the installed version, read `llm-context/<lib>` if present, then fall back to the `context7` MCP for that exact version. If docs can't be retrieved, say "I cannot verify current API for `X`. Provide docs or I will halt."
- Recency beats recall. Never default to deprecated syntax.

## 3. Self-review before outputting code

- **Types:** no implicit `any`; no `!` without a guard; every Promise awaited or `.catch()`ed; no unchecked index access on user-controlled data.
- **Architecture:** correct folder; same import aliases as neighbours; naming matches; no new abstraction unless the task requires one; layer order respected.
- **Logic:** all branches covered; side effects cleaned up; no hardcoded values that belong in config/env.

If any item fails, fix it before outputting.

## 4. Hard bans

- NEVER use `console.log` — use `AppLogger`.
- NEVER use `any`, `@ts-ignore`, or `as any` — use `unknown` and narrow, or fix the type.
- NEVER define types or Zod schemas outside `packages/schemas`.
- NEVER skip a layer — Routes → Repo → DAL → DB.
- NEVER place an authenticated route outside `_authenticated/`.
- NEVER leave `onError` absent or empty on a mutation.
- NEVER write a schema change without immediately emitting `pnpm db:generate` and `pnpm db:migrate`.
- NEVER mock data unless explicitly told "mock this".
- NEVER install a package without asking first.
- NEVER disable ESLint rules inline without asking.
- NEVER duplicate a utility that already exists in `apps/web/src/utils/` — grep first.
- NEVER modify files in `src/shadcn/ui/`.
- NEVER use inline `style={{}}` — Tailwind only.
- NEVER write tests that only test the mock, not the behaviour.
- NEVER use bare exported functions — use classes (handlers are `export default class <Feature>Handler` with `static` methods).
- ALWAYS use `pnpm` — never `npm` or `yarn`.

---

> Scan. Verify. Plan. Implement completely. Review against the checklist. Ship nothing broken.
> The repo is the source of truth. Docs are the source of truth. Training memory is a liability.
