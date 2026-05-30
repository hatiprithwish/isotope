import z from "zod";
import { ZPrioritisedSkill } from "./FrameworksCommon";

export const ZSaveFrameworkApiRequest = z.object({
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
export type SaveFrameworkApiRequest = z.infer<typeof ZSaveFrameworkApiRequest>;
