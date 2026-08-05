import { and, asc, eq, ne } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { savedFilters } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";
import Utility from "@/utils";

export default class SavedFiltersDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  async createSavedFilter(params: Schemas.CreateSavedFilterDALRequest) {
    const response: Schemas.CreateSavedFilterDALResponse = { isSuccess: false };

    try {
      // Deterministic duplicate check ahead of the insert — does not depend on the driver's
      // error message format, unlike catching the UNIQUE constraint violation after the fact.
      const [existing] = await this.db
        .select({ id: savedFilters.id })
        .from(savedFilters)
        .where(
          and(
            eq(savedFilters.createdBy, params.createdBy),
            eq(savedFilters.entityType, params.entityType),
            eq(savedFilters.name, params.name),
          ),
        )
        .limit(1);

      if (existing) {
        const message = "A saved filter with this name already exists";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.CreateSavedFilter,
          message,
          metadata: params,
        });
        response.message = message;
        response.isDuplicateName = true;
        return response;
      }

      const savedFilterResponse = await this.db
        .insert(savedFilters)
        .values({
          createdBy: params.createdBy,
          name: params.name,
          entityType: params.entityType,
          criteria: JSON.stringify(params.criteria),
          createdAt: Utility.getCurrentISOTimestamp(),
          updatedAt: null,
        })
        .returning()
        .get();

      response.isSuccess = true;
      response.message = "Saved filter created successfully";
      response.savedFilter = SavedFiltersDAL.toSavedFilter(savedFilterResponse);
    } catch (error) {
      // The pre-check above closes the common case; this only fires on the narrow race where
      // two requests pass the pre-check concurrently and one loses the unique-index insert.
      if (SavedFiltersDAL.isLikelyDuplicateNameError(error)) {
        const message = "A saved filter with this name already exists";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.CreateSavedFilter,
          message,
          error,
          metadata: params,
        });
        response.message = message;
        response.isDuplicateName = true;
        return response;
      }

      const message = "Unknown error in creating saved filter";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.CreateSavedFilter,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getSavedFilters(params: Schemas.GetSavedFiltersDALRequest) {
    const response: Schemas.GetSavedFiltersDALResponse = { isSuccess: false };

    try {
      const rows = await this.db
        .select()
        .from(savedFilters)
        .where(
          and(
            eq(savedFilters.createdBy, params.createdBy),
            eq(savedFilters.entityType, params.entityType),
          ),
        )
        .orderBy(asc(savedFilters.name));

      response.isSuccess = true;
      response.message = "Saved filters fetched successfully";
      response.savedFilters = rows.map((row) => SavedFiltersDAL.toSavedFilter(row));
    } catch (error) {
      const message = "Unknown error in listing saved filters";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.ListSavedFilters,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async updateSavedFilter(params: Schemas.UpdateSavedFilterDALRequest) {
    const response: Schemas.UpdateSavedFilterDALResponse = { isSuccess: false };

    try {
      if (params.name) {
        // Deterministic duplicate check ahead of the update — mirrors createSavedFilter's
        // pre-check. The unique index is scoped by entityType, so look that up for the row
        // being renamed first, then check for a same-name conflict within that scope,
        // excluding the row itself so a no-op rename isn't flagged against itself.
        const [current] = await this.db
          .select({ entityType: savedFilters.entityType })
          .from(savedFilters)
          .where(and(eq(savedFilters.id, params.id), eq(savedFilters.createdBy, params.createdBy)))
          .limit(1);

        if (current) {
          const [conflict] = await this.db
            .select({ id: savedFilters.id })
            .from(savedFilters)
            .where(
              and(
                eq(savedFilters.createdBy, params.createdBy),
                eq(savedFilters.entityType, current.entityType),
                eq(savedFilters.name, params.name),
                ne(savedFilters.id, params.id),
              ),
            )
            .limit(1);

          if (conflict) {
            const message = "A saved filter with this name already exists";
            AppLogger.error({
              category: Schemas.LogCategory.DAL,
              action: Schemas.LogAction.UpdateSavedFilter,
              message,
              metadata: params,
            });
            response.message = message;
            response.isDuplicateName = true;
            return response;
          }
        }
      }

      const savedFilterResponse = await this.db
        .update(savedFilters)
        .set({
          // DEV_NOTE: undefined fields are ignored by drizzle — only provided fields change
          name: params.name,
          criteria: params.criteria ? JSON.stringify(params.criteria) : undefined,
          updatedAt: Utility.getCurrentISOTimestamp(),
        })
        .where(and(eq(savedFilters.id, params.id), eq(savedFilters.createdBy, params.createdBy)))
        .returning()
        .get();

      if (!savedFilterResponse) {
        const message = "Saved filter not found";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.UpdateSavedFilter,
          message,
          metadata: params,
        });
        response.message = message;
        return response;
      }

      response.isSuccess = true;
      response.message = "Saved filter updated successfully";
      response.savedFilter = SavedFiltersDAL.toSavedFilter(savedFilterResponse);
    } catch (error) {
      // The pre-check above closes the common case; this only fires on the narrow race where
      // two requests pass the pre-check concurrently and one loses the unique-index update.
      if (SavedFiltersDAL.isLikelyDuplicateNameError(error)) {
        const message = "A saved filter with this name already exists";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.UpdateSavedFilter,
          message,
          error,
          metadata: params,
        });
        response.message = message;
        response.isDuplicateName = true;
        return response;
      }

      const message = "Unknown error in updating saved filter";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.UpdateSavedFilter,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async deleteSavedFilter(params: Schemas.DeleteSavedFilterDALRequest) {
    const response: Schemas.ApiResponse = { isSuccess: false };

    try {
      await this.db
        .delete(savedFilters)
        .where(and(eq(savedFilters.id, params.id), eq(savedFilters.createdBy, params.createdBy)));

      response.isSuccess = true;
      response.message = "Saved filter deleted successfully";
    } catch (error) {
      const message = "Unknown error in deleting saved filter";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.DeleteSavedFilter,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  /**
   * Best-effort backstop for the race window between the pre-check above and the write:
   * substring-matches D1/SQLite's error message for `UNQ_saved_filters_name`. Not the primary
   * detection path — `createSavedFilter`/`updateSavedFilter` check for a conflict before
   * writing, which is deterministic and doesn't depend on driver error-message format. If this
   * match ever goes stale (a D1 error-wrapping change), the only user-visible regression is
   * this narrow race reporting "Unknown error" instead of "already exists" — the common case
   * stays correct because the pre-check already caught it.
   */
  private static isLikelyDuplicateNameError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes("UNIQUE constraint failed") && message.includes("saved_filters.name");
  }

  /**
   * Maps a raw row to the domain shape, parsing the serialised `criteria` column. A row whose
   * JSON is unreadable degrades to empty criteria rather than failing the whole list request.
   */
  private static toSavedFilter(row: typeof savedFilters.$inferSelect): Schemas.SavedFilter {
    return {
      id: row.id,
      createdBy: row.createdBy,
      name: row.name,
      entityType: row.entityType,
      criteria: SavedFiltersDAL.parseCriteria(row.criteria, row.id),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private static parseCriteria(raw: string, savedFilterId: number): Schemas.SavedFilterCriteria {
    try {
      const parsed = Schemas.ZSavedFilterCriteria.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;

      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.ListSavedFilters,
        message: "Saved filter criteria failed validation",
        metadata: { savedFilterId, raw },
      });
      return {};
    } catch (error) {
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.ListSavedFilters,
        message: "Saved filter criteria is not valid JSON",
        error,
        metadata: { savedFilterId, raw },
      });
      return {};
    }
  }
}
