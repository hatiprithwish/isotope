import path from "path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const migrations = await readD1Migrations(path.resolve(import.meta.dirname, "./src/db/migrations"));

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./workers/api/wrangler.jsonc" },
      miniflare: {
        // Local-only overrides so tests never touch the real staging D1/AI/queues (which the
        // wrangler config only binds with remote: true under the staging/production envs).
        d1Databases: { DB: "test-db" },
        bindings: {
          TEST_MIGRATIONS: migrations,
          ALLOWED_CORS_ORIGIN: "http://localhost:3000",
          // Real (but harmless dev-instance) Clerk keys — a syntactically fake key fails Clerk's own
          // base64/prefix parsing before it can even evaluate the request, crashing to 500 instead of
          // resolving to isSignedIn:false. No network call happens without an actual bearer token.
          CLERK_PUBLISHABLE_KEY: "pk_test_Y2FzdWFsLXVuaWNvcm4tNy5jbGVyay5hY2NvdW50cy5kZXYk",
          CLERK_SECRET_KEY: "sk_test_dummy_00000000000000000000000000000000000000",
          RESEND_API_KEY: "test-resend-key",
          RESEND_INBOUND_DOMAIN: "test.example.com",
          RESEND_WEBHOOK_SECRET: "test-webhook-secret",
          TAVILY_API_KEY: "test-tavily-key",
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@app/schemas": path.resolve(import.meta.dirname, "../../packages/schemas/src/index.ts"),
    },
  },
  test: {
    include: ["src/**/*.{test,spec}.ts"],
    setupFiles: ["./src/tests/setup.ts"],
  },
});
