import { z } from "zod";
import {
  BULK_STATUS_CHANGE_NOTES_MAX_ENTRIES,
  ZStatusChangeEntityTypeEnum,
  ZStatusChangeNoteBase,
} from "./StatusChangeNotesCommon";

export const ZCreateStatusChangeNoteApiRequest = z.object({
  statusChangeNote: ZStatusChangeNoteBase,
});
export type CreateStatusChangeNoteApiRequest = z.infer<typeof ZCreateStatusChangeNoteApiRequest>;

export const ZGetStatusChangeNotesApiRequest = z.object({
  entityType: ZStatusChangeEntityTypeEnum,
  entityId: z.coerce.number(),
});
export type GetStatusChangeNotesApiRequest = z.infer<typeof ZGetStatusChangeNotesApiRequest>;

// One note applied to every entity in the batch — bulk status-change flows (Contacts/Jobs).
export const ZBulkCreateStatusChangeNotesApiRequest = z.object({
  entityType: ZStatusChangeEntityTypeEnum,
  entityIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(
      BULK_STATUS_CHANGE_NOTES_MAX_ENTRIES,
      `At most ${BULK_STATUS_CHANGE_NOTES_MAX_ENTRIES} entities can be updated at once`,
    ),
  toStatus: z.number(),
  note: z.string().nullable().optional(),
});
export type BulkCreateStatusChangeNotesApiRequest = z.infer<
  typeof ZBulkCreateStatusChangeNotesApiRequest
>;
