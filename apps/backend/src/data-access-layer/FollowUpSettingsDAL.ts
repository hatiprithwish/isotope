import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { followUpSettings } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";
import Utility from "@/utils";
import Constants from "@/config/Constants";

export default class FollowUpSettingsDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  async getSettingsDetails(
    params: Schemas.GetFollowUpSettingsDALRequest,
  ): Promise<Schemas.GetFollowUpSettingsApiResponse> {
    const response: Schemas.GetFollowUpSettingsApiResponse = { isSuccess: false };

    try {
      const [row] = await this.db
        .select()
        .from(followUpSettings)
        .where(eq(followUpSettings.createdBy, params.createdBy))
        .orderBy(desc(followUpSettings.version))
        .limit(1);

      response.isSuccess = true;

      if (!row) {
        response.settings = null;
        response.message = "No follow-up settings found";
        return response;
      }

      response.settings = this.deserialise(row);
      response.message = "Follow-up settings fetched successfully";
    } catch (error) {
      const message = "Unknown error fetching follow-up settings";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetFollowUpSettings,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async saveSettings(
    params: Schemas.SaveFollowUpSettingsDALRequest,
  ): Promise<Schemas.SaveFollowUpSettingsApiResponse> {
    const latest = await this.getSettingsDetails({ createdBy: params.createdBy });
    if (!latest.isSuccess) {
      return { isSuccess: false, message: "Failed to determine next version" };
    }
    const nextVersion = latest.settings ? latest.settings.version + 1 : 1;
    const { input } = params;
    return this.createSettings({
      createdBy: params.createdBy,
      stepOffsetDays: JSON.stringify(input.stepOffsetDays),
      isCustomized: true,
      version: nextVersion,
    });
  }

  async createDefaultIfAbsent(createdBy: string): Promise<void> {
    try {
      const existing = await this.db
        .select({ id: followUpSettings.id })
        .from(followUpSettings)
        .where(eq(followUpSettings.createdBy, createdBy))
        .limit(1);

      if (existing.length > 0) return;

      const d = Constants.FOLLOWUP_SETTINGS_DEFAULTS;
      await this.db.insert(followUpSettings).values({
        createdBy,
        stepOffsetDays: JSON.stringify(d.stepOffsetDays),
        isCustomized: false,
        version: 1,
        createdAt: Utility.getCurrentISOTimestamp(),
        updatedAt: null,
      });
    } catch (error) {
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SaveFollowUpSettings,
        message: "Failed to seed default follow-up settings",
        error,
        metadata: { createdBy },
      });
    }
  }

  async createSettings(
    params: Schemas.CreateFollowUpSettingsDALRequest,
  ): Promise<Schemas.SaveFollowUpSettingsApiResponse> {
    const response: Schemas.SaveFollowUpSettingsApiResponse = { isSuccess: false };

    try {
      const row = await this.db
        .insert(followUpSettings)
        .values({
          createdBy: params.createdBy,
          stepOffsetDays: params.stepOffsetDays,
          isCustomized: params.isCustomized,
          version: params.version,
          createdAt: Utility.getCurrentISOTimestamp(),
          updatedAt: null,
        })
        .returning()
        .get();

      response.isSuccess = true;
      response.message = "Follow-up settings saved successfully";
      response.settings = this.deserialise(row);
    } catch (error) {
      const message = "Unknown error saving follow-up settings";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SaveFollowUpSettings,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  private deserialise(row: typeof followUpSettings.$inferSelect): Schemas.FollowUpSettings {
    return {
      id: row.id,
      createdBy: row.createdBy,
      stepOffsetDays: this.parseJsonArray<number>(row.stepOffsetDays),
      version: row.version,
      isCustomized: Boolean(row.isCustomized),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? null,
    };
  }

  private parseJsonArray<T>(value: string): T[] {
    try {
      return JSON.parse(value) as T[];
    } catch {
      return [];
    }
  }
}
