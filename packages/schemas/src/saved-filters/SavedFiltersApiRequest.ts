import { z } from "zod";
import {
  ZSavedFilterBase,
  ZSavedFilterCriteria,
  ZSavedFilterEntityTypeIntEnum,
  SAVED_FILTER_NAME_MAX_LENGTH,
} from "./SavedFiltersCommon";

export const ZGetSavedFiltersApiRequest = z.object({
  entityType: z.coerce.number().pipe(ZSavedFilterEntityTypeIntEnum),
});
export type GetSavedFiltersApiRequest = z.infer<typeof ZGetSavedFiltersApiRequest>;

export const ZCreateSavedFilterApiRequest = z.object({
  savedFilter: ZSavedFilterBase,
});
export type CreateSavedFilterApiRequest = z.infer<typeof ZCreateSavedFilterApiRequest>;

export const ZUpdateSavedFilterApiRequest = z.object({
  savedFilter: z
    .object({
      name: z.string().trim().min(1).max(SAVED_FILTER_NAME_MAX_LENGTH).optional(),
      criteria: ZSavedFilterCriteria.optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "At least one field must be provided",
    }),
});
export type UpdateSavedFilterApiRequest = z.infer<typeof ZUpdateSavedFilterApiRequest>;

export const ZDeleteSavedFilterApiRequest = z.object({
  id: z.number().int().positive(),
});
export type DeleteSavedFilterApiRequest = z.infer<typeof ZDeleteSavedFilterApiRequest>;
