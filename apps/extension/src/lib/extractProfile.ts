/**
 * Field-by-field provenance. Surfaced in the panel so a wrong value is visibly a guess rather
 * than silently trusted — "slug" on a name means the page told us nothing and we de-slugified
 * the URL.
 */
export type ExtractionSource =
  | "json-ld"
  | "voyager"
  | "dom"
  | "page-text"
  /** Not produced by the extractor — set by the panel when the AI fallback supplied the value. */
  | "ai"
  | "og-title"
  | "document-title"
  | "slug"
  | "none";

export interface ExtractedProfile {
  name: string;
  designation: string;
  companyName: string;
  linkedinUrl: string;
  /** Trimmed top-card text, sent for AI parsing only when a field above comes back empty. */
  pageText: string;
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
    pageText: "",
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

  // LinkedIn is an SPA: moving between profiles rewrites the DOM and the URL but leaves everything
  // in <head> from the *first* page load — og:title, canonical, and any JSON-LD included. Reading
  // those after an in-app navigation returns the previous person under the new person's URL.
  // `canonical`/`og:url` still point at the old profile in that case, which is the tell.
  const slugOf = (url: string | null | undefined): string => {
    const raw = url?.match(/linkedin\.com\/in\/([^/?#]+)/i)?.[1] ?? "";
    try {
      return decodeURIComponent(raw).toLowerCase();
    } catch {
      return raw.toLowerCase();
    }
  };
  const currentSlug = slugOf(location.href);
  const headSlug =
    slugOf(document.querySelector('link[rel="canonical"]')?.getAttribute("href")) ||
    slugOf(document.querySelector('meta[property="og:url"]')?.getAttribute("content"));
  const isHeadStale = Boolean(headSlug) && headSlug !== currentSlug;

  // When the head can't be trusted, a title-derived name is only accepted if it plausibly belongs
  // to this URL. Slugs are usually "first-last-<digits>" or a squashed "firstlast"; both are
  // covered by comparing on letters only.
  const slugTokens = currentSlug
    .split("-")
    .filter((token) => token.length >= 3 && !/\d/.test(token));
  const slugLetters = currentSlug.replace(/[^a-z]/g, "");
  const isPlausibleForUrl = (name: string): boolean => {
    const lower = name.toLowerCase();
    return (
      !slugLetters ||
      slugTokens.some((token) => lower.includes(token)) ||
      lower.replace(/[^a-z]/g, "").includes(slugLetters)
    );
  };

  // Most headlines are taglines ("Helping engineers 2X their pay | Tech Lead | Ex-Meta"), not a job
  // title, so one only yields a title/company when its first segment reads "<title> at <company>".
  const parseHeadline = (headline: string): { title: string; company: string } => {
    const match = headline.split("|")[0].match(/^(.{2,80}?)\s+(?:at|@)\s+(.{2,80})$/i);
    return { title: clean(match?.[1]), company: clean(match?.[2]) };
  };

  // 1. JSON-LD. Structured and keyed by field name, so it survives any markup change. Present on
  //    public/server-rendered profiles; absent on some client-rendered ones. Lives in <head>, so it
  //    is skipped entirely when the head is stale.
  for (const node of isHeadStale
    ? []
    : Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
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
        // These payloads hold many people (connections, "more profiles for you") and survive
        // in-app navigation from the first page load. Only the object whose publicIdentifier is
        // this URL's slug is the profile being viewed — any other firstName is somebody else.
        if (currentSlug && clean(obj["publicIdentifier"]).toLowerCase() === currentSlug) {
          const first = clean(obj["firstName"]);
          const last = clean(obj["lastName"]);
          if (first || last) take("name", clean(`${first} ${last}`), "voyager");
          const headline = parseHeadline(clean(obj["headline"]));
          take("designation", headline.title, "voyager");
          take("companyName", headline.company, "voyager");
        }
        stack.push(...Object.values(obj));
      }
    }
  }

  // 3. Visible page. The rendered DOM is rewritten on every in-app navigation, so unlike <head> it
  //    can't go stale — but its markup is unstable, so nothing here keys off a class or tag.
  //    Instead read the page's *text*: top-card layout has been consistent even as classes churn.
  //      <name> / "· 2nd" / <headline> / <location> / … / "Contact info" / <current company> / …
  const mainEl = document.querySelector("main") as HTMLElement | null;
  const mainLines = (mainEl?.innerText ?? mainEl?.textContent ?? "")
    .split("\n")
    .map(clean)
    .filter(Boolean)
    .slice(0, 40);

  // Only the top card is worth sending — the About section and activity feed add tokens without
  // adding name/title/company. Cut at the followers/connections line, which sits just past the
  // current-company row, and hard-cap whatever is left.
  // The 4000 cap is inlined, not a module constant: this function is serialised by
  // `executeScript`, so a hoisted outer identifier becomes a ReferenceError in the page. It must
  // stay <= PARSE_PROFILE_MAX_TEXT_LENGTH in packages/schemas, which rejects anything larger.
  const tailIndex = mainLines.findIndex((line) => /followers?$|connections?$/i.test(line));
  result.pageText = mainLines
    .slice(0, tailIndex > 0 ? tailIndex + 1 : 20)
    .join("\n")
    .slice(0, 4000);

  // Name: the first candidate that plausibly belongs to this URL. Validating against the slug is
  //    what stops a "More profiles for you" heading or a banner from being taken as the name.
  const nameCandidates = [
    mainLines[0] ?? "",
    ...Array.from(document.querySelectorAll("h1, h2")).map((el) => clean(el.textContent)),
  ];
  take(
    "name",
    nameCandidates.find(
      (text) => text.length > 0 && text.length <= 80 && isPlausibleForUrl(text),
    ) ?? "",
    "dom",
  );

  // Company, most to least structured. `.member-current-company` and the "Current company"
  //    aria-label are semantic when present but are missing on some renders.
  take("companyName", clean(document.querySelector(".member-current-company")?.textContent), "dom");
  const ariaCompany = Array.from(document.querySelectorAll('[aria-label*="Current company" i]'))
    .map(
      (el) =>
        (el.getAttribute("aria-label") ?? "").match(
          /Current company:\s*(.+?)(?:\.\s*Click|$)/i,
        )?.[1],
    )
    .find(Boolean);
  take("companyName", clean(ariaCompany), "dom");

  // Otherwise the first real line after "Contact info" in the top card. Caveat: a profile with no
  //    current employer but an education entry would surface the school here, so this is flagged
  //    "page-text" and the panel tells the user to check it.
  const contactInfoIndex = mainLines.findIndex((line) => /^contact info$/i.test(line));
  const isTopCardNoise = (line: string): boolean =>
    line.length < 2 ||
    /^[·•|]+$/.test(line) ||
    /^\d/.test(line) ||
    /followers?|connections?|mutual/i.test(line) ||
    /^(follow|message|connect|pending|more|save in sales navigator)$/i.test(line);
  take(
    "companyName",
    contactInfoIndex >= 0
      ? (mainLines
          .slice(contactInfoIndex + 1, contactInfoIndex + 4)
          .find((l) => !isTopCardNoise(l)) ?? "")
      : "",
    "page-text",
  );

  // Headline is the first substantive line after the name (skipping "· 2nd" / pronouns). Most are
  //    taglines, so it only yields a title when its first segment reads "<title> at <company>".
  const nameLineIndex = Math.max(0, mainLines.indexOf(result.name));
  const headline =
    mainLines
      .slice(nameLineIndex + 1, nameLineIndex + 5)
      .find(
        (line) => line.length > 8 && !/^[·•]/.test(line) && !/^\(?[a-z]+\/[a-z]+\)?$/i.test(line),
      ) ?? "";
  const parsedHeadline = parseHeadline(headline);
  take("designation", parsedHeadline.title, "page-text");
  take("companyName", parsedHeadline.company, "page-text");

  // 4. Titles. Format: "Name - Job Title - Company | LinkedIn", with segments dropped when unknown
  //    and an optional "(3) " unread-count prefix. `<title>` goes first because LinkedIn's router
  //    keeps it current across in-app navigation; the `og:title` meta tag does not update, so it
  //    is only a fallback, and never used once the head is known to be stale.
  const parseTitle = (raw: string, source: ExtractionSource) => {
    const stripped = clean(raw)
      .replace(/^\(\d+\)\s*/, "")
      .replace(/\s*\|\s*LinkedIn\s*$/i, "");
    if (!stripped) return;
    const parts = stripped.split(" - ").map(clean).filter(Boolean);
    if (!parts.length) return;
    if (isHeadStale && !isPlausibleForUrl(parts[0])) return;
    take("name", parts[0], source);
    if (parts.length >= 2) take("designation", parts[1], source);
    if (parts.length >= 3) take("companyName", parts[parts.length - 1], source);
  };

  parseTitle(document.title, "document-title");
  if (!isHeadStale) {
    parseTitle(
      document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "",
      "og-title",
    );
  }

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
