import { and, desc, eq, gte, inArray, lt, or, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { tasks, contacts, companies } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";
import Utility from "@/utils";

const taskSelection = {
  id: tasks.id,
  createdBy: tasks.createdBy,
  contactId: tasks.contactId,
  title: tasks.title,
  dueAt: tasks.dueAt,
  status: tasks.status,
  note: tasks.note,
  completedAt: tasks.completedAt,
  contactName: contacts.name,
  designation: contacts.designation,
  companyName: companies.name,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
};

/** Escapes LIKE metacharacters so user input matches literally; pair with ESCAPE '\'. */
function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export default class TasksDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  async getTasksCalendar(params: Schemas.GetTasksCalendarDALRequest) {
    const response: Schemas.GetTasksCalendarDALResponse = { isSuccess: false };

    try {
      // dueAt is a YYYY-MM-DD string — lexical comparison matches date ordering
      const rows = await this.db
        .select({ dueAt: tasks.dueAt, status: tasks.status })
        .from(tasks)
        .where(
          and(
            eq(tasks.createdBy, params.createdBy),
            gte(tasks.dueAt, params.startDate),
            lt(tasks.dueAt, params.endDate),
          ),
        );

      const byDate = new Map<string, Schemas.TaskCalendarDay>();
      for (const row of rows) {
        const existing = byDate.get(row.dueAt) ?? {
          date: row.dueAt,
          hasPending: false,
          hasCompleted: false,
          hasMissed: false,
        };
        if (row.status === Schemas.TaskStatusIntEnum.Pending) existing.hasPending = true;
        if (row.status === Schemas.TaskStatusIntEnum.Completed) existing.hasCompleted = true;
        if (row.status === Schemas.TaskStatusIntEnum.Missed) existing.hasMissed = true;
        byDate.set(row.dueAt, existing);
      }

      response.isSuccess = true;
      response.message = "Task calendar fetched successfully";
      response.days = Array.from(byDate.values());
    } catch (error) {
      const message = "Unknown error in fetching task calendar";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetTasksCalendar,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getTasksForDate(params: Schemas.GetTasksForDateDALRequest) {
    const response: Schemas.GetTaskRecordsDALResponse = { isSuccess: false };

    try {
      const isToday = params.date === params.today;

      const rows = await this.db
        .select(taskSelection)
        .from(tasks)
        .leftJoin(contacts, eq(tasks.contactId, contacts.id))
        .leftJoin(companies, eq(contacts.companyId, companies.id))
        .where(
          and(
            eq(tasks.createdBy, params.createdBy),
            isToday
              ? or(
                  and(
                    eq(tasks.dueAt, params.date),
                    eq(tasks.status, Schemas.TaskStatusIntEnum.Pending),
                  ),
                  and(
                    lt(tasks.dueAt, params.date),
                    inArray(tasks.status, [
                      Schemas.TaskStatusIntEnum.Pending,
                      Schemas.TaskStatusIntEnum.Missed,
                    ]),
                  ),
                )
              : eq(tasks.dueAt, params.date),
          ),
        )
        .orderBy(tasks.dueAt, tasks.id);

      response.isSuccess = true;
      response.message = "Tasks fetched successfully";
      response.tasks = rows;
    } catch (error) {
      const message = "Unknown error in fetching tasks for date";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetTasksForDate,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getPastTasks(params: Schemas.GetPastTasksDALRequest) {
    const response: Schemas.GetTaskRecordsDALResponse = { isSuccess: false };

    try {
      const rows = await this.db
        .select(taskSelection)
        .from(tasks)
        .leftJoin(contacts, eq(tasks.contactId, contacts.id))
        .leftJoin(companies, eq(contacts.companyId, companies.id))
        .where(
          and(
            eq(tasks.createdBy, params.createdBy),
            eq(tasks.status, Schemas.TaskStatusIntEnum.Completed),
            lt(tasks.dueAt, params.today),
          ),
        )
        .orderBy(desc(tasks.dueAt), desc(tasks.id))
        .limit(50);

      response.isSuccess = true;
      response.message = "Past tasks fetched successfully";
      response.tasks = rows;
    } catch (error) {
      const message = "Unknown error in fetching past tasks";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetPastTasks,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async searchTasks(params: Schemas.SearchTasksDALRequest) {
    const response: Schemas.GetTaskRecordsDALResponse = { isSuccess: false };

    try {
      const pattern = `%${escapeLikePattern(params.searchText.trim())}%`;

      const rows = await this.db
        .select(taskSelection)
        .from(tasks)
        .leftJoin(contacts, eq(tasks.contactId, contacts.id))
        .leftJoin(companies, eq(contacts.companyId, companies.id))
        .where(
          and(
            eq(tasks.createdBy, params.createdBy),
            or(
              sql`${tasks.title} LIKE ${pattern} ESCAPE '\\'`,
              sql`${contacts.name} LIKE ${pattern} ESCAPE '\\'`,
              sql`${companies.name} LIKE ${pattern} ESCAPE '\\'`,
            ),
          ),
        )
        .orderBy(tasks.dueAt)
        .limit(50);

      response.isSuccess = true;
      response.message = "Tasks searched successfully";
      response.tasks = rows;
    } catch (error) {
      const message = "Unknown error in searching tasks";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SearchTasks,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async updateTaskStatus(params: Schemas.UpdateTaskStatusDALRequest) {
    const response: Schemas.UpdateTaskStatusDALResponse = { isSuccess: false };

    try {
      const updated = await this.db
        .update(tasks)
        .set({
          status: params.status,
          completedAt:
            params.status === Schemas.TaskStatusIntEnum.Completed
              ? Utility.getCurrentISOTimestamp()
              : null,
          updatedAt: Utility.getCurrentISOTimestamp(),
        })
        .where(and(eq(tasks.id, params.id), eq(tasks.createdBy, params.createdBy)))
        .returning()
        .get();

      if (!updated) {
        const message = "Task not found";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.UpdateTaskStatus,
          message,
          metadata: params,
        });
        response.message = message;
        return response;
      }

      response.isSuccess = true;
      response.message = "Task updated successfully";
      response.task = updated;
    } catch (error) {
      const message = "Unknown error in updating task status";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.UpdateTaskStatus,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async syncFollowUpForContact(params: Schemas.SyncFollowUpDALRequest) {
    const response: Schemas.ApiResponse = { isSuccess: false };

    try {
      const [existing] = await this.db
        .select({ id: tasks.id })
        .from(tasks)
        .where(
          and(
            eq(tasks.createdBy, params.createdBy),
            eq(tasks.contactId, params.contactId),
            eq(tasks.status, Schemas.TaskStatusIntEnum.Pending),
          ),
        )
        .limit(1);

      if (existing) {
        await this.db
          .update(tasks)
          .set({ dueAt: params.dueAt, updatedAt: Utility.getCurrentISOTimestamp() })
          .where(eq(tasks.id, existing.id));

        response.isSuccess = true;
        response.message = "Follow-up task updated successfully";
        return response;
      }

      // Insert path needs the contact's name for the task title — resolved here with a single narrow column read.
      const [contact] = await this.db
        .select({ name: contacts.name })
        .from(contacts)
        .where(and(eq(contacts.id, params.contactId), eq(contacts.createdBy, params.createdBy)))
        .limit(1);

      if (!contact) {
        const message = "Contact not found for follow-up sync";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.SyncFollowUpTask,
          message,
          metadata: params,
        });
        response.message = message;
        return response;
      }

      await this.db.insert(tasks).values({
        createdBy: params.createdBy,
        contactId: params.contactId,
        title: `Follow up with ${contact.name}`,
        dueAt: params.dueAt,
        status: Schemas.TaskStatusIntEnum.Pending,
        note: null,
        completedAt: null,
        createdAt: Utility.getCurrentISOTimestamp(),
        updatedAt: null,
      });

      response.isSuccess = true;
      response.message = "Follow-up task created successfully";
    } catch (error) {
      const message = "Unknown error in syncing follow-up task for contact";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SyncFollowUpTask,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  /** Removes the pending follow-up task for a contact — used when the contact has no remaining outbound messages. */
  async deletePendingFollowUp(params: Schemas.DeletePendingFollowUpDALRequest) {
    const response: Schemas.ApiResponse = { isSuccess: false };

    try {
      await this.db
        .delete(tasks)
        .where(
          and(
            eq(tasks.createdBy, params.createdBy),
            eq(tasks.contactId, params.contactId),
            eq(tasks.status, Schemas.TaskStatusIntEnum.Pending),
          ),
        );

      response.isSuccess = true;
      response.message = "Pending follow-up task deleted successfully";
    } catch (error) {
      const message = "Unknown error in deleting pending follow-up task for contact";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.DeletePendingFollowUpTask,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async sweepOverdueTasks(params: Schemas.SweepOverdueDALRequest) {
    const response: Schemas.SweepOverdueTasksDALResponse = { isSuccess: false };

    try {
      const result = await this.db
        .update(tasks)
        .set({
          status: Schemas.TaskStatusIntEnum.Missed,
          updatedAt: Utility.getCurrentISOTimestamp(),
        })
        .where(
          and(eq(tasks.status, Schemas.TaskStatusIntEnum.Pending), lt(tasks.dueAt, params.today)),
        )
        .run();

      const sweptCount = result.meta.changes ?? 0;

      AppLogger.info({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SweepOverdueTasks,
        message: `Marked ${sweptCount} task(s) as missed`,
        metadata: { today: params.today, count: sweptCount },
      });

      response.isSuccess = true;
      response.message = "Overdue tasks swept successfully";
      response.sweptCount = sweptCount;
    } catch (error) {
      const message = "Unknown error in sweeping overdue tasks";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SweepOverdueTasks,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }
}
