import { z } from "zod";
import { ZContactBase, ZContactHistoryBase } from "./ContactsCommon";

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
