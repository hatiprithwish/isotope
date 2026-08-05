import type { SavedFilter, SavedFilterCriteria } from "./SavedFiltersCommon";

export type CreateSavedFilterDALRequest = Pick<SavedFilter, "createdBy" | "name" | "entityType"> & {
  criteria: SavedFilterCriteria;
};

export type FindSavedFilterDALRequest = Pick<SavedFilter, "id" | "createdBy">;

export type GetSavedFiltersDALRequest = Pick<SavedFilter, "createdBy" | "entityType">;

export type UpdateSavedFilterDALRequest = FindSavedFilterDALRequest & {
  name?: string;
  criteria?: SavedFilterCriteria;
};

export type DeleteSavedFilterDALRequest = FindSavedFilterDALRequest;
