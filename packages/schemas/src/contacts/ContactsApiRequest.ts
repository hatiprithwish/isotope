import { z } from "zod";
import {
  ZContactBase,
  ZContactHistoryBase,
  ZContactHistoryDirectionEnum,
  ZContactHistoryChannelEnum,
} from "./ContactsCommon";

export const ZGetContactsApiRequest = z.object({
  search: z.string().nullable().optional(),
  pageNo: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});
export type GetContactsApiRequest = z.infer<typeof ZGetContactsApiRequest>;

export const ZCreateContactApiRequest = z.object({
  contact: ZContactBase,
});
export type CreateContactApiRequest = z.infer<typeof ZCreateContactApiRequest>;

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
  ids: z.array(z.number().int().positive()).min(1),
});
export type BulkDeleteContactsApiRequest = z.infer<typeof ZBulkDeleteContactsApiRequest>;

export const ZBulkUpdateContactsApiRequest = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  updates: ZContactBase.omit({ name: true })
    .partial()
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "At least one field must be provided",
    }),
});
export type BulkUpdateContactsApiRequest = z.infer<typeof ZBulkUpdateContactsApiRequest>;
