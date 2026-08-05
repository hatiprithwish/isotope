import { z } from "zod";

export interface ApiResponse {
  isSuccess: boolean;
  message?: string;
}

export type NullableDALFields<T> = {
  [K in keyof T]: T[K] | null;
};

export enum SortDirection {
  Asc = "asc",
  Desc = "desc",
}
export const ZSortDirection = z.enum(SortDirection);

/**
 * Accepts a filter list of positive integers from either a JSON body (already an array)
 * or a query string (`?statuses=1,2` or a repeated `?statuses=1&statuses=2`), and normalises
 * all three shapes to `number[]`. An empty list is normalised to `undefined` so callers can
 * treat "no filter" and "filter matching nothing" as the same no-op.
 */
export const ZIntFilterList = z
  .union([z.string(), z.array(z.union([z.string(), z.number()]))])
  .transform((value) => {
    const raw = Array.isArray(value) ? value : value.split(",");
    return raw
      .map((entry) => (typeof entry === "number" ? entry : Number(entry.trim())))
      .filter((entry) => Number.isInteger(entry) && entry > 0);
  })
  .refine((entries) => entries.every((entry) => Number.isInteger(entry) && entry > 0), {
    message: "Filter values must be positive integers",
  })
  .transform((entries) => (entries.length > 0 ? entries : undefined));
