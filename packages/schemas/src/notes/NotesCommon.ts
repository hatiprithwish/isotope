import z from "zod";

// Create Note Body
export const ZNoteBase = z.object({
  title: z.string(),
  body: z.string().nullable().optional(),
});
export type NoteBase = z.infer<typeof ZNoteBase>;

// Whole Note Body
export const ZNote = ZNoteBase.extend({
  id: z.number(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
export type Note = z.infer<typeof ZNote>;
