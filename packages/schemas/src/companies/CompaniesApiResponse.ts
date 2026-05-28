import type { Company } from "./CompaniesCommon";
import type { ApiResponse } from "../common";

export interface CreateCompanyApiResponse extends ApiResponse {
  company?: Company;
}

export interface GetCompanyApiResponse extends ApiResponse {
  company?: Company;
}

export interface GetCompaniesApiResponse extends ApiResponse {
  companies?: Company[];
}

export interface UpdateCompanyApiResponse extends ApiResponse {
  company?: Company;
}
