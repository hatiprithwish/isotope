import { desc, eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { contactRolePills } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";
import Utility from "@/utils";
import Constants from "@/config/Constants";

export default class ContactRolePillsDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  async getPillsDetails(
    params: Schemas.GetContactRolePillsDALRequest,
  ): Promise<Schemas.GetContactRolePillsApiResponse> {
    const response: Schemas.GetContactRolePillsApiResponse = { isSuccess: false };

    try {
      const [row] = await this.db
        .select()
        .from(contactRolePills)
        .where(eq(contactRolePills.createdBy, params.createdBy))
        .orderBy(desc(contactRolePills.version))
        .limit(1);

      response.isSuccess = true;

      if (!row) {
        response.pills = null;
        response.message = "No contact role pills found";
        return response;
      }

      response.pills = this.deserialise(row);
      response.message = "Contact role pills fetched successfully";
    } catch (error) {
      const message = "Unknown error fetching contact role pills";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetContactRolePills,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  /**
   * Computes the next version and inserts in a single statement (INSERT ... SELECT), so two
   * concurrent saves for the same user can't both read the same "latest" version and insert a
   * colliding row — the version bump and the insert happen atomically, not as separate read-then-write steps.
   */
  async savePills(
    params: Schemas.SaveContactRolePillsDALRequest,
  ): Promise<Schemas.SaveContactRolePillsApiResponse> {
    const response: Schemas.SaveContactRolePillsApiResponse = { isSuccess: false };

    try {
      const result = await this.db.run(sql`
        INSERT INTO contact_role_pills (created_by, pill_labels, version, is_customized, created_at, updated_at)
        SELECT ${params.createdBy}, ${JSON.stringify(params.input.pillLabels)},
               COALESCE(MAX(version), 0) + 1, ${true}, ${Utility.getCurrentISOTimestamp()}, NULL
        FROM contact_role_pills
        WHERE created_by = ${params.createdBy}
        RETURNING *
      `);

      const row = result.results?.[0] as typeof contactRolePills.$inferSelect | undefined;
      if (!row) {
        response.message = "Failed to save contact role pills";
        return response;
      }

      response.isSuccess = true;
      response.message = "Contact role pills saved successfully";
      response.pills = this.deserialise(row);
    } catch (error) {
      const message = "Unknown error saving contact role pills";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SaveContactRolePills,
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
        .select({ id: contactRolePills.id })
        .from(contactRolePills)
        .where(eq(contactRolePills.createdBy, createdBy))
        .limit(1);

      if (existing.length > 0) return;

      const d = Constants.CONTACT_ROLE_PILLS_DEFAULTS;
      await this.db.insert(contactRolePills).values({
        createdBy,
        pillLabels: JSON.stringify(d.pillLabels),
        isCustomized: false,
        version: 1,
        createdAt: Utility.getCurrentISOTimestamp(),
        updatedAt: null,
      });
    } catch (error) {
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SaveContactRolePills,
        message: "Failed to seed default contact role pills",
        error,
        metadata: { createdBy },
      });
    }
  }

  private deserialise(row: typeof contactRolePills.$inferSelect): Schemas.ContactRolePills {
    return {
      id: row.id,
      createdBy: row.createdBy,
      pillLabels: this.parseJsonArray<string>(row.pillLabels),
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
