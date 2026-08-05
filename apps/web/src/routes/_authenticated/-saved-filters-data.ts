import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { apiClient, ApiError } from "@/providers/apiClient";
import type * as Schemas from "@app/schemas";
import { toast } from "sonner";

export class SavedFiltersQueries {
  // DEV_NOTE: Keys form a hierarchy — list extends all. Invalidating all() clears every
  // entity type's saved filters in one call.
  static readonly keys = {
    all: () => ["saved-filters"] as const,
    list: (entityType: Schemas.SavedFilterEntityTypeIntEnum) =>
      ["saved-filters", entityType] as const,
  };

  static list(
    entityType: Schemas.SavedFilterEntityTypeIntEnum,
    getToken: () => Promise<string | null>,
  ) {
    return queryOptions({
      queryKey: SavedFiltersQueries.keys.list(entityType),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetSavedFiltersApiResponse>(
          `/saved-filters?entityType=${entityType}`,
          getToken,
          { signal },
        ),
    });
  }
}

export function useCreateSavedFilter() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Schemas.CreateSavedFilterApiRequest) =>
      apiClient<Schemas.CreateSavedFilterApiResponse>("/saved-filters", getToken, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SavedFiltersQueries.keys.all() });
    },
    onError: (error) => {
      // Duplicate-name conflicts are shown inline in the save dialog, not as a toast.
      if (error instanceof ApiError && error.status === 409) return;
      toast.error("Failed to save filter. Please try again.");
    },
  });
}

export function useUpdateSavedFilter() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Schemas.UpdateSavedFilterApiRequest }) =>
      apiClient<Schemas.UpdateSavedFilterApiResponse>(`/saved-filters/${id}`, getToken, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SavedFiltersQueries.keys.all() });
    },
    onError: (error) => {
      // Duplicate-name conflicts from the rename dialog are shown inline there, not as a toast.
      if (error instanceof ApiError && error.status === 409) return;
      toast.error("Failed to update filter. Please try again.");
    },
  });
}

export function useDeleteSavedFilter() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient<void>(`/saved-filters/${id}`, getToken, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SavedFiltersQueries.keys.all() });
    },
    onError: () => {
      toast.error("Failed to delete filter. Please try again.");
    },
  });
}
