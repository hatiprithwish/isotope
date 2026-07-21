import type { TaskCalendarDay, TaskRecord, TaskStatusIntEnum } from "./TasksCommon";
import type { ApiResponse } from "../common";

export type GetTasksCalendarDALRequest = { createdBy: string; startDate: string; endDate: string };

export type GetTasksForDateDALRequest = { createdBy: string; date: string; today: string };

export type GetPastTasksDALRequest = { createdBy: string; today: string };

export type SearchTasksDALRequest = { createdBy: string; searchText: string };

export type UpdateTaskStatusDALRequest = {
  id: number;
  createdBy: string;
  status: TaskStatusIntEnum;
};

export type SyncFollowUpDALRequest = {
  createdBy: string;
  contactId: number;
  dueAt: string;
  stepNumber: number;
};

export type SweepOverdueDALRequest = { today: string };

export type PauseFollowUpDALRequest = { createdBy: string; contactId: number };

export type ResumeFollowUpDALRequest = { createdBy: string; contactId: number };

export type DeleteFollowUpTasksDALRequest = { createdBy: string; contactId: number };

// DAL response shapes — raw TaskRecord rows (status int only); the Repo maps int → label and derives overdueByDays.

export interface GetTasksCalendarDALResponse extends ApiResponse {
  days?: TaskCalendarDay[];
}

export interface GetTaskRecordsDALResponse extends ApiResponse {
  tasks?: TaskRecord[];
}

export interface UpdateTaskStatusDALResponse extends ApiResponse {
  task?: TaskRecord;
}

export interface SweepOverdueTasksDALResponse extends ApiResponse {
  sweptCount?: number;
}
