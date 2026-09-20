/**
 * Guards the one invariant that breaks silently in production.
 *
 * The extractors are shipped to the LinkedIn tab by `chrome.scripting.executeScript`, which
 * serialises them with `toString()`. Anything the bundler hoists out of a function body —
 * a module-level `const`, a shared helper, an import — survives typecheck, lint and the build,
 * then throws `ReferenceError` inside the page at runtime, where nothing surfaces it.
 *
 * So: pull each built function out of the bundle, run it in a bare scope containing only the
 * globals the page provides, and fail the build if it references anything else.
 *
 * Run after `wxt build`; reads .output/chrome-mv3.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const chunksDir = join(fileURLToPath(new URL("../.output/chrome-mv3/chunks", import.meta.url)));

const emptyNode = { textContent: "", getAttribute: () => null, childNodes: [], innerText: "" };

/**
 * A conversation small enough to read but exercising every branch: date separator, screen-reader
 * anchor, both senders, a message body that *begins with "Send"* (a loose end-of-thread marker used
 * to truncate the thread there), and the composer anchor that closes the conversation.
 */
const SAMPLE_THREAD = [
  "SEP 4",
  "View Test Contact’s profile",
  "Test Contact (She/Her) 3:24 PM",
  "Hello there.",
  "Test Contact sent the following message at 3:25 PM",
  "View Test User’s profile",
  "Test User 4:01 PM",
  "Reply body.",
  "Send the resume when ready.",
  // Control text that follows a message inside the bubble, and a reaction's emoji summary.
  "Remove reaction",
  "👍…",
  "Maximize compose field",
  "Attach an image to your conversation with Test Contact",
  "Write a message…",
].join("\n");

/**
 * A minimal DOM modelled on the live page: the conversation sits inside a *shadow root* (LinkedIn's
 * chat bubble does), so the composer's text node is reachable only through `host.shadowRoot`, never
 * from `document.body`. A search that does not enter shadow roots finds nothing and this fails.
 * The light DOM also holds an unrelated conversation-list row, which must not be read.
 */
function buildThreadDom() {
  const page = {
    innerText: `Open the options list in your conversation with Test User and Decoy Person`,
    parentElement: null,
  };
  const host = { innerText: SAMPLE_THREAD, parentElement: page, shadowRoot: null };
  const shadowRoot = { host, querySelectorAll: () => [] };
  const container = {
    innerText: SAMPLE_THREAD,
    parentElement: null,
    parentNode: shadowRoot,
    contains: () => false,
  };
  const composerEl = {
    innerText: "Attach an image to your conversation with Test Contact",
    parentElement: container,
  };
  const composerText = {
    nodeValue: "Attach an image to your conversation with Test Contact",
    parentElement: composerEl,
  };
  host.shadowRoot = shadowRoot;
  return { page, host, shadowRoot, textNodesByRoot: new Map([[shadowRoot, [composerText]]]) };
}

const threadDom = buildThreadDom();

const specs = [
  {
    name: "extractLinkedInProfile",
    // A stable string from inside the extractor, used to locate it in minified output.
    anchor: 'link[rel="canonical"]',
    document: {
      title: "Test Person | LinkedIn",
      querySelector: () => null,
      querySelectorAll: () => [],
      body: emptyNode,
    },
    location: { href: "https://www.linkedin.com/in/test-person/" },
    check: (result) =>
      typeof result?.linkedinUrl === "string" && typeof result?.pageText === "string",
  },
  {
    name: "extractLinkedInThread",
    anchor: "sent the following message",
    document: {
      body: threadDom.page,
      activeElement: null,
      createTreeWalker: (root) => {
        const nodes = threadDom.textNodesByRoot.get(root) ?? [];
        let index = 0;
        return { nextNode: () => nodes[index++] ?? null };
      },
      querySelector: () => null,
      // "*" finds the shadow host; the header query returns only an avatar for somebody who is not in
      // the conversation, so direction has to come from the one-to-one inference, not the nav.
      querySelectorAll: (selector) =>
        selector === "*"
          ? [threadDom.host]
          : selector.includes("img")
            ? [{ getAttribute: () => "Decoy Person" }]
            : [],
    },
    location: { href: "https://www.linkedin.com/in/some-profile/" },
    // Asserting the parse, not just the shape: a self-contained function that parses nothing would
    // still return the right *shape*. Together these pin the container climb (name comes from the
    // composer, not the decoy row), direction (from the nav name), and that a body line starting
    // with "Send" no longer ends the thread early.
    check: (result) =>
      typeof result?.threadUrl === "string" &&
      result?.otherName === "Test Contact" &&
      result?.isDirectionKnown === true &&
      result?.messages?.length === 2 &&
      result?.messages?.[0]?.direction === "contact" &&
      result?.messages?.[1]?.direction === "me" &&
      result?.messages?.[1]?.body.includes("Send the resume when ready.") &&
      !/Maximize|Remove reaction|👍/.test(result?.messages?.[1]?.body ?? ""),
  },
];

function findSource(anchor) {
  for (const file of readdirSync(chunksDir)) {
    if (!file.endsWith(".js")) continue;
    const source = readFileSync(join(chunksDir, file), "utf8");
    const anchorAt = source.indexOf(anchor);
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

for (const spec of specs) {
  const fnSource = findSource(spec.anchor);
  if (!fnSource) {
    console.error(`verify-extractor: could not locate ${spec.name} in the bundle.`);
    process.exit(1);
  }

  try {
    const run = new Function("document", "location", `return (${fnSource})();`);
    const result = run(spec.document, spec.location);
    if (!spec.check(result)) {
      console.error(`verify-extractor: ${spec.name} ran, but returned an unexpected result:`, result);
      process.exit(1);
    }
  } catch (error) {
    console.error(
      `verify-extractor: the bundled ${spec.name} is NOT self-contained — it will throw inside\n` +
        "the LinkedIn page. Move whatever it references into the function body.\n",
      error,
    );
    process.exit(1);
  }
}

console.log(`verify-extractor: ok (${specs.map((s) => s.name).join(", ")} are self-contained)`);
