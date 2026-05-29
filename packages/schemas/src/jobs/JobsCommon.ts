import z from "zod";

// Integer enums — stored in DB, sent in API requests
export enum JobStatusIntEnum {
  Applied = 1,
  Screening = 2,
  Interview = 3,
  Offer = 4,
  Rejected = 5,
  Withdrawn = 6,
}
export const ZJobStatusIntEnum = z.enum(JobStatusIntEnum);

export enum JobStatusLabelEnum {
  Applied = "Applied",
  Screening = "Screening",
  Interview = "Interview",
  Offer = "Offer",
  Rejected = "Rejected",
  Withdrawn = "Withdrawn",
}
export const ZJobStatusLabelEnum = z.enum(JobStatusLabelEnum);

export const jobStatusIntToLabel = {
  [JobStatusIntEnum.Applied]: JobStatusLabelEnum.Applied,
  [JobStatusIntEnum.Screening]: JobStatusLabelEnum.Screening,
  [JobStatusIntEnum.Interview]: JobStatusLabelEnum.Interview,
  [JobStatusIntEnum.Offer]: JobStatusLabelEnum.Offer,
  [JobStatusIntEnum.Rejected]: JobStatusLabelEnum.Rejected,
  [JobStatusIntEnum.Withdrawn]: JobStatusLabelEnum.Withdrawn,
};

// type: 1 = manual, 2 = LLM
export enum JobTypeIntEnum {
  Manual = 1,
  LLM = 2,
}
export const ZJobTypeIntEnum = z.enum(JobTypeIntEnum);

export enum JobTypeLabelEnum {
  Manual = "Manual",
  LLM = "LLM",
}
export const ZJobTypeLabelEnum = z.enum(JobTypeLabelEnum);

export const jobTypeIntToLabel = {
  [JobTypeIntEnum.Manual]: JobTypeLabelEnum.Manual,
  [JobTypeIntEnum.LLM]: JobTypeLabelEnum.LLM,
};

export const ZJobBase = z.object({
  status: ZJobStatusIntEnum,
  title: z.string(),
  companyId: z.number().nullable().optional(),
  url: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  type: ZJobTypeIntEnum,
  description: z.string().nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  matchScore: z.number().nullable().optional(),
});
export type JobBase = z.infer<typeof ZJobBase>;

export const ZJob = ZJobBase.extend({
  id: z.number(),
  createdBy: z.string(),
  statusLabel: ZJobStatusLabelEnum,
  typeLabel: ZJobTypeLabelEnum,
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
export type Job = z.infer<typeof ZJob>;
