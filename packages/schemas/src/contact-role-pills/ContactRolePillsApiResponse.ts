import type { ContactRolePills } from "./ContactRolePillsCommon";
import type { ApiResponse } from "../common";

export interface GetContactRolePillsApiResponse extends ApiResponse {
  pills?: ContactRolePills | null;
}

export interface SaveContactRolePillsApiResponse extends ApiResponse {
  pills?: ContactRolePills;
}
