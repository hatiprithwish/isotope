import { queryOptions } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/providers/apiClient";
import type * as Schemas from "@app/schemas";

export class JobsQueries {
  static readonly keys = {
    all: () => ["jobs"] as const,
    list: (searchText: string) => ["jobs", "list", searchText] as const,
    count: () => ["jobs", "count"] as const,
    detail: (id: number) => ["jobs", id] as const,
  };

  static list(searchText: string, getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: JobsQueries.keys.list(searchText),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetJobsApiResponse>("/jobs/list", getToken, {
          signal,
          method: "POST",
          body: JSON.stringify({ searchText: searchText || undefined }),
          headers: { "Content-Type": "application/json" },
        }),
    });
  }

  static count(getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: JobsQueries.keys.count(),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetJobsCountApiResponse>("/jobs/count", getToken, { signal }),
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

export function useJobs(searchText: string) {
  const { getToken } = useAuth();
  return useQuery(JobsQueries.list(searchText, getToken));
}

export function useJobsCount() {
  const { getToken } = useAuth();
  return useQuery(JobsQueries.count(getToken));
}
