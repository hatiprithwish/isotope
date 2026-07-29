import { and, desc, eq, gt, gte, inArray, lt, ne, or, sql } from "drizzle-orm";
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
  channel: tasks.channel,
  title: tasks.title,
  dueAt: tasks.dueAt,
  status: tasks.status,
  stepNumber: tasks.stepNumber,
  pausedAt: tasks.pausedAt,
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
          hasPaused: false,
        };
        if (row.status === Schemas.TaskStatusIntEnum.Pending) existing.hasPending = true;
        if (row.status === Schemas.TaskStatusIntEnum.Completed) existing.hasCompleted = true;
        if (row.status === Schemas.TaskStatusIntEnum.Missed) existing.hasMissed = true;
        if (row.status === Schemas.TaskStatusIntEnum.Paused) existing.hasPaused = true;
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
                    inArray(tasks.status, [
                      Schemas.TaskStatusIntEnum.Pending,
                      Schemas.TaskStatusIntEnum.Paused,
                    ]),
                  ),
                  and(
                    lt(tasks.dueAt, params.date),
                    inArray(tasks.status, [
                      Schemas.TaskStatusIntEnum.Pending,
                      Schemas.TaskStatusIntEnum.Missed,
                      Schemas.TaskStatusIntEnum.Paused,
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
      // A contact+channel can now have historical Completed rows plus at most one active
      // (Pending/Paused) row (see syncFollowUpForContact). Un-completing a row that isn't the
      // newest for its contact+channel would create a second simultaneously-active row, which
      // every follow-up DAL method assumes cannot happen — block it here rather than downstream.
      // Gated on the row's CURRENT status being Completed (not just the requested status being
      // non-Completed) — this is specifically a "reopen" guard, not a general restriction on
      // transitioning old rows to any other status.
      if (params.status !== Schemas.TaskStatusIntEnum.Completed) {
        const [target] = await this.db
          .select({
            contactId: tasks.contactId,
            channel: tasks.channel,
            createdAt: tasks.createdAt,
            status: tasks.status,
          })
          .from(tasks)
          .where(and(eq(tasks.id, params.id), eq(tasks.createdBy, params.createdBy)))
          .limit(1);

        if (target?.contactId != null && target.status === Schemas.TaskStatusIntEnum.Completed) {
          const [newer] = await this.db
            .select({ id: tasks.id })
            .from(tasks)
            .where(
              and(
                eq(tasks.createdBy, params.createdBy),
                eq(tasks.contactId, target.contactId),
                eq(tasks.channel, target.channel),
                ne(tasks.id, params.id),
                // createdAt alone isn't a reliable strict-ordering key at millisecond resolution —
                // two rows can share a timestamp under concurrent requests. Tie-break on id (an
                // autoincrement PK, so strictly insertion-ordered) to avoid a same-millisecond
                // sibling falsely counting as "newer" and permanently blocking a legitimate un-complete.
                or(
                  gt(tasks.createdAt, target.createdAt),
                  and(eq(tasks.createdAt, target.createdAt), gt(tasks.id, params.id)),
                ),
              ),
            )
            .limit(1);

          if (newer) {
            const message = "Cannot reopen a superseded follow-up task";
            AppLogger.error({
              category: Schemas.LogCategory.DAL,
              action: Schemas.LogAction.UpdateTaskStatus,
              message,
              metadata: params,
            });
            response.message = message;
            return response;
          }
        }
      }

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
      // Matches Pending, Paused, AND Missed rows — Advance must unconditionally supersede a Paused
      // row left over from an inbound reply (see followup-sequences-plan.md §5), and a Missed row
      // left over from the nightly overdue sweep (TasksDAL.sweepOverdueTasks) — an overdue task the
      // user finally acted on is exactly as "closed out" as one they completed on time, not a task
      // that should be silently orphaned while a brand new Pending row gets inserted alongside it.
      // Scoped to channel — email and linkedin each have their own active follow-up row.
      const [existing] = await this.db
        .select({ id: tasks.id })
        .from(tasks)
        .where(
          and(
            eq(tasks.createdBy, params.createdBy),
            eq(tasks.contactId, params.contactId),
            eq(tasks.channel, params.channel),
            inArray(tasks.status, [
              Schemas.TaskStatusIntEnum.Pending,
              Schemas.TaskStatusIntEnum.Paused,
              Schemas.TaskStatusIntEnum.Missed,
            ]),
          ),
        )
        .limit(1);

      // A genuinely new outbound message closes out the prior active row as Completed rather than
      // mutating it in place, so completing a step is visible in Past tasks/history. A recompute
      // triggered by editing or undoing an existing message's sentAt (completePriorStep=false)
      // must only move the due date on the same row — it did not represent a real new touch.
      if (existing && params.completePriorStep) {
        await this.db
          .update(tasks)
          .set({
            status: Schemas.TaskStatusIntEnum.Completed,
            completedAt: Utility.getCurrentISOTimestamp(),
            pausedAt: null,
            updatedAt: Utility.getCurrentISOTimestamp(),
          })
          .where(eq(tasks.id, existing.id));
      } else if (existing) {
        await this.db
          .update(tasks)
          .set({
            dueAt: params.dueAt,
            stepNumber: params.stepNumber,
            status: Schemas.TaskStatusIntEnum.Pending,
            pausedAt: null,
            updatedAt: Utility.getCurrentISOTimestamp(),
          })
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

      // Next step's row — a fresh insert following a completed prior step (or the very first
      // touch, when no prior row existed at all). A contact+channel accumulates one Completed row
      // per step plus at most one active (Pending/Paused) row.
      await this.db.insert(tasks).values({
        createdBy: params.createdBy,
        contactId: params.contactId,
        channel: params.channel,
        title: `Follow up with ${contact.name}`,
        dueAt: params.dueAt,
        status: Schemas.TaskStatusIntEnum.Pending,
        stepNumber: params.stepNumber,
        pausedAt: null,
        note: null,
        completedAt: null,
        createdAt: Utility.getCurrentISOTimestamp(),
        updatedAt: null,
      });

      response.isSuccess = true;
      response.message = existing
        ? "Follow-up task completed and advanced successfully"
        : "Follow-up task created successfully";
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

  /** Pauses the contact's active Pending (or overdue Missed) follow-up task — no-op (still success) if none exists. */
  async pauseFollowUpForContact(params: Schemas.PauseFollowUpDALRequest) {
    const response: Schemas.ApiResponse = { isSuccess: false };

    try {
      await this.db
        .update(tasks)
        .set({
          status: Schemas.TaskStatusIntEnum.Paused,
          pausedAt: Utility.getCurrentISOTimestamp(),
          updatedAt: Utility.getCurrentISOTimestamp(),
        })
        .where(
          and(
            eq(tasks.createdBy, params.createdBy),
            eq(tasks.contactId, params.contactId),
            eq(tasks.channel, params.channel),
            // Includes Missed — a reply resolves an overdue task exactly like a Pending one.
            inArray(tasks.status, [
              Schemas.TaskStatusIntEnum.Pending,
              Schemas.TaskStatusIntEnum.Missed,
            ]),
          ),
        );

      response.isSuccess = true;
      response.message = "Follow-up task paused successfully";
    } catch (error) {
      const message = "Unknown error in pausing follow-up task for contact";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.PauseFollowUpTask,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  /**
   * Marks the contact's active Pending, Paused, or Missed follow-up task Completed in place — used
   * when an outbound message finishes the sequence (no further steps configured), so there is no
   * next-step row to insert. No-op (still success, `completed: false`) if none is active — the
   * response's `completed` flag lets a caller actually distinguish the two, unlike a bare
   * isSuccess/void return. Completed-only by design (no generic `status` param) — this never
   * "activates" a row, so it can't silently revive a follow-up on a stale dueAt/stepNumber the way
   * a generic status setter here would invite.
   */
  async completeActiveFollowUp(params: Schemas.CompleteActiveFollowUpDALRequest) {
    const response: Schemas.CompleteActiveFollowUpDALResponse = { isSuccess: false };

    try {
      const result = await this.db
        .update(tasks)
        .set({
          status: Schemas.TaskStatusIntEnum.Completed,
          completedAt: Utility.getCurrentISOTimestamp(),
          pausedAt: null,
          updatedAt: Utility.getCurrentISOTimestamp(),
        })
        .where(
          and(
            eq(tasks.createdBy, params.createdBy),
            eq(tasks.contactId, params.contactId),
            eq(tasks.channel, params.channel),
            inArray(tasks.status, [
              Schemas.TaskStatusIntEnum.Pending,
              Schemas.TaskStatusIntEnum.Paused,
              Schemas.TaskStatusIntEnum.Missed,
            ]),
          ),
        )
        .run();

      response.isSuccess = true;
      response.completed = (result.meta.changes ?? 0) > 0;
      response.message = "Follow-up task status updated successfully";
    } catch (error) {
      const message = "Unknown error in updating active follow-up task status for contact";
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

  /** Removes the contact's active Pending, Paused, or Missed follow-up task — used when there are no remaining outbound messages, the sequence completes, or the contact is marked Dead. */
  async deleteFollowUpTasks(params: Schemas.DeleteFollowUpTasksDALRequest) {
    const response: Schemas.ApiResponse = { isSuccess: false };

    try {
      await this.db
        .delete(tasks)
        .where(
          and(
            eq(tasks.createdBy, params.createdBy),
            eq(tasks.contactId, params.contactId),
            params.channel ? eq(tasks.channel, params.channel) : undefined,
            inArray(tasks.status, [
              Schemas.TaskStatusIntEnum.Pending,
              Schemas.TaskStatusIntEnum.Paused,
              Schemas.TaskStatusIntEnum.Missed,
            ]),
          ),
        );

      response.isSuccess = true;
      response.message = "Follow-up task(s) deleted successfully";
    } catch (error) {
      const message = "Unknown error in deleting follow-up task(s) for contact";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.DeleteFollowUpTasks,
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
