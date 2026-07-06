import { z } from "zod";
import { ZDateKey, ZTaskStatusIntEnum } from "./TasksCommon";

export const ZGetTasksCalendarApiRequest = z.object({
  startDate: ZDateKey,
  endDate: ZDateKey,
});
export type GetTasksCalendarApiRequest = z.infer<typeof ZGetTasksCalendarApiRequest>;

export const ZGetTasksForDateApiRequest = z.object({
  date: ZDateKey,
});
export type GetTasksForDateApiRequest = z.infer<typeof ZGetTasksForDateApiRequest>;

export const ZSearchTasksApiRequest = z.object({
  searchText: z.string().min(1),
});
export type SearchTasksApiRequest = z.infer<typeof ZSearchTasksApiRequest>;

export const ZUpdateTaskStatusApiRequest = z.object({
  status: ZTaskStatusIntEnum,
});
export type UpdateTaskStatusApiRequest = z.infer<typeof ZUpdateTaskStatusApiRequest>;
