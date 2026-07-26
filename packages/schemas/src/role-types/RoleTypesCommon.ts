import { z } from "zod";

export const ZRoleTypesInput = z.object({
  labels: z
    .array(z.string().trim().min(1))
    .min(0)
    .max(3, "Cannot configure more than 3 role types")
    .refine((labels) => new Set(labels).size === labels.length, {
      message: "Role type labels must be unique",
    }),
  defaultLabel: z.string().nullable(),
});
export type RoleTypesInput = z.infer<typeof ZRoleTypesInput>;

export const ZRoleTypes = ZRoleTypesInput.extend({
  id: z.number(),
  createdBy: z.string(),
  isCustomized: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
export type RoleTypes = z.infer<typeof ZRoleTypes>;
