import type { FollowUpSettings } from "./FollowUpSettingsCommon";
import type { ApiResponse } from "../common";

export interface GetFollowUpSettingsApiResponse extends ApiResponse {
  settings?: FollowUpSettings | null;
}

export interface SaveFollowUpSettingsApiResponse extends ApiResponse {
  settings?: FollowUpSettings;
}
