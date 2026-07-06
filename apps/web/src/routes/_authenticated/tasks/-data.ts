import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { apiClient } from "@/providers/apiClient";
import type * as Schemas from "@app/schemas";
import { toast } from "sonner";

export class TasksQueries {
  // DEV_NOTE: Keys form a hierarchy — day/past/search/calendar all extend all(). Prefix keys (days/searches/calendars) are used for targeted setQueriesData/invalidation.
  static readonly keys = {
    all: () => ["tasks"] as const,
    calendars: () => ["tasks", "calendar"] as const,
    calendar: (startDate: string, endDate: string) =>
      ["tasks", "calendar", startDate, endDate] as const,
    days: () => ["tasks", "day"] as const,
    day: (date: string) => ["tasks", "day", date] as const,
    past: () => ["tasks", "past"] as const,
    searches: () => ["tasks", "search"] as const,
    search: (searchText: string) => ["tasks", "search", searchText] as const,
  };

  static calendar(startDate: string, endDate: string, getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: TasksQueries.keys.calendar(startDate, endDate),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetTasksCalendarApiResponse>("/tasks/calendar", getToken, {
          signal,
          method: "POST",
          body: JSON.stringify({ startDate, endDate }),
        }),
    });
  }

  static day(date: string, getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: TasksQueries.keys.day(date),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetTasksForDateApiResponse>("/tasks/day", getToken, {
          signal,
          method: "POST",
          body: JSON.stringify({ date }),
        }),
    });
  }

  static past(getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: TasksQueries.keys.past(),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetPastTasksApiResponse>("/tasks/past", getToken, { signal }),
    });
  }

  static search(searchText: string, getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: TasksQueries.keys.search(searchText),
      enabled: searchText.trim().length > 0,
      queryFn: ({ signal }) =>
        apiClient<Schemas.SearchTasksApiResponse>("/tasks/search", getToken, {
          signal,
          method: "POST",
          body: JSON.stringify({ searchText }),
        }),
    });
  }
}

type TaskListResponse = Schemas.ApiResponse & { tasks?: Schemas.TaskWithMeta[] };

export function useUpdateTaskStatus() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: Schemas.TaskStatusIntEnum }) =>
      apiClient<Schemas.UpdateTaskStatusApiResponse>(`/tasks/${id}`, getToken, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (response) => {
      const updated = response.task;

      // Patch cached lists in place instead of refetching everything — merge so join fields (contactName etc.) and overdueByDays survive.
      if (updated) {
        const patchList = (old: TaskListResponse | undefined): TaskListResponse | undefined =>
          old?.tasks
            ? {
                ...old,
                tasks: old.tasks.map((task) =>
                  task.id === updated.id
                    ? {
                        ...task,
                        status: updated.status,
                        statusLabel: updated.statusLabel,
                        completedAt: updated.completedAt ?? null,
                        updatedAt: updated.updatedAt ?? null,
                      }
                    : task,
                ),
              }
            : old;

        queryClient.setQueriesData({ queryKey: TasksQueries.keys.days() }, patchList);
        queryClient.setQueriesData({ queryKey: TasksQueries.keys.searches() }, patchList);
      }

      // Membership of these can change on toggle (past = completed-before-today; calendar dot colors) — refetch in the background without blocking the mutation.
      void queryClient.invalidateQueries({ queryKey: TasksQueries.keys.past() });
      void queryClient.invalidateQueries({ queryKey: TasksQueries.keys.calendars() });
    },
    onError: () => {
      toast.error("Failed to update task. Please try again.");
    },
  });
}
