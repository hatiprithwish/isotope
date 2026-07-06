import TasksRepo from "@/repositories/TasksRepo";
import AppLogger from "@/providers/AppLogger";
import * as Schemas from "@app/schemas";

export default class TaskMissedSweepHandler {
  static async handle(env: Env): Promise<void> {
    AppLogger.info({
      category: Schemas.LogCategory.Provider,
      action: Schemas.LogAction.SweepOverdueTasks,
      message: "Running daily Missed-task sweep",
    });

    const response = await new TasksRepo(env).sweepOverdueTasks();

    if (!response.isSuccess) {
      AppLogger.error({
        category: Schemas.LogCategory.Provider,
        action: Schemas.LogAction.SweepOverdueTasks,
        message: "Missed-task sweep failed",
        metadata: { message: response.message },
      });
    }
  }
}
