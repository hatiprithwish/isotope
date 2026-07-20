import { z } from "zod";
import { ZJobStatusIntEnum, ZJobBase, ZJobSortColumn } from "./JobsCommon";
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
  job: ZJobBase.omit({ status: true, url: true, type: true, companyLocation: true }).extend({
    status: ZJobStatusIntEnum.optional(),
    type: ZJobBase.shape.type.optional(),
    url: z.url(),
  }),
});
export type CreateJobApiRequest = z.infer<typeof ZCreateJobApiRequest>;

export const ZUpdateJobApiRequest = z.object({
  job: ZJobBase.omit({ url: true, companyLocation: true })
    .partial()
    .extend({ url: z.url().nullable().optional() }),
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
