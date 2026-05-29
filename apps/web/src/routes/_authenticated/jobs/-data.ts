import { queryOptions } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/providers/apiClient";
import type * as Schemas from "@app/schemas";

export class JobsQueries {
  static readonly keys = {
    all: () => ["jobs"] as const,
    list: (searchText: string) => ["jobs", "list", searchText] as const,
    count: (searchText: string) => ["jobs", "count", searchText] as const,
    detail: (id: number) => ["jobs", id] as const,
  };

  static list(params: Schemas.GetJobsApiRequest, getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: JobsQueries.keys.list(params.searchText ?? ""),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetJobsApiResponse>("/jobs/list", getToken, {
          signal,
          method: "POST",
          body: JSON.stringify(params),
          headers: { "Content-Type": "application/json" },
        }),
    });
  }

  static count(params: Schemas.GetJobsApiRequest, getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: JobsQueries.keys.count(params.searchText ?? ""),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetJobsCountApiResponse>("/jobs/count", getToken, {
          signal,
          method: "POST",
          body: JSON.stringify(params),
          headers: { "Content-Type": "application/json" },
        }),
    });
  }

  static detail(id: number, getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: JobsQueries.keys.detail(id),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetJobApiResponse>(`/jobs/${id}`, getToken, { signal }),
    });
  }
}

export function useJobs(params: Schemas.GetJobsApiRequest) {
  const { getToken } = useAuth();
  return useQuery(JobsQueries.list(params, getToken));
}

export function useJobsCount(params: Schemas.GetJobsApiRequest) {
  const { getToken } = useAuth();
  return useQuery(JobsQueries.count(params, getToken));
}
