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
}
