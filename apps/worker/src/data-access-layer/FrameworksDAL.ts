import { and, desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { frameworks } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/logger";
import Utility from "@/utils";

export default class FrameworksDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  async getLatestFramework(params: Schemas.GetLatestFrameworkDALRequest) {
    const response: Schemas.GetLatestFrameworkApiResponse = { isSuccess: false };

    try {
      const [framework] = await this.db
        .select()
        .from(frameworks)
        .where(and(eq(frameworks.createdBy, params.createdBy), eq(frameworks.type, params.type)))
        .orderBy(desc(frameworks.version))
        .limit(1);

      if (!framework) {
        response.isSuccess = true;
        response.message = "No framework found";
        return response;
      }

      response.isSuccess = true;
      response.message = "Framework fetched successfully";
      response.framework = framework;
    } catch (error) {
      const message = "Unknown error fetching latest framework";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetLatestFramework,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getFrameworkVersions(params: Schemas.GetFrameworkVersionsDALRequest) {
    const response: Schemas.GetFrameworkVersionsApiResponse = { isSuccess: false };

    try {
      const rows = await this.db
        .select()
        .from(frameworks)
        .where(and(eq(frameworks.createdBy, params.createdBy), eq(frameworks.type, params.type)))
        .orderBy(desc(frameworks.version))
        .limit(params.limit ?? 5);

      response.isSuccess = true;
      response.message = "Framework versions fetched successfully";
      response.frameworks = rows;
    } catch (error) {
      const message = "Unknown error fetching framework versions";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetFrameworkVersions,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async createFramework(params: Schemas.CreateFrameworkDALRequest) {
    const response: Schemas.SaveFrameworkApiResponse = { isSuccess: false };

    try {
      const framework = await this.db
        .insert(frameworks)
        .values({
          createdBy: params.createdBy,
          type: params.type,
          content: params.content,
          formInputs: params.formInputs ?? null,
          version: params.version,
          isCustomized: params.isCustomized ?? false,
          createdAt: Utility.getCurrentISOTimestamp(),
          updatedAt: null,
        })
        .returning()
        .get();

      response.isSuccess = true;
      response.message = "Framework saved successfully";
      response.framework = framework;
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
}
