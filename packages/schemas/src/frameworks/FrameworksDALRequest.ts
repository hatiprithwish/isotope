import type { Framework } from "./FrameworksCommon";

export type CreateFrameworkDALRequest = Pick<Framework, "createdBy" | "type" | "content"> & {
  formInputs?: string | null;
  isCustomized?: boolean;
  version: number;
};

export type GetLatestFrameworkDALRequest = {
  createdBy: string;
  type: number;
};

export type GetFrameworkVersionsDALRequest = {
  createdBy: string;
  type: number;
  limit?: number;
};
