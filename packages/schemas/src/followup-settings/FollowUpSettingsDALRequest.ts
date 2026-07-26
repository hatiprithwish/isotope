import type { FollowUpSettingsInput } from "./FollowUpSettingsCommon";

export type SaveFollowUpSettingsDALRequest = {
  createdBy: string;
  input: FollowUpSettingsInput;
};

export type GetFollowUpSettingsDALRequest = {
  createdBy: string;
};
