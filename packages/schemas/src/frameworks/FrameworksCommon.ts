import { z } from "zod";

export const ZPrioritisedSkill = z.object({
  name: z.string(),
  priority: z.enum(["High", "Medium", "Low"]),
});
export type PrioritisedSkill = z.infer<typeof ZPrioritisedSkill>;

export const ZFramework = z.object({
  id: z.number(),
  createdBy: z.string(),
  targetRoles: z.array(z.string()),
  isRemote: z.boolean(),
  requiredSkills: z.array(z.string()),
  skills: z.array(ZPrioritisedSkill),
  minSalaryLpa: z.number(),
  minExp: z.number(),
  maxExp: z.number(),
  preferredLocations: z.array(z.string()),
  recencyWindow: z.number().int(),
  version: z.number().int(),
  isCustomized: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
export type Framework = z.infer<typeof ZFramework>;

export const ZFrameworkInput = z.object({
  targetRoles: z.array(z.string()).min(1, "At least one target role is required"),
  isRemote: z.boolean(),
  requiredSkills: z.array(z.string()).min(1, "At least one required skill is required"),
  skills: z.array(ZPrioritisedSkill),
  minSalaryLpa: z.number().min(0),
  minExp: z.number().min(0),
  maxExp: z.number().min(0),
  preferredLocations: z.array(z.string()),
  recencyWindow: z
    .number()
    .int()
    .refine((v) => [7, 14, 30].includes(v), {
      message: "Recency window must be 7, 14, or 30",
    }),
});
export type FrameworkInput = z.infer<typeof ZFrameworkInput>;
