import type { RoleTypesInput } from "./RoleTypesCommon";

export type SaveRoleTypesDALRequest = {
  createdBy: string;
  input: RoleTypesInput;
};

export type GetRoleTypesDALRequest = {
  createdBy: string;
};
