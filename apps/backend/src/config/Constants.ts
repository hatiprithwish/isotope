export default class Constants {
  static readonly APP_REDACT_FIELDS = [/clerkId/i, /clerk_id/i];

  static readonly APP_NAME = "scaffold-worker" as const;

  static readonly AI_MODELS = {
    llama: "@cf/meta/llama-4-scout-17b-16e-instruct" as const,
  } as const;

  static readonly DEFAULT_PAGE_NO = 1 as const;
  static readonly DEFAULT_PAGE_SIZE = 20 as const;

  static readonly JOB_SEARCH_FRAMEWORK_DEFAULTS = {
    targetRoles: ["Backend Engineer", "SDE-1", "SDE-2", "Software Engineer", "Backend Developer"],
    isRemote: true,
    requiredSkills: ["Node.js", "Express.js"],
    minSalaryLpa: 10,
    minExp: 2,
    maxExp: 5.5,
    skills: [
      { name: "AWS", priority: "High" as const },
      { name: "Cloudflare Workers", priority: "Medium" as const },
      { name: "Node.js", priority: "High" as const },
      { name: "Express.js", priority: "Medium" as const },
    ],
    preferredLocations: ["Remote", "India (any city)"],
    recencyWindow: 7,
  } as const;

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

  // Workers always run in UTC, but task due dates are day-keyed in the user's timezone (IST).
  // Single source of the app's day boundary — every "today" computation must go through Utility.getTodayDateKey().
  static readonly APP_UTC_OFFSET_MINUTES = 330 as const;
}
