import type { SQL } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { notes } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";
import Utility from "@/utils";

export default class NotesDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  async createNote(params: Schemas.CreateNoteDALRequest) {
    const response: Schemas.CreateNoteApiResponse = { isSuccess: false };

    try {
      const noteResponse = await this.db
        .insert(notes)
        .values({
          createdBy: params.createdBy,
          title: params.title,
          body: params.body,
          createdAt: Utility.getCurrentISOTimestamp(),
          updatedAt: null,
        })
        .returning()
        .get();

      response.isSuccess = true;
      response.message = "Note created successfully";
      response.note = noteResponse;
    } catch (error) {
      const message = "Unknown error in creating note";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.CreateNote,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getNoteDetails(params: Schemas.FindNoteDALRequest) {
    const response: Schemas.GetNoteApiResponse = { isSuccess: false };

    try {
      const conditions: SQL[] = [eq(notes.id, params.id), eq(notes.createdBy, params.createdBy)];

      const [note] = await this.db
        .select()
        .from(notes)
        .where(and(...conditions))
        .limit(1);

      if (!note) {
        const message = "Note not found";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.GetNoteDetails,
          message,
          metadata: params,
        });
        response.message = message;
        return response;
      }

      response.isSuccess = true;
      response.message = "Note fetched successfully";
      response.note = note;
    } catch (error) {
      const message = "Unknown error in fetching note";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetNoteDetails,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getNotes(params: Schemas.GetNotesDALRequest) {
    const response: Schemas.GetNotesApiResponse = { isSuccess: false };

    try {
      const notesResponse = await this.db
        .select()
        .from(notes)
        .where(eq(notes.createdBy, params.createdBy));

      response.isSuccess = true;
      response.message = "Notes fetched successfully";
      response.notes = notesResponse;
    } catch (error) {
      const message = "Unknown error in listing notes";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.ListNotes,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async updateNote(params: Schemas.UpdateNoteDALRequest) {
    const response: Schemas.UpdateNoteApiResponse = { isSuccess: false };

    try {
      const noteResponse = await this.db
        .update(notes)
        .set({
          // DEV_NOTE: When params.title === null, it's ignored
          title: params.title ?? undefined,
          // DEV_NOTE: When params.body === null, it's NOT ignored
          body: params.body,
          updatedAt: Utility.getCurrentISOTimestamp(),
        })
        .where(and(eq(notes.id, params.id), eq(notes.createdBy, params.createdBy)))
        .returning()
        .get();

      if (!noteResponse) {
        const message = "Note not found";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.UpdateNote,
          message,
          metadata: params,
        });
        response.message = message;
        return response;
      }

      response.isSuccess = true;
      response.message = "Note updated successfully";
      response.note = noteResponse;
    } catch (error) {
      const message = "Unknown error in updating note";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.UpdateNote,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async deleteNote(params: Schemas.FindNoteDALRequest) {
    const response: Schemas.ApiResponse = { isSuccess: false };

    try {
      await this.db
        .delete(notes)
        .where(and(eq(notes.id, params.id), eq(notes.createdBy, params.createdBy)));

      response.isSuccess = true;
      response.message = "Note deleted successfully";
    } catch (error) {
      const message = "Unknown error in deleting note";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.DeleteNote,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }
}
