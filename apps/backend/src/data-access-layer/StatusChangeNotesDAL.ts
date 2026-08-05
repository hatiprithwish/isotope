import { and, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { statusChangeNotes } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";
import Utility from "@/utils";

export default class StatusChangeNotesDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  async createStatusChangeNote(params: Schemas.CreateStatusChangeNoteDALRequest) {
    const response: Schemas.CreateStatusChangeNoteApiResponse = { isSuccess: false };

    try {
      const noteResponse = await this.db
        .insert(statusChangeNotes)
        .values({
          createdBy: params.createdBy,
          entityType: params.entityType,
          entityId: params.entityId,
          fromStatus: params.fromStatus ?? null,
          toStatus: params.toStatus,
          note: params.note ?? null,
          createdAt: Utility.getCurrentISOTimestamp(),
        })
        .returning()
        .get();

      response.isSuccess = true;
      response.message = "Status change note created successfully";
      response.statusChangeNote = noteResponse;
    } catch (error) {
      const message = "Unknown error in creating status change note";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.CreateStatusChangeNote,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async bulkCreateStatusChangeNotes(params: Schemas.BulkCreateStatusChangeNotesDALRequest) {
    const response: Schemas.BulkCreateStatusChangeNotesApiResponse = { isSuccess: false };

    try {
      const createdAt = Utility.getCurrentISOTimestamp();
      const rows = await this.db
        .insert(statusChangeNotes)
        .values(
          params.entityIds.map((entityId) => ({
            createdBy: params.createdBy,
            entityType: params.entityType,
            entityId,
            fromStatus: null,
            toStatus: params.toStatus,
            note: params.note ?? null,
            createdAt,
          })),
        )
        .returning();

      response.isSuccess = true;
      response.message = "Status change notes created successfully";
      response.statusChangeNotes = rows;
    } catch (error) {
      const message = "Unknown error in bulk creating status change notes";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.BulkCreateStatusChangeNotes,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getStatusChangeNotes(params: Schemas.GetStatusChangeNotesDALRequest) {
    const response: Schemas.GetStatusChangeNotesApiResponse = { isSuccess: false };

    try {
      const notesResponse = await this.db
        .select()
        .from(statusChangeNotes)
        .where(
          and(
            eq(statusChangeNotes.createdBy, params.createdBy),
            eq(statusChangeNotes.entityType, params.entityType),
            eq(statusChangeNotes.entityId, params.entityId),
          ),
        )
        // createdAt alone can tie — bulkCreateStatusChangeNotes stamps every row in a batch with
        // the same timestamp, and even single inserts can land in the same second. id is
        // monotonic and always breaks ties in true insertion order.
        .orderBy(statusChangeNotes.createdAt, statusChangeNotes.id);

      response.isSuccess = true;
      response.message = "Status change notes fetched successfully";
      response.statusChangeNotes = notesResponse;
    } catch (error) {
      const message = "Unknown error in listing status change notes";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetStatusChangeNotes,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }
}
