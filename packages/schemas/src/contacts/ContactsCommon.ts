import z from "zod";

export enum ContactStatusIntEnum {
  NotStarted = 1,
  DraftReady = 2,
  InPipeline = 3,
  Replied = 4,
  Closed = 5,
  Dead = 6,
  ReEngage = 7,
  Failed = 8,
}
export const ZContactStatusIntEnum = z.nativeEnum(ContactStatusIntEnum);

export enum ContactStatusLabelEnum {
  NotStarted = "Not Started",
  DraftReady = "Draft Ready",
  InPipeline = "In Pipeline",
  Replied = "Replied",
  Closed = "Closed",
  Dead = "Dead",
  ReEngage = "Re-Engage",
  Failed = "Failed",
}
export const ZContactStatusLabelEnum = z.nativeEnum(ContactStatusLabelEnum);

export const contactStatusIntToLabel: Record<ContactStatusIntEnum, ContactStatusLabelEnum> = {
  [ContactStatusIntEnum.NotStarted]: ContactStatusLabelEnum.NotStarted,
  [ContactStatusIntEnum.DraftReady]: ContactStatusLabelEnum.DraftReady,
  [ContactStatusIntEnum.InPipeline]: ContactStatusLabelEnum.InPipeline,
  [ContactStatusIntEnum.Replied]: ContactStatusLabelEnum.Replied,
  [ContactStatusIntEnum.Closed]: ContactStatusLabelEnum.Closed,
  [ContactStatusIntEnum.Dead]: ContactStatusLabelEnum.Dead,
  [ContactStatusIntEnum.ReEngage]: ContactStatusLabelEnum.ReEngage,
  [ContactStatusIntEnum.Failed]: ContactStatusLabelEnum.Failed,
};

export enum ContactSourceIntEnum {
  Apollo = 1,
  Manual = 2,
}
export const ZContactSourceIntEnum = z.nativeEnum(ContactSourceIntEnum);

export enum ContactSourceLabelEnum {
  Apollo = "Apollo",
  Manual = "Manual",
}
export const ZContactSourceLabelEnum = z.nativeEnum(ContactSourceLabelEnum);

export const contactSourceIntToLabel: Record<ContactSourceIntEnum, ContactSourceLabelEnum> = {
  [ContactSourceIntEnum.Apollo]: ContactSourceLabelEnum.Apollo,
  [ContactSourceIntEnum.Manual]: ContactSourceLabelEnum.Manual,
};

export const ZContactBase = z.object({
  name: z.string(),
  status: ZContactStatusIntEnum,
  companyId: z.number(),
  designation: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  linkedinConnected: z.boolean().nullable().optional(),
  sequencePosition: z.number().nullable().optional(),
  lastTouchAt: z.string().nullable().optional(),
  deadAt: z.string().nullable().optional(),
  reEngageAt: z.string().nullable().optional(),
  abVariable: z.string().nullable().optional(),
  abVariant: z.string().nullable().optional(),
  abReplied: z.boolean().nullable().optional(),
  draftBody: z.string().nullable().optional(),
  draftSubject: z.string().nullable().optional(),
  personalizationNotes: z.string().nullable().optional(),
  manualPersonalizationNotes: z.string().nullable().optional(),
  reengagementRecommendation: z.string().nullable().optional(),
  source: ZContactSourceIntEnum.nullable().optional(),
  notes: z.string().nullable().optional(),
  failedAt: z.string().nullable().optional(),
  retryCount: z.number().nullable().optional(),
});
export type ContactBase = z.infer<typeof ZContactBase>;

export const ZContact = ZContactBase.extend({
  id: z.number(),
  createdBy: z.string(),
  statusLabel: ZContactStatusLabelEnum,
  companyName: z.string().nullable().optional(),
  companyFitBand: z.number().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
export type Contact = z.infer<typeof ZContact>;

export enum ContactHistoryDirectionEnum {
  Me = "me",
  Contact = "contact",
}
export const ZContactHistoryDirectionEnum = z.nativeEnum(ContactHistoryDirectionEnum);

export enum ContactHistoryChannelEnum {
  Email = "email",
  LinkedIn = "linkedin",
}
export const ZContactHistoryChannelEnum = z.nativeEnum(ContactHistoryChannelEnum);

/** Single owner of channel display labels — "linkedin".charAt(0).toUpperCase() would render "Linkedin", not "LinkedIn". */
export const CONTACT_HISTORY_CHANNEL_LABEL_MAP: Record<ContactHistoryChannelEnum, string> = {
  [ContactHistoryChannelEnum.Email]: "Email",
  [ContactHistoryChannelEnum.LinkedIn]: "LinkedIn",
};

// Single owner of the "<channel>_<direction>" history-type convention — build and match types only through these, never with string literals or LIKE patterns.
export const CONTACT_HISTORY_SENT_SUFFIX = "_sent" as const;
export const CONTACT_HISTORY_RECEIVED_SUFFIX = "_received" as const;

export function buildContactHistoryType(
  channel: ContactHistoryChannelEnum,
  direction: ContactHistoryDirectionEnum,
): string {
  const suffix =
    direction === ContactHistoryDirectionEnum.Me
      ? CONTACT_HISTORY_SENT_SUFFIX
      : CONTACT_HISTORY_RECEIVED_SUFFIX;
  return `${channel}${suffix}`;
}

/** Shared by the bulk-log Zod request schema (server) and the bulk-log page (client) — one cap, enforced both places. */
export const BULK_LOG_CONTACT_HISTORY_MAX_ENTRIES = 50;

/** Shared by the bulk-create Zod request schema (server) and the bulk-add page (client) — one cap, enforced both places. */
export const BULK_CREATE_CONTACTS_MAX_ENTRIES = 50;

/** Exact outbound type values ("email_sent", "linkedin_sent", …) — use with inArray/includes instead of suffix pattern-matching. */
export const CONTACT_HISTORY_SENT_TYPES: string[] = Object.values(ContactHistoryChannelEnum).map(
  (channel) => `${channel}${CONTACT_HISTORY_SENT_SUFFIX}`,
);

export const ZContactHistoryBase = z.object({
  contactId: z.number(),
  type: z.string(),
  channel: ZContactHistoryChannelEnum,
  subject: z.string().nullable().optional(),
  body: z.string(),
  sequencePosition: z.number().nullable().optional(),
  abVariable: z.string().nullable().optional(),
  abVariant: z.string().nullable().optional(),
  sentAt: z.string(),
});
export type ContactHistoryBase = z.infer<typeof ZContactHistoryBase>;

export const ZContactHistory = ZContactHistoryBase.extend({
  id: z.number(),
  createdBy: z.string(),
  createdAt: z.string(),
});
export type ContactHistory = z.infer<typeof ZContactHistory>;
