import dayjs from "dayjs";
import TasksDAL from "@/data-access-layer/TasksDAL";
import Utility from "@/utils";
import * as Schemas from "@app/schemas"; // runtime `import *` (not `import type`): this repo consumes the taskStatusIntToLabel value for int → label mapping.

export default class TasksRepo {
  private dal: TasksDAL;

  constructor(env: Env) {
    this.dal = new TasksDAL(env);
  }

  /** Maps DAL rows (int status) to the API shape — label + overdueByDays. Label mapping lives here, never in the DAL. */
  private withMeta(row: Schemas.TaskRecord, today: string): Schemas.TaskWithMeta {
    return {
      ...row,
      statusLabel: Schemas.taskStatusIntToLabel[row.status],
      overdueByDays: Math.max(0, dayjs(today).diff(dayjs(row.dueAt), "day")),
    };
  }

  private withStatusLabel(row: Schemas.TaskRecord): Schemas.Task {
    return { ...row, statusLabel: Schemas.taskStatusIntToLabel[row.status] };
  }

  async getTasksCalendar(params: Schemas.GetTasksCalendarApiRequest & { userId: string }) {
    const dalResponse = await this.dal.getTasksCalendar({
      createdBy: params.userId,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    const response: Schemas.GetTasksCalendarApiResponse = dalResponse;
    return response;
  }

  async getTasksForDate(params: Schemas.GetTasksForDateApiRequest & { userId: string }) {
    const today = Utility.getTodayDateKey();
    const dalResponse = await this.dal.getTasksForDate({
      createdBy: params.userId,
      date: params.date,
      today,
    });

    const response: Schemas.GetTasksForDateApiResponse = {
      ...dalResponse,
      tasks: dalResponse.tasks?.map((row) => this.withMeta(row, today)),
    };
    return response;
  }

  async getPastTasks(params: { userId: string }) {
    const today = Utility.getTodayDateKey();
    const dalResponse = await this.dal.getPastTasks({ createdBy: params.userId, today });

    const response: Schemas.GetPastTasksApiResponse = {
      ...dalResponse,
      tasks: dalResponse.tasks?.map((row) => this.withMeta(row, today)),
    };
    return response;
  }

  async searchTasks(params: Schemas.SearchTasksApiRequest & { userId: string }) {
    const today = Utility.getTodayDateKey();
    const dalResponse = await this.dal.searchTasks({
      createdBy: params.userId,
      searchText: params.searchText,
    });

    const response: Schemas.SearchTasksApiResponse = {
      ...dalResponse,
      tasks: dalResponse.tasks?.map((row) => this.withMeta(row, today)),
    };
    return response;
  }

  async updateTaskStatus(
    params: Schemas.UpdateTaskStatusApiRequest & { userId: string; id: number },
  ) {
    const dalResponse = await this.dal.updateTaskStatus({
      id: params.id,
      createdBy: params.userId,
      status: params.status,
    });

    const response: Schemas.UpdateTaskStatusApiResponse = {
      ...dalResponse,
      task: dalResponse.task ? this.withStatusLabel(dalResponse.task) : undefined,
    };
    return response;
  }

  /** Invoked from ContactsRepo after a sent message is logged — keeps the follow-up task in sync with the contact's next touch date. */
  async syncFollowUpForContact(params: { userId: string; contactId: number; dueAt: string }) {
    return await this.dal.syncFollowUpForContact({
      createdBy: params.userId,
      contactId: params.contactId,
      dueAt: params.dueAt,
    });
  }

  /** Invoked from ContactsRepo after a history change leaves no remaining sent messages — removes the now-orphaned pending follow-up task. */
  async deletePendingFollowUp(params: { userId: string; contactId: number }) {
    return await this.dal.deletePendingFollowUp({
      createdBy: params.userId,
      contactId: params.contactId,
    });
  }

  /** Nightly cron entry — flips all Pending tasks past the app-timezone day boundary to Missed. */
  async sweepOverdueTasks() {
    return await this.dal.sweepOverdueTasks({ today: Utility.getTodayDateKey() });
  }
}
