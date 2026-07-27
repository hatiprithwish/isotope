import { z } from "zod";
import { ZSaveMessageTemplateEntryInput } from "./MessageTemplateCommon";

export const ZSaveMessageTemplateApiRequest = ZSaveMessageTemplateEntryInput;
export type SaveMessageTemplateApiRequest = z.infer<typeof ZSaveMessageTemplateApiRequest>;

export const ZResolveMessageTemplatesBulkApiRequest = z.object({
  contactIds: z.array(z.number().int().positive()).min(1),
});
export type ResolveMessageTemplatesBulkApiRequest = z.infer<
  typeof ZResolveMessageTemplatesBulkApiRequest
>;
