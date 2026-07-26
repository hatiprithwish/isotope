import { eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { roleTypes } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";
import Utility from "@/utils";
import Constants from "@/config/Constants";

export default class RoleTypesDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  async getRoleTypesDetails(
    params: Schemas.GetRoleTypesDALRequest,
  ): Promise<Schemas.GetRoleTypesApiResponse> {
    const response: Schemas.GetRoleTypesApiResponse = { isSuccess: false };

    try {
      const [row] = await this.db
        .select()
        .from(roleTypes)
        .where(eq(roleTypes.createdBy, params.createdBy))
        .limit(1);

      response.isSuccess = true;

      if (!row) {
        response.roleTypes = null;
        response.message = "No role types found";
        return response;
      }

      response.roleTypes = this.deserialise(row);
      response.message = "Role types fetched successfully";
    } catch (error) {
      const message = "Unknown error fetching role types";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetRoleTypes,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  /**
   * Single row per user (no versioning) — upserts via ON CONFLICT so concurrent saves
   * for the same user race safely at the SQLite level rather than as separate read-then-write steps.
   */
  async saveRoleTypes(
    params: Schemas.SaveRoleTypesDALRequest,
  ): Promise<Schemas.SaveRoleTypesApiResponse> {
    const response: Schemas.SaveRoleTypesApiResponse = { isSuccess: false };

    try {
      const now = Utility.getCurrentISOTimestamp();
      const result = await this.db.run(sql`
        INSERT INTO role_types (created_by, labels, default_label, is_customized, created_at, updated_at)
        VALUES (${params.createdBy}, ${JSON.stringify(params.input.labels)}, ${params.input.defaultLabel}, ${true}, ${now}, NULL)
        ON CONFLICT (created_by) DO UPDATE SET
          labels = excluded.labels,
          default_label = excluded.default_label,
          is_customized = excluded.is_customized,
          updated_at = ${now}
        RETURNING *
      `);

      const row = result.results?.[0] as typeof roleTypes.$inferSelect | undefined;
      if (!row) {
        response.message = "Failed to save role types";
        return response;
      }

      response.isSuccess = true;
      response.message = "Role types saved successfully";
      response.roleTypes = this.deserialise(row);
    } catch (error) {
      const message = "Unknown error saving role types";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SaveRoleTypes,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async createDefaultIfAbsent(createdBy: string): Promise<void> {
    try {
      const existing = await this.db
        .select({ id: roleTypes.id })
        .from(roleTypes)
        .where(eq(roleTypes.createdBy, createdBy))
        .limit(1);

      if (existing.length > 0) return;

      const d = Constants.ROLE_TYPES_DEFAULTS;
      await this.db.insert(roleTypes).values({
        createdBy,
        labels: JSON.stringify(d.labels),
        defaultLabel: d.defaultLabel,
        isCustomized: false,
        createdAt: Utility.getCurrentISOTimestamp(),
        updatedAt: null,
      });
    } catch (error) {
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SaveRoleTypes,
        message: "Failed to seed default role types",
        error,
        metadata: { createdBy },
      });
    }
  }

  private deserialise(row: typeof roleTypes.$inferSelect): Schemas.RoleTypes {
    return {
      id: row.id,
      createdBy: row.createdBy,
      labels: this.parseJsonArray<string>(row.labels),
      defaultLabel: row.defaultLabel,
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
