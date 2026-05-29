import type { NullableDALFields } from "../common";
import type { Job, JobBase } from "./JobsCommon";

export type CreateJobDALRequest = JobBase & Pick<Job, "createdBy">;

export type FindJobDetailsDALRequest = Pick<Job, "id" | "createdBy">;

export type GetJobsDALRequest = Pick<Job, "createdBy"> & {
  searchText: string | null;
};

export type UpdateJobDALRequest = FindJobDetailsDALRequest &
  Partial<
    NullableDALFields<Omit<Job, "id" | "createdBy" | "createdAt" | "statusLabel" | "typeLabel">>
  >;
