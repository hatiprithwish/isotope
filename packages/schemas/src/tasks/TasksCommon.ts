import z from "zod";

/** YYYY-MM-DD date key — the wire format for all task/follow-up date fields. Queries compare these lexically, so the shape must be enforced at the validation boundary. */
export const ZDateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date key");
export type DateKey = z.infer<typeof ZDateKey>;

export enum TaskStatusIntEnum {
  Pending = 1,
  Completed = 2,
  Missed = 3,
}
export const ZTaskStatusIntEnum = z.nativeEnum(TaskStatusIntEnum);

export enum TaskStatusLabelEnum {
  Pending = "Pending",
  Completed = "Completed",
  Missed = "Missed",
}
export const ZTaskStatusLabelEnum = z.nativeEnum(TaskStatusLabelEnum);

export const taskStatusIntToLabel: Record<TaskStatusIntEnum, TaskStatusLabelEnum> = {
  [TaskStatusIntEnum.Pending]: TaskStatusLabelEnum.Pending,
  [TaskStatusIntEnum.Completed]: TaskStatusLabelEnum.Completed,
  [TaskStatusIntEnum.Missed]: TaskStatusLabelEnum.Missed,
};

export const ZTaskBase = z.object({
  contactId: z.number().nullable().optional(),
  title: z.string(),
  dueAt: z.string(),
  note: z.string().nullable().optional(),
});
export type TaskBase = z.infer<typeof ZTaskBase>;

/** Raw DB row shape returned by the DAL — status as int only; the Repo maps int → label. */
export const ZTaskRecord = ZTaskBase.extend({
  id: z.number(),
  createdBy: z.string(),
  status: ZTaskStatusIntEnum,
  completedAt: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
export type TaskRecord = z.infer<typeof ZTaskRecord>;

export const ZTask = ZTaskRecord.extend({
  statusLabel: ZTaskStatusLabelEnum,
});
export type Task = z.infer<typeof ZTask>;

export const ZTaskWithMeta = ZTask.extend({
  overdueByDays: z.number(),
});
export type TaskWithMeta = z.infer<typeof ZTaskWithMeta>;

export const ZTaskCalendarDay = z.object({
  date: z.string(),
  hasPending: z.boolean(),
  hasCompleted: z.boolean(),
  hasMissed: z.boolean(),
});
export type TaskCalendarDay = z.infer<typeof ZTaskCalendarDay>;
