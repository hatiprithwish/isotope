import type { NullableDALFields } from "../common";
import type { Job, JobBase } from "./JobsCommon";

export type CreateJobDALRequest = JobBase & Pick<Job, "createdBy">;

export type FindJobDALRequest = Pick<Job, "id" | "createdBy">;

export type GetJobsDALRequest = Pick<Job, "createdBy">;

export type SearchJobsDALRequest = Pick<Job, "createdBy"> & { searchText?: string };

export type UpdateJobDALRequest = FindJobDALRequest &
  NullableDALFields<Omit<Job, "id" | "createdBy" | "createdAt" | "statusLabel" | "typeLabel">>;
