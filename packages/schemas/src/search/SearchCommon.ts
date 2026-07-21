import { z } from "zod";

export enum SearchEntityType {
  Company = "company",
  Job = "job",
  Contact = "contact",
  Note = "note",
}
export const ZSearchEntityType = z.enum(SearchEntityType);

// DEV_NOTE: Single registration point for adding a new searchable entity.
// title = primary matched/weighted field, body = secondary matched fields.
// Trigger-gen (Phase 5) reads this to emit FTS5 sync triggers per entity.
export const SEARCH_PROJECTIONS: Record<
  SearchEntityType,
  { table: string; title: string; body: string[] }
> = {
  [SearchEntityType.Company]: {
    table: "companies",
    title: "name",
    body: ["industry", "location", "notes"],
  },
  [SearchEntityType.Job]: {
    table: "jobs",
    title: "title",
    body: ["description", "skills"],
  },
  [SearchEntityType.Contact]: {
    table: "contacts",
    title: "name",
    body: ["designation", "email", "notes"],
  },
  [SearchEntityType.Note]: {
    table: "notes",
    title: "title",
    body: ["body"],
  },
};

export const ZSearchResultItem = z.object({
  entityType: ZSearchEntityType,
  entityId: z.number(),
  title: z.string(),
  snippet: z.string().nullable().optional(),
  score: z.number(),
});
export type SearchResultItem = z.infer<typeof ZSearchResultItem>;
