import { z } from "zod";
import type * as Schemas from "@app/schemas";

/**
 * URL search-param schema shared by every filterable table route. Filter lists travel as
 * comma-separated ints (`?statuses=1,2`) so a filtered view stays shareable and survives a
 * refresh or a back-navigation.
 */
export const ZTableFilterSearch = z.object({
  statuses: z.string().optional(),
  fitBands: z.string().optional(),
  savedFilter: z.number().optional(),
});
export type TableFilterSearch = z.infer<typeof ZTableFilterSearch>;

/** Parses a `1,2,3` search param into ints, dropping anything malformed. */
export function parseFilterParam(raw: string | undefined): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isInteger(entry) && entry > 0);
}

/** Serialises a selection back to a search param — empty selections drop out of the URL. */
export function serializeFilterParam(values: number[]): string | undefined {
  return values.length > 0 ? values.join(",") : undefined;
}

/** True when two selections hold the same values, order-insensitively. */
export function isSameSelection(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;
  const sortedRight = [...right].sort((a, b) => a - b);
  return [...left].sort((a, b) => a - b).every((value, index) => value === sortedRight[index]);
}

/**
 * True when the live selection has drifted from the saved filter it was loaded from — drives
 * the "unsaved changes" affordance on the filter bar.
 */
export function isCriteriaDirty(
  criteria: Schemas.SavedFilterCriteria,
  statuses: number[],
  fitBands: number[],
): boolean {
  return (
    !isSameSelection(criteria.statuses ?? [], statuses) ||
    !isSameSelection(criteria.fitBands ?? [], fitBands)
  );
}

export interface FilterOption {
  value: number;
  label: string;
}
