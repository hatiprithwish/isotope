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
