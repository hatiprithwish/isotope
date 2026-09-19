/**
 * Field-by-field provenance. Surfaced in the panel so a wrong value is visibly a guess rather
 * than silently trusted — "slug" on a name means the page told us nothing and we de-slugified
 * the URL.
 */
export type ExtractionSource =
  | "json-ld"
  | "voyager"
  | "dom"
  | "og-title"
  | "document-title"
  | "slug"
  | "none";

export interface ExtractedProfile {
  name: string;
  designation: string;
  companyName: string;
  linkedinUrl: string;
  sources: {
    name: ExtractionSource;
    designation: ExtractionSource;
    companyName: ExtractionSource;
  };
}

/**
 * Runs inside the LinkedIn tab via `chrome.scripting.executeScript`, which serialises this
 * function with `toString()` — so it must stay entirely self-contained. No imports, no
 * outer-scope identifiers, no shared helpers.
 *
 * LinkedIn's markup is not a stable contract: across two loads of the same profile we observed
 * the headline move from an unclassed `<span>` to a `<p>` with hashed classes, and the `<h1>`
 * disappear entirely. So nothing here depends on a class name, and every field walks a cascade
 * from most structured (embedded JSON) to least (de-slugified URL), recording which rung won.
 * A missing field returns "" and is corrected in the panel — never blocks a capture.
 */
export function extractLinkedInProfile(): ExtractedProfile {
  const clean = (value: unknown): string =>
    typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

  const result: ExtractedProfile = {
    name: "",
    designation: "",
    companyName: "",
    linkedinUrl: location.href.split(/[?#]/)[0].replace(/\/+$/, ""),
    sources: { name: "none", designation: "none", companyName: "none" },
  };

  const take = (
    field: "name" | "designation" | "companyName",
    value: string,
    source: ExtractionSource,
  ) => {
    if (!result[field] && value) {
      result[field] = value;
      result.sources[field] = source;
    }
  };

  // 1. JSON-LD. Structured and keyed by field name, so it survives any markup change. Present on
  //    public/server-rendered profiles; absent on some client-rendered ones.
  for (const node of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(node.textContent ?? "");
    } catch {
      continue; // A malformed block is not a reason to abandon the whole cascade.
    }
    const graph: unknown[] = Array.isArray(parsed)
      ? parsed
      : ((parsed as { "@graph"?: unknown[] })?.["@graph"] ?? [parsed]);

    for (const raw of graph) {
      const entry = raw as {
        "@type"?: string;
        name?: string;
        jobTitle?: string | string[];
        worksFor?: { name?: string } | { name?: string }[];
      };
      if (entry?.["@type"] !== "Person") continue;

      take("name", clean(entry.name), "json-ld");
      take(
        "designation",
        clean(Array.isArray(entry.jobTitle) ? entry.jobTitle[0] : entry.jobTitle),
        "json-ld",
      );
      const worksFor = Array.isArray(entry.worksFor) ? entry.worksFor[0] : entry.worksFor;
      take("companyName", clean(worksFor?.name), "json-ld");
    }
  }

  // 2. Voyager payloads. Authenticated renders embed API responses in <code> blocks.
  if (!result.name || !result.companyName) {
    for (const node of Array.from(document.querySelectorAll("code"))) {
      const text = node.textContent ?? "";
      if (!text.includes("firstName") && !text.includes("publicIdentifier")) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        continue;
      }
      const stack: unknown[] = [parsed];
      let visited = 0;
      // Bounded walk — these payloads are large and deeply nested, and we only need a few keys.
      while (stack.length && visited < 5000) {
        const current = stack.pop();
        visited++;
        if (!current || typeof current !== "object") continue;
        if (Array.isArray(current)) {
          stack.push(...current);
          continue;
        }
        const obj = current as Record<string, unknown>;
        const first = clean(obj["firstName"]);
        const last = clean(obj["lastName"]);
        if (first || last) take("name", clean(`${first} ${last}`), "voyager");
        take("designation", clean(obj["headline"]), "voyager");
        stack.push(...Object.values(obj));
      }
    }
  }

  // 3. DOM. `.member-current-company` is one of the few semantic, non-hashed classes LinkedIn
  //    emits — but it is absent on some renders and on anyone without a current employer.
  take("companyName", clean(document.querySelector(".member-current-company")?.textContent), "dom");
  take("name", clean(document.querySelector("main h1")?.textContent), "dom");
  take("name", clean(document.querySelector("h1")?.textContent), "dom");

  // 4. Titles. `og:title` and `<title>` are set server-side and have outlived every markup change
  //    we have seen. Format: "Name - Job Title - Company | LinkedIn", with segments dropped when
  //    unknown and an optional "(3) " unread-count prefix.
  const parseTitle = (raw: string, source: ExtractionSource) => {
    const stripped = clean(raw)
      .replace(/^\(\d+\)\s*/, "")
      .replace(/\s*\|\s*LinkedIn\s*$/i, "");
    if (!stripped) return;
    const parts = stripped.split(" - ").map(clean).filter(Boolean);
    if (!parts.length) return;
    take("name", parts[0], source);
    if (parts.length >= 2) take("designation", parts[1], source);
    if (parts.length >= 3) take("companyName", parts[parts.length - 1], source);
  };

  parseTitle(
    document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "",
    "og-title",
  );
  parseTitle(document.title, "document-title");

  // 5. URL slug. Last resort for the one field that is required — a capture with a wrong name is
  //    editable, a capture blocked on an empty name is not.
  if (!result.name) {
    const slug = result.linkedinUrl.match(/linkedin\.com\/in\/([^/]+)/i)?.[1] ?? "";
    const words = decodeURIComponent(slug)
      .split("-")
      // Trailing profile discriminators ("john-doe-a1b2c3d4") are not part of the name.
      .filter((word) => word && !/\d/.test(word))
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
    take("name", words.join(" "), "slug");
  }

  return result;
}
