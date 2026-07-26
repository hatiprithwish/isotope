import type { ContactRolePillsInput } from "./ContactRolePillsCommon";

export type SaveContactRolePillsDALRequest = {
  createdBy: string;
  input: ContactRolePillsInput;
};

export type GetContactRolePillsDALRequest = {
  createdBy: string;
};
