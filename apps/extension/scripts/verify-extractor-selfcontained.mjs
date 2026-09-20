/**
 * Guards the one invariant that breaks silently in production.
 *
 * `extractLinkedInProfile` is shipped to the LinkedIn tab by `chrome.scripting.executeScript`,
 * which serialises it with `toString()`. Anything the bundler hoists out of the function body —
 * a module-level `const`, a shared helper, an import — survives typecheck, lint and the build,
 * then throws `ReferenceError` inside the page at runtime, where nothing surfaces it.
 *
 * So: pull the built function out of the bundle, run it in a bare scope containing only the
 * globals the page provides, and fail the build if it references anything else.
 *
 * Run after `wxt build`; reads .output/chrome-mv3.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const chunksDir = join(fileURLToPath(new URL("../.output/chrome-mv3/chunks", import.meta.url)));

// A stable string from inside the extractor, used to locate it in minified output.
const ANCHOR = 'link[rel="canonical"]';

function findExtractorSource() {
  for (const file of readdirSync(chunksDir)) {
    if (!file.endsWith(".js")) continue;
    const source = readFileSync(join(chunksDir, file), "utf8");
    const anchorAt = source.indexOf(ANCHOR);
    if (anchorAt < 0) continue;

    const start = source.lastIndexOf("function", anchorAt);
    let depth = 0;
    for (let i = source.indexOf("{", start); i < source.length; i++) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}" && --depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

const fnSource = findExtractorSource();
if (!fnSource) {
  console.error("verify-extractor: could not locate extractLinkedInProfile in the bundle.");
  process.exit(1);
}

// Minimal stand-ins: enough for every branch to execute, nothing the real page wouldn't provide.
const emptyNode = { textContent: "", getAttribute: () => null, childNodes: [], innerText: "" };
const fakeDocument = {
  title: "Test Person | LinkedIn",
  querySelector: () => null,
  querySelectorAll: () => [],
  // Exercises the text path too, so a hoisted identifier there is caught as well.
  ...{ body: emptyNode },
};
const fakeLocation = { href: "https://www.linkedin.com/in/test-person/" };

try {
  const run = new Function("document", "location", `return (${fnSource})();`);
  const result = run(fakeDocument, fakeLocation);
  if (typeof result?.linkedinUrl !== "string" || typeof result?.pageText !== "string") {
    console.error("verify-extractor: ran, but returned an unexpected shape:", result);
    process.exit(1);
  }
} catch (error) {
  console.error(
    "verify-extractor: the bundled extractor is NOT self-contained — it will throw inside the\n" +
      "LinkedIn page. Move whatever it references into the function body.\n",
    error,
  );
  process.exit(1);
}

console.log("verify-extractor: ok (bundled extractor is self-contained)");
