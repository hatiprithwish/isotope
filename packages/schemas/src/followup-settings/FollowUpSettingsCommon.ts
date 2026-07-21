import { z } from "zod";

export const ZFollowUpSettingsInput = z.object({
  stepOffsetDays: z
    .array(z.number().int().positive())
    .min(0)
    .max(12, "Cannot configure more than 12 follow-up steps"),
});
export type FollowUpSettingsInput = z.infer<typeof ZFollowUpSettingsInput>;

export const ZFollowUpSettings = ZFollowUpSettingsInput.extend({
  id: z.number(),
  createdBy: z.string(),
  version: z.number().int(),
  isCustomized: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
export type FollowUpSettings = z.infer<typeof ZFollowUpSettings>;
