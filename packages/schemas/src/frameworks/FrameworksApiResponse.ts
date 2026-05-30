import type { Framework } from "./FrameworksCommon";
import type { ApiResponse } from "../common";

export interface GetFrameworkDetailsApiResponse extends ApiResponse {
  framework?: Framework | null;
}

export interface SaveFrameworkApiResponse extends ApiResponse {
  framework?: Framework;
}
