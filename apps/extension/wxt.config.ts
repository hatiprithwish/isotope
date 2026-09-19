import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

/**
 * Config runs in Node before the extension bundle is built, so `import.meta.env` is not populated
 * here — only `process.env` is. Extension *source* still reads `import.meta.env.WXT_*` as usual.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Copy apps/extension/.env.example to .env and fill it in before building.`,
    );
  }
  return value.replace(/\/+$/, "");
}

// DEV_NOTE: `key` pins the extension to a fixed CRX ID even when loaded unpacked. The ID must stay
// stable because it is registered in two places that reject unknown origins — Clerk's
// `allowed_origins` and the API's ALLOWED_CORS_ORIGIN (which AuthMiddleware also reuses as Clerk's
// `authorizedParties`). Regenerating the key means re-registering both.
//
// DEV_NOTE: `web_accessible_resources` is deliberately never declared. LinkedIn probes for known
// extensions by fetching `chrome-extension://<id>/<resource>`; an extension that exposes no
// web-accessible resource cannot be enumerated that way.
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: () => ({
    name: "Isotope Capture",
    version: "0.1.0",
    description: "Add the LinkedIn profile you are viewing to your Isotope pipeline.",
    key: requireEnv("WXT_CRX_PUBLIC_KEY"),
    permissions: ["storage", "cookies", "scripting", "activeTab"],
    host_permissions: [
      "https://www.linkedin.com/in/*",
      `${requireEnv("WXT_CLERK_FRONTEND_API")}/*`,
      `${requireEnv("WXT_WEB_ORIGIN")}/*`,
      `${requireEnv("WXT_API_ORIGIN")}/*`,
    ],
    action: {},
  }),
});
