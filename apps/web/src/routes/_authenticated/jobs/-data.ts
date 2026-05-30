import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/providers/apiClient";
import type * as Schemas from "@app/schemas";
import { toast } from "sonner";

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

export function useCreateJob() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Schemas.CreateJobApiRequest) =>
      apiClient<Schemas.CreateJobApiResponse>("/jobs", getToken, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: JobsQueries.keys.all() });
    },
    onError: () => {
      toast.error("Failed to create job. Please try again.");
    },
  });
}

export function useUpdateJob() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Schemas.UpdateJobApiRequest }) =>
      apiClient<Schemas.UpdateJobApiResponse>(`/jobs/${id}`, getToken, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: async (response) => {
      if (response.job) {
        queryClient.setQueryData(JobsQueries.keys.detail(response.job.id), response);
      }
      await queryClient.invalidateQueries({ queryKey: JobsQueries.keys.all() });
    },
    onError: () => {
      toast.error("Failed to update job. Please try again.");
    },
  });
}
