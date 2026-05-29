import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { apiClient } from "@/providers/apiClient";
import type * as Schemas from "@app/schemas";
import { toast } from "sonner";

export class FrameworksQueries {
  static readonly keys = {
    companyLatest: () => ["frameworks", "company", "latest"] as const,
    companyVersions: () => ["frameworks", "company", "versions"] as const,
  };

  static companyLatest(getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: FrameworksQueries.keys.companyLatest(),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetLatestFrameworkApiResponse>("/frameworks/company", getToken, {
          signal,
        }),
    });
  }

  static companyVersions(getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: FrameworksQueries.keys.companyVersions(),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetFrameworkVersionsApiResponse>(
          "/frameworks/company/versions",
          getToken,
          {
            signal,
          },
        ),
    });
  }
}

export function useGenerateFramework() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: (body: Schemas.GenerateFrameworkApiRequest) =>
      apiClient<Schemas.GenerateFrameworkApiResponse>("/frameworks/generate", getToken, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onError: () => {
      toast.error("Failed to generate framework. Please try again.");
    },
  });
}

export function useSaveFramework() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Schemas.SaveFrameworkApiRequest) =>
      apiClient<Schemas.SaveFrameworkApiResponse>("/frameworks/company", getToken, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: FrameworksQueries.keys.companyLatest(),
      });
      await queryClient.invalidateQueries({
        queryKey: FrameworksQueries.keys.companyVersions(),
      });
    },
    onError: () => {
      toast.error("Failed to save framework. Please try again.");
    },
  });
}
