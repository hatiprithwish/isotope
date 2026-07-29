import type { TaskCalendarDay, TaskRecord, TaskStatusIntEnum } from "./TasksCommon";
import type { ContactHistoryChannelEnum } from "../contacts/ContactsCommon";
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
  channel: ContactHistoryChannelEnum;
  dueAt: string;
  stepNumber: number;
  // true only when a genuinely new outbound message was just logged — stamps the prior active row
  // Completed and inserts a fresh Pending row. false for recomputes after an edit/undo of an
  // existing message's sentAt, which must only move the due date, never fabricate a completion.
  completePriorStep: boolean;
};

export type SweepOverdueDALRequest = { today: string };

export type CompleteActiveFollowUpDALRequest = {
  createdBy: string;
  contactId: number;
  channel: ContactHistoryChannelEnum;
};

export type PauseFollowUpDALRequest = {
  createdBy: string;
  contactId: number;
  channel: ContactHistoryChannelEnum;
};

export type DeleteFollowUpTasksDALRequest = {
  createdBy: string;
  contactId: number;
  // Omitted = clears the follow-up task on every channel (used when a contact is marked Dead).
  channel?: ContactHistoryChannelEnum;
};

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

export interface CompleteActiveFollowUpDALResponse extends ApiResponse {
  /** True if an active (Pending/Paused/Missed) row actually existed and was completed; false on a no-op. */
  completed?: boolean;
}
