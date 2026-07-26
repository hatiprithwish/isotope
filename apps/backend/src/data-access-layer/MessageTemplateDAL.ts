import { and, asc, eq, isNull } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { messageTemplates } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";
import Utility from "@/utils";

export default class MessageTemplateDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  async getTemplates(
    params: Schemas.GetMessageTemplatesDALRequest,
  ): Promise<Schemas.GetMessageTemplatesApiResponse> {
    const response: Schemas.GetMessageTemplatesApiResponse = { isSuccess: false };

    try {
      const rows = await this.db
        .select()
        .from(messageTemplates)
        .where(eq(messageTemplates.createdBy, params.createdBy))
        .orderBy(asc(messageTemplates.step));

      response.isSuccess = true;
      response.message = "Message templates fetched successfully";
      response.templates = rows.map((row) => this.deserialise(row));
    } catch (error) {
      const message = "Unknown error fetching message templates";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetMessageTemplates,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async findTemplate(
    params: Schemas.FindMessageTemplateDALRequest,
  ): Promise<Schemas.MessageTemplate | null> {
    const variantFilter =
      params.variantLabel === null
        ? isNull(messageTemplates.variantLabel)
        : eq(messageTemplates.variantLabel, params.variantLabel);

    const [row] = await this.db
      .select()
      .from(messageTemplates)
      .where(
        and(
          eq(messageTemplates.createdBy, params.createdBy),
          eq(messageTemplates.step, params.step),
          variantFilter,
        ),
      )
      .limit(1);

    return row ? this.deserialise(row) : null;
  }

  /**
   * (created_by, step, variant_label) has no reliable DB-level uniqueness when variant_label
   * is NULL — SQLite treats NULLs as distinct in a UNIQUE index, so ON CONFLICT can't target
   * it. Explicit find-then-write instead; callers are single-user form saves, not high-concurrency writers.
   */
  async saveTemplate(
    params: Schemas.SaveMessageTemplateDALRequest,
  ): Promise<Schemas.SaveMessageTemplateApiResponse> {
    const response: Schemas.SaveMessageTemplateApiResponse = { isSuccess: false };

    try {
      const existing = await this.findTemplate({
        createdBy: params.createdBy,
        step: params.step,
        variantLabel: params.variantLabel,
      });

      const now = Utility.getCurrentISOTimestamp();

      if (existing) {
        const row = await this.db
          .update(messageTemplates)
          .set({ body: params.body, updatedAt: now })
          .where(eq(messageTemplates.id, existing.id))
          .returning()
          .get();

        response.isSuccess = true;
        response.message = "Message template updated successfully";
        response.template = this.deserialise(row);
        return response;
      }

      const row = await this.db
        .insert(messageTemplates)
        .values({
          createdBy: params.createdBy,
          step: params.step,
          variantLabel: params.variantLabel,
          body: params.body,
          createdAt: now,
          updatedAt: null,
        })
        .returning()
        .get();

      response.isSuccess = true;
      response.message = "Message template created successfully";
      response.template = this.deserialise(row);
    } catch (error) {
      const message = "Unknown error saving message template";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SaveMessageTemplate,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  private deserialise(row: typeof messageTemplates.$inferSelect): Schemas.MessageTemplate {
    return {
      id: row.id,
      createdBy: row.createdBy,
      step: row.step,
      variantLabel: row.variantLabel,
      body: row.body,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? null,
    };
  }
}
