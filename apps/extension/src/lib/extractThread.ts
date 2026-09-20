/** "me" / "contact" — mirrors Schemas.ContactHistoryDirectionEnum, which cannot be imported here. */
export type ThreadDirection = "me" | "contact";

export interface ExtractedMessage {
  /** Name exactly as the thread rendered it — kept so a mis-assigned direction is visible. */
  sender: string;
  direction: ThreadDirection;
  /** ISO timestamp, or null when the message sat above the first date separator. */
  sentAt: string | null;
  body: string;
}

export interface ExtractedThread {
  /** The signed-in LinkedIn user's name as it appears on their messages. Empty when not resolved. */
  myName: string;
  /**
   * False when there is no trustworthy way to tell which messages are the user's own. The panel
   * must refuse to log then: filing every message under the wrong direction is worse than none.
   */
  isDirectionKnown: boolean;
  /** The other participant. Empty when no open conversation was found. */
  otherName: string;
  messages: ExtractedMessage[];
  /** Page the conversation is open on. A chat bubble shares its host page's URL, so this alone
   *  does not identify the conversation — pair it with `otherName`. */
  threadUrl: string;
}

/**
 * Runs inside the LinkedIn tab via `chrome.scripting.executeScript`, which serialises this
 * function with `toString()` — so it must stay entirely self-contained. No imports, no
 * outer-scope identifiers, no shared helpers, no DOM globals beyond `document`/`location`
 * (`scripts/verify-extractor-selfcontained.mjs` enforces this against the built bundle).
 *
 * Messaging markup is churned as hard as the profile page, so nothing here reads a class or a
 * data attribute. It reads the conversation's *text* and anchors on the screen-reader
 * affordances, which are stable because LinkedIn's accessibility conformance rests on them:
 *
 *   Attach an image to your conversation with Anusha J   <- composer: names the open conversation
 *   SEP 4                                                <- date separator
 *   View Anusha J’s profile                              <- immediately precedes a message header
 *   Anusha J  (She/Her)  3:24 PM                         <- message header
 *   <body lines…>
 *
 * A conversation lives in one of two places — the pane on /messaging, or a chat bubble floating
 * over any other page — and neither can be found by class. The composer text exists exactly once
 * per open conversation, so the container is located by starting there and climbing to the first
 * ancestor that also holds a message. That ancestor holds the whole message list, and none of the
 * rest of the page: not the conversation list, not the profile behind a bubble.
 *
 * A body line can itself end in a time, so a header is only accepted on the line directly after
 * "View X's profile" — that guard is what makes the parse deterministic rather than heuristic.
 */
