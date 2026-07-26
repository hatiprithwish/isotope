import { z } from "zod";

export const ZContactRolePillsInput = z.object({
  pillLabels: z.array(z.string().trim().min(1)).min(0).max(5, "Cannot configure more than 5 pills"),
});
export type ContactRolePillsInput = z.infer<typeof ZContactRolePillsInput>;

export const ZContactRolePills = ZContactRolePillsInput.extend({
  id: z.number(),
  createdBy: z.string(),
  version: z.number().int(),
  isCustomized: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
export type ContactRolePills = z.infer<typeof ZContactRolePills>;
