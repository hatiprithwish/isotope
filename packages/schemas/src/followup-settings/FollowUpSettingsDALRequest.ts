import type { FollowUpSettingsInput } from "./FollowUpSettingsCommon";

export type SaveFollowUpSettingsDALRequest = {
  createdBy: string;
  input: FollowUpSettingsInput;
};

export type CreateFollowUpSettingsDALRequest = {
  createdBy: string;
  stepOffsetDays: string;
  isCustomized: boolean;
  version: number;
};

export type GetFollowUpSettingsDALRequest = {
  createdBy: string;
};
