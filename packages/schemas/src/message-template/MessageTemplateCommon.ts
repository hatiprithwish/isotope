import { z } from "zod";

export const ZMessageTemplateEntry = z.object({
  step: z.number().int().min(0),
  variantLabel: z.string().nullable(),
  body: z.string().max(2000, "Template cannot exceed 2000 characters"),
});
export type MessageTemplateEntry = z.infer<typeof ZMessageTemplateEntry>;

export const ZSaveMessageTemplateEntryInput = ZMessageTemplateEntry;
export type SaveMessageTemplateEntryInput = z.infer<typeof ZSaveMessageTemplateEntryInput>;

export const ZMessageTemplate = ZMessageTemplateEntry.extend({
  id: z.number(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
export type MessageTemplate = z.infer<typeof ZMessageTemplate>;

export function renderTemplate(
  template: string,
  values: { name: string; company: string | null },
): string {
  return template
    .replaceAll("[Name]", values.name)
    .replaceAll("[Company]", values.company ?? "[Company]");
}
