import { z } from "zod";
import { ZJobStatusIntEnum, ZJobTypeIntEnum, ZJobSortColumn } from "./JobsCommon";
import { ZSortDirection } from "../common";

export const ZGetJobsApiRequest = z.object({
  searchText: z.string().nullable().optional(),
  pageNo: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  sortColumn: ZJobSortColumn.optional(),
  sortDirection: ZSortDirection.optional(),
});
export type GetJobsApiRequest = z.infer<typeof ZGetJobsApiRequest>;

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

export const ZDeleteJobApiRequest = z.object({
  id: z.number().int().positive(),
});
export type DeleteJobApiRequest = z.infer<typeof ZDeleteJobApiRequest>;

export const ZBulkDeleteJobsApiRequest = z.object({
  ids: z.array(z.number().int().positive()).min(1),
});
export type BulkDeleteJobsApiRequest = z.infer<typeof ZBulkDeleteJobsApiRequest>;

export const ZBulkUpdateJobsApiRequest = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  status: ZJobStatusIntEnum,
});
export type BulkUpdateJobsApiRequest = z.infer<typeof ZBulkUpdateJobsApiRequest>;
