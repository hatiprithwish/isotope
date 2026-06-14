import { eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { browserRunBudget } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";
import Constants from "@/config/Constants";

export default class BrowserRunBudgetDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  private static nextMonthResetAt(): string {
    const now = new Date();
    const resetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return resetAt.toISOString();
  }

  private static isResetDue(resetAt: string): boolean {
    return new Date() >= new Date(resetAt);
  }

  async isShutdown(): Promise<boolean> {
    try {
      const [row] = await this.db.select().from(browserRunBudget).limit(1);

      if (!row) {
        // No row yet — budget is fresh, not shutdown
        return false;
      }

      if (BrowserRunBudgetDAL.isResetDue(row.resetAt)) {
        // Month rolled over — reset the counter before checking
        await this.db
          .update(browserRunBudget)
          .set({
            usedSeconds: 0,
            resetAt: BrowserRunBudgetDAL.nextMonthResetAt(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(browserRunBudget.id, row.id));

        AppLogger.info({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.BrowserRunBudgetReset,
          message: "Browser Run monthly budget reset",
          metadata: { previousUsedSeconds: row.usedSeconds, previousResetAt: row.resetAt },
        });

        return false;
      }

      const shutdown = row.usedSeconds >= Constants.BROWSER_RUN_SHUTDOWN_SECONDS;

      AppLogger.info({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.BrowserRunBudgetChecked,
        message: `Browser Run budget check — ${shutdown ? "SHUTDOWN" : "OK"}`,
        metadata: {
          usedSeconds: row.usedSeconds,
          shutdownThresholdSeconds: Constants.BROWSER_RUN_SHUTDOWN_SECONDS,
          monthlyBudgetSeconds: Constants.BROWSER_RUN_MONTHLY_BUDGET_SECONDS,
          shutdown,
        },
      });

      return shutdown;
    } catch (error) {
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.BrowserRunBudgetChecked,
        message: "Failed to check Browser Run budget — allowing call to proceed",
        error,
      });
      // Fail open: if D1 is down, don't block scraping
      return false;
    }
  }

  async recordUsage(params: Schemas.IncrementBrowserRunBudgetDALRequest): Promise<void> {
    try {
      const [existing] = await this.db.select().from(browserRunBudget).limit(1);

      if (!existing) {
        await this.db.insert(browserRunBudget).values({
          usedSeconds: params.elapsedSeconds,
          resetAt: BrowserRunBudgetDAL.nextMonthResetAt(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        await this.db
          .update(browserRunBudget)
          .set({
            usedSeconds: sql`${browserRunBudget.usedSeconds} + ${params.elapsedSeconds}`,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(browserRunBudget.id, existing.id));
      }

      AppLogger.info({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.BrowserRunBudgetRecorded,
        message: "Browser Run usage recorded",
        metadata: { elapsedSeconds: params.elapsedSeconds },
      });
    } catch (error) {
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.BrowserRunBudgetRecorded,
        message: "Failed to record Browser Run usage",
        error,
        metadata: params,
      });
    }
  }
}
