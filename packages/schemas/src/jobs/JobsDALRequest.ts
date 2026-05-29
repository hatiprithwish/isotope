import type { NullableDALFields } from "../common";
import type { Job, JobBase, JobSortColumn } from "./JobsCommon";
import type { SortDirection } from "../common";

export type CreateJobDALRequest = JobBase & Pick<Job, "createdBy">;

export type FindJobDetailsDALRequest = Pick<Job, "id" | "createdBy">;

export type GetJobsDALRequest = Pick<Job, "createdBy"> & {
  searchText: string | null;
  pageNo: number;
  pageSize: number;
  sortColumn: JobSortColumn;
  sortDirection: SortDirection;
};

export type GetJobsCountDALRequest = Pick<Job, "createdBy"> & {
  searchText: string | null;
};

export type UpdateJobDALRequest = FindJobDetailsDALRequest &
  NullableDALFields<Omit<Job, "id" | "createdBy" | "createdAt" | "statusLabel" | "typeLabel">>;
