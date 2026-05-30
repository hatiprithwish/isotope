import { queryOptions, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { apiClient } from "@/providers/apiClient";
import type * as Schemas from "@app/schemas";
import { toast } from "sonner";

export class FrameworkQueries {
  static readonly keys = {
    latest: () => ["frameworks", "job-search", "latest"] as const,
  };

  static latest(getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: FrameworkQueries.keys.latest(),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetFrameworkDetailsApiResponse>("/frameworks/job-search", getToken, {
          signal,
        }),
    });
  }
}

export function useFramework() {
  const { getToken } = useAuth();
  return useQuery(FrameworkQueries.latest(getToken));
}

export function useSaveFramework() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Schemas.SaveFrameworkApiRequest) =>
      apiClient<Schemas.SaveFrameworkApiResponse>("/frameworks/job-search", getToken, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: FrameworkQueries.keys.latest(),
      });
    },
    onError: () => {
      toast.error("Failed to save job search criteria. Please try again.");
    },
  });
}
