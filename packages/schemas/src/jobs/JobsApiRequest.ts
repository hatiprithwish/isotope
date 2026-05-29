import { z } from "zod";
import { ZJobStatusIntEnum, ZJobTypeIntEnum } from "./JobsCommon";

export const ZSearchJobsApiRequest = z.object({
  searchText: z.string().optional(),
});
export type SearchJobsApiRequest = z.infer<typeof ZSearchJobsApiRequest>;

export const ZCreateJobApiRequest = z.object({
  title: z.string().min(1),
  companyId: z.number().nullable().optional(),
  url: z.url(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  status: ZJobStatusIntEnum.optional(),
  type: ZJobTypeIntEnum.optional(),
});
export type CreateJobApiRequest = z.infer<typeof ZCreateJobApiRequest>;

export const ZUpdateJobApiRequest = z.object({
  title: z.string().min(1).optional(),
  companyId: z.number().nullable().optional(),
  url: z.url().optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  status: ZJobStatusIntEnum.optional(),
  type: ZJobTypeIntEnum.optional(),
  skills: z.array(z.string()).nullable().optional(),
  matchScore: z.number().nullable().optional(),
});
export type UpdateJobApiRequest = z.infer<typeof ZUpdateJobApiRequest>;
