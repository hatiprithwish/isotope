export default class Constants {
  static readonly APP_REDACT_FIELDS = [/clerkId/i, /clerk_id/i];

  static readonly APP_NAME = "scaffold-worker" as const;

  static readonly AI_MODELS = {
    llama: "@cf/meta/llama-4-scout-17b-16e-instruct" as const,
  } as const;

  /**
   * Extraction-only prompt: the model reformats text it is given and is told to leave a field null
   * rather than infer one. Guessing a company is worse than an empty box here, because capture
   * *creates* the company and a hallucinated name silently pollutes the companies list.
   */
  static readonly PROFILE_PARSE_SYSTEM_PROMPT = [
    "You extract contact details from the visible text of a LinkedIn profile page.",
    "Return only what the text states. Never infer, translate, expand, or invent a value.",
    "name: the profile owner's full name. Not a company, not a heading, not another person.",
    "designation: their CURRENT job title only, e.g. 'Senior Software Engineer'.",
    "companyName: the CURRENT employer only.",
    "A headline is often a tagline, not a title — if it does not clearly state a current role",
    "at a current employer, set those fields to null.",
    "If the person has no current employer (student, open to work, between jobs),",
    "set companyName and designation to null. Do not substitute a school or a past employer.",
    "Use null for anything the text does not clearly state.",
  ].join(" ");

  /** A name/title/company longer than this is the model having run on — discard rather than show it. */
  static readonly PROFILE_PARSE_MAX_FIELD_LENGTH = 120 as const;

  /** Mirrors ParsedProfileFields — every key nullable so the model can decline a field. */
  static readonly PROFILE_PARSE_JSON_SCHEMA = {
    type: "object",
    properties: {
      name: { type: ["string", "null"] },
      designation: { type: ["string", "null"] },
      companyName: { type: ["string", "null"] },
    },
    required: ["name", "designation", "companyName"],
  } as const;

  static readonly DEFAULT_PAGE_NO = 1 as const;
  static readonly DEFAULT_PAGE_SIZE = 20 as const;

  static readonly BROWSER_RUN_DELAY_MS = 1_100 as const;

  static readonly INBOUND_BLOCKED_DOMAINS = [
    "twitter.com",
    "x.com",
    "linkedin.com",
    "facebook.com",
    "instagram.com",
    "youtube.com",
    "mail.google.com",
    "outlook.live.com",
    "outlook.office.com",
    "accounts.google.com",
    "apple.com",
    "support.google.com",
  ] as const;

  static readonly INBOUND_BLOCKED_PATHS = [
    "/unsubscribe",
    "/optout",
    "/opt-out",
    "/privacy",
    "/terms",
    "/legal",
    "/help",
    "/support",
    "/contact",
    "/about",
  ] as const;

  static readonly BROWSER_RUN_URL =
    "https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-run/json" as const;

  static readonly BROWSER_RUN_PROMPT =
    "Extract job listing details: title (string, required), company (string or null), location (string or null), salary (string or null, as stated), description (string or null, first 500 chars of job description), skills (array of strings, max 15 technical skills)" as const;

  static readonly BROWSER_RUN_TIMEOUT_MS = 30_000 as const;

  // 10 hours included in Workers paid plan = 36,000 seconds
  static readonly BROWSER_RUN_MONTHLY_BUDGET_SECONDS = 36_000 as const;
  // Shut down at 80% to avoid overage charges
  static readonly BROWSER_RUN_SHUTDOWN_THRESHOLD = 0.8 as const;
  // 36_000 * 0.8 — literal to avoid static self-reference during class init
  static readonly BROWSER_RUN_SHUTDOWN_SECONDS = 28_800 as const;

  static readonly FOLLOWUP_SETTINGS_DEFAULTS = {
    stepOffsetDays: [7],
  } as const;

  // Undo window before a soft-deleted contact history entry is hard-deleted by the queued sweep.
  static readonly CONTACT_HISTORY_UNDO_WINDOW_SECONDS = 900 as const;

  static readonly CONTACT_ROLE_PILLS_DEFAULTS = {
    pillLabels: ["HR", "Tech"],
  } as const;

  static readonly ROLE_TYPES_DEFAULTS = {
    labels: [] as string[],
    defaultLabel: null as string | null,
  } as const;

  // Workers always run in UTC, but task due dates are day-keyed in the user's timezone (IST).
  // Single source of the app's day boundary — every "today" computation must go through Utility.getTodayDateKey().
  static readonly APP_UTC_OFFSET_MINUTES = 330 as const;
}
