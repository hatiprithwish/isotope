import { z } from "zod";

// DEV_NOTE: No `types` filter yet — query-string arrays have no precedent in this
// repo (existing z.array() usages are all body-validated bulk-op requests). Add
// when the frontend needs per-entity filtering, using a CSV or repeated-key convention.
export const ZSearchApiRequest = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(50).optional(),
});
export type SearchApiRequest = z.infer<typeof ZSearchApiRequest>;
