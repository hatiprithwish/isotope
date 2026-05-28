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
  jobId: z.number().nullable().optional(),
  designation: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  linkedinConnected: z.boolean().nullable().optional(),
  sequencePosition: z.number().nullable().optional(),
  lastTouchAt: z.string().nullable().optional(),
  nextTouchDueAt: z.string().nullable().optional(),
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

export const ZContactHistoryBase = z.object({
  contactId: z.number(),
  type: z.string(),
  channel: z.string(),
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
