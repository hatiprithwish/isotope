import z from "zod";

// Integer enums — stored in DB, sent in API requests
export enum SavedFilterEntityTypeIntEnum {
  Job = 1,
  Company = 2,
  Contact = 3,
}
export const ZSavedFilterEntityTypeIntEnum = z.enum(SavedFilterEntityTypeIntEnum);

// Label enums — human-readable, included in API responses
export enum SavedFilterEntityTypeLabelEnum {
  Job = "Job",
  Company = "Company",
  Contact = "Contact",
}
export const ZSavedFilterEntityTypeLabelEnum = z.enum(SavedFilterEntityTypeLabelEnum);

// Maps — int → label (used in Repo layer)
export const SAVED_FILTER_ENTITY_TYPE_LABEL_MAP: Record<
  SavedFilterEntityTypeIntEnum,
  SavedFilterEntityTypeLabelEnum
> = {
  [SavedFilterEntityTypeIntEnum.Job]: SavedFilterEntityTypeLabelEnum.Job,
  [SavedFilterEntityTypeIntEnum.Company]: SavedFilterEntityTypeLabelEnum.Company,
  [SavedFilterEntityTypeIntEnum.Contact]: SavedFilterEntityTypeLabelEnum.Contact,
};

export const SAVED_FILTER_NAME_MAX_LENGTH = 60;

/**
 * The filterable criteria a saved filter can capture. Persisted as a JSON string in the
 * `criteria` column so new filter dimensions can be added without a migration. `fitBands`
 * only applies to Companies; other entity types simply omit it.
 */
export const ZSavedFilterCriteria = z.object({
  statuses: z.array(z.number().int().positive()).optional(),
  fitBands: z.array(z.number().int().positive()).optional(),
});
export type SavedFilterCriteria = z.infer<typeof ZSavedFilterCriteria>;

export const ZSavedFilterBase = z.object({
  name: z.string().trim().min(1).max(SAVED_FILTER_NAME_MAX_LENGTH),
  entityType: ZSavedFilterEntityTypeIntEnum,
  criteria: ZSavedFilterCriteria,
});
export type SavedFilterBase = z.infer<typeof ZSavedFilterBase>;

// DB shape — `criteria` is stored serialised, so the DB row carries the raw JSON string
export const ZSavedFilter = ZSavedFilterBase.extend({
  id: z.number(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type SavedFilter = z.infer<typeof ZSavedFilter>;

// API response shape — both int and label
export interface SavedFilterWithLabel extends SavedFilter {
  savedFilterEntityType: SavedFilterEntityTypeIntEnum;
  savedFilterEntityTypeLabel: SavedFilterEntityTypeLabelEnum;
}
