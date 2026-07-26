import type { RoleTypes } from "./RoleTypesCommon";
import type { ApiResponse } from "../common";

export interface GetRoleTypesApiResponse extends ApiResponse {
  roleTypes?: RoleTypes | null;
}

export interface SaveRoleTypesApiResponse extends ApiResponse {
  roleTypes?: RoleTypes;
}
