import { z } from "zod";
import {
  ZContactBase,
  ZContactHistoryBase,
  ZContactHistoryDirectionEnum,
  ZContactHistoryChannelEnum,
  BULK_LOG_CONTACT_HISTORY_MAX_ENTRIES,
  BULK_CREATE_CONTACTS_MAX_ENTRIES,
  BULK_CONTACT_IDS_MAX_ENTRIES,
} from "./ContactsCommon";
import { ZIntFilterList } from "../common";

export const ZGetContactsApiRequest = z.object({
  search: z.string().nullable().optional(),
  statuses: ZIntFilterList.optional(),
  pageNo: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});
export type GetContactsApiRequest = z.infer<typeof ZGetContactsApiRequest>;

export const ZCheckDuplicateContactApiRequest = z.object({
  email: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  excludeId: z.coerce.number().int().positive().optional(),
});
export type CheckDuplicateContactApiRequest = z.infer<typeof ZCheckDuplicateContactApiRequest>;

export const ZCreateContactApiRequest = z.object({
  contact: ZContactBase,
});
export type CreateContactApiRequest = z.infer<typeof ZCreateContactApiRequest>;

/**
 * Upper bound on the page text sent for AI parsing. A LinkedIn profile's full rendered text runs
 * far longer than the top card we actually need, and every extra character is billed — the client
 * trims to this, and the server refuses anything larger rather than silently paying for it.
 */
export const PARSE_PROFILE_MAX_TEXT_LENGTH = 4000;

/** Raw visible page text from a LinkedIn profile, for the AI parse fallback. */
export const ZParseProfileApiRequest = z.object({
  pageText: z.string().trim().min(1).max(PARSE_PROFILE_MAX_TEXT_LENGTH),
  linkedinUrl: z.string().trim().min(1),
});
export type ParseProfileApiRequest = z.infer<typeof ZParseProfileApiRequest>;

/**
 * One-shot capture from the browser extension: the caller has a company *name* scraped off a
 * page, not a companyId, so the server resolves (or creates) the company itself. Status and
 * source are server-owned defaults, never sent by the client.
 */
export const ZCaptureContactApiRequest = z.object({
  name: z.string().trim().min(1),
  companyName: z.string().trim().min(1),
  linkedinUrl: z.string().trim().min(1),
  designation: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});
export type CaptureContactApiRequest = z.infer<typeof ZCaptureContactApiRequest>;

export const ZUpdateContactApiRequest = z.object({
  contact: ZContactBase.partial(),
});
export type UpdateContactApiRequest = z.infer<typeof ZUpdateContactApiRequest>;

export const ZCreateContactHistoryApiRequest = z.object({
  history: ZContactHistoryBase,
});
export type CreateContactHistoryApiRequest = z.infer<typeof ZCreateContactHistoryApiRequest>;

export const ZLogContactHistoryApiRequest = z.object({
  direction: ZContactHistoryDirectionEnum,
  channel: ZContactHistoryChannelEnum,
  body: z.string().min(1),
  sentAt: z.string(),
  subject: z.string().nullable().optional(),
});
export type LogContactHistoryApiRequest = z.infer<typeof ZLogContactHistoryApiRequest>;

export const ZUpdateContactHistoryApiRequest = z.object({
  body: z.string().min(1).optional(),
  sentAt: z.string().optional(),
  subject: z.string().nullable().optional(),
});
export type UpdateContactHistoryApiRequest = z.infer<typeof ZUpdateContactHistoryApiRequest>;

export const ZBulkDeleteContactsApiRequest = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1)
    .max(
      BULK_CONTACT_IDS_MAX_ENTRIES,
      `At most ${BULK_CONTACT_IDS_MAX_ENTRIES} contacts can be deleted at once`,
    ),
});
export type BulkDeleteContactsApiRequest = z.infer<typeof ZBulkDeleteContactsApiRequest>;

export const ZBulkUpdateContactsApiRequest = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1)
    .max(
      BULK_CONTACT_IDS_MAX_ENTRIES,
      `At most ${BULK_CONTACT_IDS_MAX_ENTRIES} contacts can be updated at once`,
    ),
  updates: ZContactBase.omit({ name: true })
    .partial()
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "At least one field must be provided",
    }),
});
export type BulkUpdateContactsApiRequest = z.infer<typeof ZBulkUpdateContactsApiRequest>;

export const ZBulkLogContactHistoryEntry = ZLogContactHistoryApiRequest.extend({
  contactId: z.number().int().positive(),
});
export type BulkLogContactHistoryEntry = z.infer<typeof ZBulkLogContactHistoryEntry>;

export const ZBulkLogContactHistoryApiRequest = z.object({
  entries: z
    .array(ZBulkLogContactHistoryEntry)
    .min(1)
    .max(
      BULK_LOG_CONTACT_HISTORY_MAX_ENTRIES,
      `At most ${BULK_LOG_CONTACT_HISTORY_MAX_ENTRIES} messages can be logged at once`,
    ),
});
export type BulkLogContactHistoryApiRequest = z.infer<typeof ZBulkLogContactHistoryApiRequest>;

export const ZBulkCreateContactsEntry = ZContactBase.extend({
  tempId: z.string(),
});
export type BulkCreateContactsEntry = z.infer<typeof ZBulkCreateContactsEntry>;

export const ZBulkCreateContactsApiRequest = z.object({
  entries: z
    .array(ZBulkCreateContactsEntry)
    .min(1)
    .max(
      BULK_CREATE_CONTACTS_MAX_ENTRIES,
      `At most ${BULK_CREATE_CONTACTS_MAX_ENTRIES} contacts can be added at once`,
    ),
});
export type BulkCreateContactsApiRequest = z.infer<typeof ZBulkCreateContactsApiRequest>;
