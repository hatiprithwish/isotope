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

export type GetJobsByCompanyDALRequest = Pick<Job, "createdBy"> & { companyId: number };

export type UpdateJobDALRequest = FindJobDetailsDALRequest &
  Partial<
    NullableDALFields<Omit<Job, "id" | "createdBy" | "createdAt" | "statusLabel" | "typeLabel">>
  >;

export type DeleteJobDALRequest = Pick<Job, "id" | "createdBy">;

export type BulkDeleteJobsDALRequest = {
  ids: number[];
  createdBy: string;
};

export type BulkUpdateJobsDALRequest = {
  ids: number[];
  createdBy: string;
  status: Job["status"];
};
