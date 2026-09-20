import CompaniesDAL from "@/data-access-layer/CompaniesDAL";
import * as Schemas from "@app/schemas"; // runtime `import *` (not `import type`): findOrCreateByName consumes CompanyStatusIntEnum as a value.

export default class CompaniesRepo {
  private dal: CompaniesDAL;

  constructor(env: Env) {
    this.dal = new CompaniesDAL(env);
  }

  async createCompany(params: Schemas.CreateCompanyApiRequest & { userId: string }) {
    return await this.dal.createCompany({
      createdBy: params.userId,
      ...params.company,
    });
  }

  /**
   * Resolves a company *name* to an id, creating the company if the user doesn't have one by that
   * name yet. Name matching is delegated to the DAL (case-insensitive) — callers that scrape a
   * company name off a page have no id to work with.
   */
  async findOrCreateByName(params: {
    userId: string;
    name: string;
  }): Promise<Schemas.FindOrCreateCompanyResponse> {
    const response: Schemas.FindOrCreateCompanyResponse = { isSuccess: false };

    const existing = await this.dal.findCompanyByName({
      createdBy: params.userId,
      name: params.name,
    });

    if (existing) {
      response.isSuccess = true;
      response.companyId = existing.id;
      response.isNew = false;
      response.message = "Matched existing company";
      return response;
    }

    // Mirrors the add-company modal and InboundJobAlertHandler: a company that hasn't been
    // researched yet enters the pipeline as WaitingHuman.
    const createdResponse = await this.createCompany({
      userId: params.userId,
      company: { name: params.name, status: Schemas.CompanyStatusIntEnum.WaitingHuman },
    });

    if (!createdResponse.isSuccess || !createdResponse.company) {
      response.message = createdResponse.message ?? "Could not create company";
      return response;
    }

    response.isSuccess = true;
    response.companyId = createdResponse.company.id;
    response.isNew = true;
    response.message = "Created company";
    return response;
  }

  async getCompanyDetails(params: { userId: string; id: number }) {
    return await this.dal.getCompanyDetails({ createdBy: params.userId, id: params.id });
  }

  async getCompanies(params: Schemas.GetCompaniesApiRequest & { userId: string }) {
    return await this.dal.getCompanies({
      createdBy: params.userId,
      search: params.search ?? null,
      statuses: params.statuses ?? null,
    });
  }

  async updateCompany(params: Schemas.UpdateCompanyApiRequest & { userId: string; id: number }) {
    return this.dal.updateCompany({
      id: params.id,
      createdBy: params.userId,
      name: params.company.name ?? null,
      website: params.company.website ?? null,
      industry: params.company.industry ?? null,
      size: params.company.size ?? null,
      location: params.company.location ?? null,
      notes: params.company.notes ?? null,
      status: params.company.status ?? null,
    });
  }

  async deleteCompany(params: { userId: string; id: number }) {
    return await this.dal.deleteCompany({
      createdBy: params.userId,
      id: params.id,
    });
  }

  async bulkDeleteCompanies(params: Schemas.BulkDeleteCompaniesApiRequest & { userId: string }) {
    return await this.dal.bulkDeleteCompanies({ ids: params.ids, createdBy: params.userId });
  }
}
