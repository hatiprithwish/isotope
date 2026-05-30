import type { FrameworkInput } from "./FrameworksCommon";

export type SaveFrameworkDALRequest = {
  createdBy: string;
  input: FrameworkInput;
};

export type CreateFrameworkDALRequest = {
  createdBy: string;
  targetRoles: string;
  isRemote: boolean;
  requiredSkills: string;
  skills: string;
  minSalaryLpa: number;
  minExp: number;
  maxExp: number;
  preferredLocations: string;
  recencyWindow: number;
  isCustomized: boolean;
  version: number;
};

export type GetFrameworkDALRequest = {
  createdBy: string;
};
