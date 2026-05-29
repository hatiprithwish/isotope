import { z } from "zod";

export enum FrameworkTypeIntEnum {
  CompanyResearch = 1,
  JobSearch = 2,
  AbTesting = 3,
}

export const ZScoredCriterion = z.object({
  name: z.string().min(1),
  whyItMatters: z.string().min(1),
  whatToLookFor: z.string().min(1),
  weight: z.number().int().min(0).max(5),
  autoNoGo: z.boolean(),
});
export type ScoredCriterion = z.infer<typeof ZScoredCriterion>;

export const ZCompanyFrameworkFormInputs = z.object({
  salaryMin: z.number().min(0),
  salaryMax: z.number().min(0),
  locations: z.array(z.string()).min(1),
  ethicsRedFlags: z.array(z.string()),
  scoredCriteria: z.array(ZScoredCriterion).min(1),
  strongFitThreshold: z.number().int().min(1).max(99),
  conditionalFitThreshold: z.number().int().min(1).max(99),
});
export type CompanyFrameworkFormInputs = z.infer<typeof ZCompanyFrameworkFormInputs>;

export const ZFramework = z.object({
  id: z.number(),
  createdBy: z.string(),
  type: z.number(),
  content: z.string(),
  formInputs: z.string().nullable().optional(),
  version: z.number(),
  isCustomized: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
export type Framework = z.infer<typeof ZFramework>;
