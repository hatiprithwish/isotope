import z from "zod";

export enum StatusChangeEntityTypeEnum {
  Company = "Company",
  Contact = "Contact",
  Job = "Job",
}
export const ZStatusChangeEntityTypeEnum = z.enum(StatusChangeEntityTypeEnum);

export const ZStatusChangeNoteBase = z.object({
  entityType: ZStatusChangeEntityTypeEnum,
  entityId: z.number(),
  fromStatus: z.number().nullable().optional(),
  toStatus: z.number(),
  note: z.string().nullable().optional(),
});
export type StatusChangeNoteBase = z.infer<typeof ZStatusChangeNoteBase>;

export const ZStatusChangeNote = ZStatusChangeNoteBase.extend({
  id: z.number(),
  createdBy: z.string(),
  createdAt: z.string(),
});
export type StatusChangeNote = z.infer<typeof ZStatusChangeNote>;

// Each row binds 7 columns — keeps a full batch well under D1/SQLite's bound-parameter ceiling.
export const BULK_STATUS_CHANGE_NOTES_MAX_ENTRIES = 50;
