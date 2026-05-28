import type { NullableDALFields } from "../common";
import type { Company, CompanyBase } from "./CompaniesCommon";

export type CreateCompanyDALRequest = CompanyBase & Pick<Company, "createdBy">;

export type FindCompanyDALRequest = Pick<Company, "id" | "createdBy">;

export type GetCompaniesDALRequest = Pick<Company, "createdBy">;

export type UpdateCompanyDALRequest = FindCompanyDALRequest &
  NullableDALFields<Omit<Company, "id" | "createdBy" | "createdAt" | "statusLabel">>;
