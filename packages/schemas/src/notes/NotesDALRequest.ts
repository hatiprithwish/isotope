import type { NullableDALFields } from "../common";
import type { Note, NoteBase } from "./NotesCommon";

export type CreateNoteDALRequest = NoteBase & Pick<Note, "createdBy">;

// Params to find a note by its ID and user ID (for authorization)
export type FindNoteDALRequest = Pick<Note, "id" | "createdBy">;

export type GetNotesDALRequest = Pick<Note, "createdBy">;

export type UpdateNoteDALRequest = FindNoteDALRequest &
  NullableDALFields<Omit<Note, "id" | "createdBy" | "createdAt">>;
