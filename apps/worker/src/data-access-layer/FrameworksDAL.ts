import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { jobSearchFrameworks } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";
import Utility from "@/utils";
import Constants from "@/config/Constants";

export default class FrameworksDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  async getFrameworkDetails(
    params: Schemas.GetFrameworkDALRequest,
  ): Promise<Schemas.GetFrameworkDetailsApiResponse> {
    const response: Schemas.GetFrameworkDetailsApiResponse = { isSuccess: false };

    try {
      const [row] = await this.db
        .select()
        .from(jobSearchFrameworks)
        .where(eq(jobSearchFrameworks.createdBy, params.createdBy))
        .orderBy(desc(jobSearchFrameworks.version))
        .limit(1);

      response.isSuccess = true;

      if (!row) {
        response.framework = null;
        response.message = "No framework found";
        return response;
      }

      response.framework = this.deserialise(row);
      response.message = "Framework fetched successfully";
    } catch (error) {
      const message = "Unknown error fetching framework";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetFramework,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async saveFramework(
    params: Schemas.SaveFrameworkDALRequest,
  ): Promise<Schemas.SaveFrameworkApiResponse> {
    const latest = await this.getFrameworkDetails({ createdBy: params.createdBy });
    if (!latest.isSuccess) {
      return { isSuccess: false, message: "Failed to determine next version" };
    }
    const nextVersion = latest.framework ? latest.framework.version + 1 : 1;
    const { input } = params;
    return this.createFramework({
      createdBy: params.createdBy,
      targetRoles: JSON.stringify(input.targetRoles),
      isRemote: input.isRemote,
      requiredSkills: JSON.stringify(input.requiredSkills),
      skills: JSON.stringify(input.skills),
      minSalaryLpa: input.minSalaryLpa,
      minExp: input.minExp,
      maxExp: input.maxExp,
      preferredLocations: JSON.stringify(input.preferredLocations),
      recencyWindow: input.recencyWindow,
      isCustomized: true,
      version: nextVersion,
    });
  }

  async createDefaultIfAbsent(createdBy: string): Promise<void> {
    try {
      const existing = await this.db
        .select({ id: jobSearchFrameworks.id })
        .from(jobSearchFrameworks)
        .where(eq(jobSearchFrameworks.createdBy, createdBy))
        .limit(1);

      if (existing.length > 0) return;

      const d = Constants.JOB_SEARCH_FRAMEWORK_DEFAULTS;
      await this.db.insert(jobSearchFrameworks).values({
        createdBy,
        targetRoles: JSON.stringify(d.targetRoles),
        isRemote: d.isRemote,
        requiredSkills: JSON.stringify(d.requiredSkills),
        skills: JSON.stringify(d.skills),
        minSalaryLpa: d.minSalaryLpa,
        minExp: d.minExp,
        maxExp: d.maxExp,
        preferredLocations: JSON.stringify(d.preferredLocations),
        recencyWindow: d.recencyWindow,
        isCustomized: false,
        version: 1,
        createdAt: Utility.getCurrentISOTimestamp(),
        updatedAt: null,
      });
    } catch (error) {
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SaveFramework,
        message: "Failed to seed default framework",
        error,
        metadata: { createdBy },
      });
    }
  }

  async createFramework(
    params: Schemas.CreateFrameworkDALRequest,
  ): Promise<Schemas.SaveFrameworkApiResponse> {
    const response: Schemas.SaveFrameworkApiResponse = { isSuccess: false };

    try {
      const row = await this.db
        .insert(jobSearchFrameworks)
        .values({
          createdBy: params.createdBy,
          targetRoles: params.targetRoles,
          isRemote: params.isRemote,
          requiredSkills: params.requiredSkills,
          skills: params.skills,
          minSalaryLpa: params.minSalaryLpa,
          minExp: params.minExp,
          maxExp: params.maxExp,
          preferredLocations: params.preferredLocations,
          recencyWindow: params.recencyWindow,
          isCustomized: params.isCustomized,
          version: params.version,
          createdAt: Utility.getCurrentISOTimestamp(),
          updatedAt: null,
        })
        .returning()
        .get();

      response.isSuccess = true;
      response.message = "Framework saved successfully";
      response.framework = this.deserialise(row);
    } catch (error) {
      const message = "Unknown error saving framework";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SaveFramework,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  private deserialise(row: typeof jobSearchFrameworks.$inferSelect): Schemas.Framework {
    return {
      id: row.id,
      createdBy: row.createdBy,
      targetRoles: this.parseJsonArray<string>(row.targetRoles),
      isRemote: Boolean(row.isRemote),
      requiredSkills: this.parseJsonArray<string>(row.requiredSkills),
      skills: this.parseJsonArray<Schemas.PrioritisedSkill>(row.skills),
      minSalaryLpa: row.minSalaryLpa,
      minExp: row.minExp,
      maxExp: row.maxExp,
      preferredLocations: this.parseJsonArray<string>(row.preferredLocations),
      recencyWindow: row.recencyWindow,
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
