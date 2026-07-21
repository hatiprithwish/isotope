import type { SearchResultItem } from "./SearchCommon";
import type { ApiResponse } from "../common";

export interface SearchApiResponse extends ApiResponse {
  results?: SearchResultItem[];
}