export function extractLinkedInThread(): ExtractedThread {
  const MONTHS: Record<string, number> = {
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11,
  };

  // Whitespace is collapsed before matching, so every pattern tolerates single spaces.
  const MSG_HEAD = /^(.+?)(?:\s+\([^)]{1,20}\))?\s+(\d{1,2}:\d{2}\s*[AP]M)\s*$/;
  const DATE_SEP = /^([A-Z]{3})\s+(\d{1,2})$/;
  const TODAYISH = /^(TODAY|YESTERDAY)$/i;
  const SENT_ANCHOR = /^(.+?)\s+sent the following messages?\s+at\s+\d{1,2}:\d{2}\s*[AP]M$/;
  const VIEW_PROFILE = /^View .+?['’]s profile$/;
  const HAS_VIEW_PROFILE = /^\s*View .+?['’]s profile\s*$/m;
  const COMPOSER_ANCHOR = /^Attach (?:an image|a file) to your conversation with (.+)$/;
  // Attachment rows that render inside a message body.
  const ATTACHMENT_NOISE = /^(\d+(\.\d+)?\s?(KB|MB)|Download)$/i;
  // Controls that render as text between and after messages. `Remove reaction` is the button on a
  // message you have reacted to; a line with no letters or digits right after it is the reaction's
  // emoji summary, not something anyone wrote.
  const UI_NOISE = /^(Remove reaction|Maximize compose field)$/i;
  const REACTION_SUMMARY = /^[^\p{L}\p{N}]+$/u;
  // Climbing further than this without finding a message means there is none to find.
  const MAX_CLIMB = 30;

  const now = new Date();

  const result: ExtractedThread = {
    myName: "",
    isDirectionKnown: false,
    otherName: "",
    messages: [],
    threadUrl: location.href.split(/[?#]/)[0].replace(/\/+$/, ""),
  };

  // Names the header's avatars are labelled with. The signed-in user is one of them, but which one
  // depends on layout (the first `nav img` can be something else entirely, or have an empty alt),
  // so none is trusted on its own: a name only counts as "me" if it also sent a message in this
  // conversation. Some locales prefix the alt with "Photo of".
  const navNames = Array.from(document.querySelectorAll("nav img[alt], header img[alt]"))
    .map((img) =>
      (img.getAttribute("alt") ?? "")
        .replace(/\s+/g, " ")
        .replace(/^(photo of|profile photo of|photo for)\s+/i, "")
        .trim(),
    )
    .filter(Boolean);

  // LinkedIn renders its chat bubble inside a shadow root, which neither `querySelectorAll` nor a
  // `TreeWalker` enters — the composer text simply is not in the document as far as they are
  // concerned. So gather every shadow root on the page (nested ones included) and search each.
  const roots: Node[] = [document.body];
  const collectShadowRoots = (scope: ParentNode) => {
    for (const el of Array.from(scope.querySelectorAll("*"))) {
      if (el.shadowRoot) {
        roots.push(el.shadowRoot);
        collectShadowRoots(el.shadowRoot);
      }
    }
  };
  collectShadowRoots(document);

  // Step out of a shadow root to its host; for an ordinary element this yields null and the climb
  // ends at the document, as before.
  const parentOf = (el: HTMLElement): HTMLElement | null =>
    el.parentElement ?? (el.parentNode as { host?: HTMLElement } | null)?.host ?? null;

  // Every open conversation, found by its composer text. 4 is NodeFilter.SHOW_TEXT — spelled as a
  // number because `NodeFilter` is a global the page provides but the build guard's bare scope
  // does not, and a missing global is exactly the failure that guard exists to catch.
  const conversations: { container: HTMLElement; name: string; text: string }[] = [];
  for (const root of roots) {
    const walker = document.createTreeWalker(root, 4);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const composer = (node.nodeValue ?? "").replace(/\s+/g, " ").trim().match(COMPOSER_ANCHOR);
      if (!composer) continue;

      let container: HTMLElement | null = node.parentElement;
      let text = "";
      for (let climbed = 0; container && climbed < MAX_CLIMB; climbed++) {
        text = container.innerText ?? "";
        if (HAS_VIEW_PROFILE.test(text)) break;
        container = parentOf(container);
      }

      const name = composer[1].trim();
      // The image and file buttons both carry the anchor and resolve to the same container, and a
      // conversation with no messages has nothing to log — either way, one entry per container.
      if (container && HAS_VIEW_PROFILE.test(text)) {
        if (!conversations.some((c) => c.container === container)) {
          conversations.push({ container, name, text });
        }
      } else if (!result.otherName) {
        result.otherName = name;
      }
    }
  }

  // With several bubbles open, the one the user last typed in or clicked holds the focus; without
  // that signal there is no honest way to choose, so take the first and let the panel show who it is.
  // Focus inside a shadow root is reported as the shadow *host*; descend to what actually holds it.
  let active: Element | null = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  const chosen =
    conversations.find((c) => active && c.container.contains(active)) ?? conversations[0];

  if (!chosen) return result;

  result.otherName = chosen.name;
  const lines = chosen.text.split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim());

  // LinkedIn never renders a year, so the separator's month/day is read as this year and rolled
  // back when that lands in the future. A conversation older than twelve months is therefore
  // misdated by a year — the panel shows every timestamp so the user can catch that.
  const toIso = (monthToken: string, day: string, time: string): string | null => {
    const month = MONTHS[monthToken];
    if (month === undefined) return null;
    const parts = time.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
    if (!parts) return null;
    let hour = Number(parts[1]) % 12;
    if (/PM/i.test(parts[3])) hour += 12;
    let date = new Date(now.getFullYear(), month, Number(day), hour, Number(parts[2]));
    // One day of slack absorbs a timezone skew between the page's clock and the rendered date.
    if (date.getTime() > now.getTime() + 86_400_000) {
      date = new Date(now.getFullYear() - 1, month, Number(day), hour, Number(parts[2]));
    }
    return date.toISOString();
  };

  let currentDate: { month: string; day: string } | null = null;
  let open: {
    sender: string;
    sentAt: string | null;
    body: string[];
  } | null = null;
  let expectHeader = false;
  let isAfterReactionButton = false;

  const flush = () => {
    if (!open) return;
    const body = open.body
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    // A header with no body is a render artefact (a reaction row, a deleted message) — dropping
    // it is safer than logging an empty history entry.
    if (body) {
      // Direction needs the whole conversation to resolve, so it is filled in after the loop.
      result.messages.push({
        sender: open.sender,
        direction: "contact",
        sentAt: open.sentAt,
        body,
      });
    }
    open = null;
  };

  for (const line of lines) {
    // The composer anchor closes the conversation. Matching this exact sentence — rather than a
    // loose "Send…" prefix — is what stops a message that merely begins with "Send" from
    // truncating everything after it.
    if (COMPOSER_ANCHOR.test(line)) {
      flush();
      break;
    }

    const separator = line.match(DATE_SEP);
    if (separator && MONTHS[separator[1]] !== undefined) {
      flush();
      currentDate = { month: separator[1], day: separator[2] };
      expectHeader = false;
      continue;
    }

    if (TODAYISH.test(line)) {
      flush();
      const date = new Date(now);
      if (/YESTERDAY/i.test(line)) date.setDate(date.getDate() - 1);
      currentDate = {
        month: Object.keys(MONTHS)[date.getMonth()],
        day: String(date.getDate()),
      };
      expectHeader = false;
      continue;
    }

    // "X sent the following messages at 3:24 PM" is the screen-reader preamble to a header, not a
    // message of its own — it closes whatever came before but never opens anything.
    if (SENT_ANCHOR.test(line)) {
      flush();
      continue;
    }

    if (VIEW_PROFILE.test(line)) {
      flush();
      expectHeader = true;
      continue;
    }

    const head = expectHeader ? line.match(MSG_HEAD) : null;
    // The flag only survives to the next non-empty line; a blank line between the anchor and the
    // header is normal, anything else means the anchor was not followed by one.
    if (expectHeader && line) expectHeader = false;

    if (head) {
      flush();
      const sender = head[1].trim();
      open = {
        sender,
        sentAt: currentDate ? toIso(currentDate.month, currentDate.day, head[2]) : null,
        body: [],
      };
      continue;
    }

    if (UI_NOISE.test(line)) {
      isAfterReactionButton = /^Remove reaction$/i.test(line);
      continue;
    }
    if (isAfterReactionButton && line) {
      isAfterReactionButton = false;
      if (REACTION_SUMMARY.test(line)) continue;
    }

    if (open) {
      if (ATTACHMENT_NOISE.test(line)) continue;
      open.body.push(line);
    }
  }

  flush();

  // Direction. Alignment is CSS and the message DOM carries no "outgoing" marker that survives a
  // class change, so it is inferred from names — two independent ways, in order of trust:
  //   1. A sender who also labels an avatar in the page header is the signed-in user.
  //   2. In a one-to-one chat the only people are the contact and the user, so whoever is not the
  //      contact is the user. Group chats break that (the composer names several people), so it is
  //      skipped for any name that reads like a list.
  const senders = Array.from(new Set(result.messages.map((m) => m.sender)));
  const isOneToOne = !/,| and /.test(result.otherName);
  let myName = senders.find((sender) => navNames.includes(sender)) ?? "";
  if (!myName && isOneToOne) {
    const others = senders.filter((sender) => sender !== result.otherName);
    if (others.length === 1) myName = others[0];
  }
  result.myName = myName;
  // Known when a name was resolved, or when the contact wrote everything (so nothing is the user's).
  result.isDirectionKnown =
    Boolean(myName) || (isOneToOne && senders.every((sender) => sender === result.otherName));
  for (const message of result.messages) {
    message.direction = myName && message.sender === myName ? "me" : "contact";
  }

  return result;
}
