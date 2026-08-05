import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { apiClient } from "@/providers/apiClient";
import type * as Schemas from "@app/schemas";
import { toast } from "sonner";

export class StatusChangeNotesQueries {
  static readonly keys = {
    all: () => ["status-change-notes"] as const,
    list: (entityType: Schemas.StatusChangeEntityTypeEnum, entityId: number) =>
      ["status-change-notes", entityType, entityId] as const,
  };

  static list(
    entityType: Schemas.StatusChangeEntityTypeEnum,
    entityId: number,
    getToken: () => Promise<string | null>,
  ) {
    return queryOptions({
      queryKey: StatusChangeNotesQueries.keys.list(entityType, entityId),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetStatusChangeNotesApiResponse>(
          `/status-change-notes?entityType=${entityType}&entityId=${entityId}`,
          getToken,
          { signal },
        ),
    });
  }
}

export function useCreateStatusChangeNote() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Schemas.CreateStatusChangeNoteApiRequest) =>
      apiClient<Schemas.CreateStatusChangeNoteApiResponse>("/status-change-notes", getToken, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: async (response) => {
      if (response.statusChangeNote) {
        await queryClient.invalidateQueries({
          queryKey: StatusChangeNotesQueries.keys.list(
            response.statusChangeNote.entityType,
            response.statusChangeNote.entityId,
          ),
        });
      }
    },
    onError: () => {
      toast.error("Failed to save status change note. Please try again.");
    },
  });
}

export function useBulkCreateStatusChangeNotes() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Schemas.BulkCreateStatusChangeNotesApiRequest) =>
      apiClient<Schemas.BulkCreateStatusChangeNotesApiResponse>(
        "/status-change-notes/bulk",
        getToken,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      ),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: StatusChangeNotesQueries.keys.all(),
      });
      // `entityIds` passed to this mutation are already narrowed to ids the preceding bulk
      // update confirmed it changed (see updatedIds usage at the call sites) — a skip here
      // means the ownership check disagreed with that, which shouldn't happen in practice but
      // is worth surfacing rather than letting the caller's plain success toast paper over it.
      if (response.skippedIds && response.skippedIds.length > 0) {
        toast.warning(
          `${response.skippedIds.length} status note(s) could not be saved (entity not found).`,
        );
      }
    },
    onError: () => {
      toast.error("Failed to save status change notes. Please try again.");
    },
  });
}
