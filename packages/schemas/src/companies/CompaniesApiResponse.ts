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

export interface BulkDeleteCompaniesApiResponse extends ApiResponse {
  deletedCount?: number;
}

/** Repo-to-repo shape (not exposed on a route) — callers that hold a company *name* and need an id. */
export interface FindOrCreateCompanyResponse extends ApiResponse {
  companyId?: number;
  /** False when an existing company matched the name, true when one was created. */
  isNew?: boolean;
}
