import type { SavedFilter, SavedFilterWithLabel } from "./SavedFiltersCommon";
import type { ApiResponse } from "../common";

// DAL-level shapes — raw rows, before the Repo attaches entity-type labels
export interface GetSavedFiltersDALResponse extends ApiResponse {
  savedFilters?: SavedFilter[];
}

export interface CreateSavedFilterDALResponse extends ApiResponse {
  savedFilter?: SavedFilter;
  /** True when the insert failed because `(createdBy, entityType, name)` already exists. */
  isDuplicateName?: boolean;
}

export interface UpdateSavedFilterDALResponse extends ApiResponse {
  savedFilter?: SavedFilter;
  /** True when the update failed because `(createdBy, entityType, name)` already exists. */
  isDuplicateName?: boolean;
}

// API-level shapes — what routes return, labels included
export interface GetSavedFiltersApiResponse extends ApiResponse {
  savedFilters?: SavedFilterWithLabel[];
}

export interface CreateSavedFilterApiResponse extends ApiResponse {
  savedFilter?: SavedFilterWithLabel;
  isDuplicateName?: boolean;
}

export interface UpdateSavedFilterApiResponse extends ApiResponse {
  savedFilter?: SavedFilterWithLabel;
  isDuplicateName?: boolean;
}
