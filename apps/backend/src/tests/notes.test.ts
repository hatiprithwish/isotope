import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../../workers/api/index";
// Declare env type for this test suite
declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {}
}

// DEV_NOTE: vi.mock() cannot intercept this worker's entry-point module graph under
// vitest-pool-workers — the pool injects the entry-point as a side-effect import into the internal
// cloudflare:test module ahead of any vi.mock() registration, so mocks never attach (confirmed: a
// mocked ClerkProvider/authenticateRequest silently has no effect; requests still hit the real Clerk
// SDK). Real Clerk keys are supplied via vitest.config.mts's miniflare.bindings so the SDK can at
// least parse them without crashing, but there's no way to fabricate a valid signed session token
// offline — so only the unauthenticated path is covered here. Authenticated-route coverage needs
// either a real Clerk test-mode token or an auxiliary-worker test setup (see @cloudflare/vitest-pool-workers
// README's "auxiliary worker" pattern) — out of scope for this fix.
function makeRequest(path: string, method = "GET", body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Unauthenticated requests", () => {
  it("GET /notes without auth returns 401", async () => {
    const ctx = createExecutionContext();
    const req = makeRequest("/notes");
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(401);
  });

  it("POST /notes without auth returns 401", async () => {
    const ctx = createExecutionContext();
    const req = makeRequest("/notes", "POST", {
      note: { title: "Test note", body: "Hello world" },
    });
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(401);
  });
});
