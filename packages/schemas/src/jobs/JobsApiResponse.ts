import type { Job } from "./JobsCommon";
import type { ApiResponse } from "../common";

export interface CreateJobApiResponse extends ApiResponse {
  job?: Job;
}

export interface GetJobApiResponse extends ApiResponse {
  job?: Job;
}

export interface GetJobsApiResponse extends ApiResponse {
  jobs?: Job[];
}

export interface GetJobsCountApiResponse extends ApiResponse {
  count?: number;
}

export interface UpdateJobApiResponse extends ApiResponse {
  job?: Job;
}
