import type { Task, TaskCalendarDay, TaskWithMeta } from "./TasksCommon";
import type { ApiResponse } from "../common";

export interface GetTasksCalendarApiResponse extends ApiResponse {
  days?: TaskCalendarDay[];
}

export interface GetTasksForDateApiResponse extends ApiResponse {
  tasks?: TaskWithMeta[];
}

export interface GetPastTasksApiResponse extends ApiResponse {
  tasks?: TaskWithMeta[];
}

export interface SearchTasksApiResponse extends ApiResponse {
  tasks?: TaskWithMeta[];
}

export interface UpdateTaskStatusApiResponse extends ApiResponse {
  task?: Task;
}
