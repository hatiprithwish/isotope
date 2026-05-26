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
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
});
export type Note = z.infer<typeof ZNote>;
