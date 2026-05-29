import type { Framework } from "./FrameworksCommon";
import type { ApiResponse } from "../common";

export interface GenerateFrameworkApiResponse extends ApiResponse {
  frameworkText?: string;
}

export interface SaveFrameworkApiResponse extends ApiResponse {
  framework?: Framework;
}

export interface GetLatestFrameworkApiResponse extends ApiResponse {
  framework?: Framework;
}

export interface GetFrameworkVersionsApiResponse extends ApiResponse {
  frameworks?: Framework[];
}
