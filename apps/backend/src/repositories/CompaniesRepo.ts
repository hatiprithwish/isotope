import CompaniesDAL from "@/data-access-layer/CompaniesDAL";
import type * as Schemas from "@app/schemas"; // `import type` required: repos only consume TS interfaces (erased at compile time). Routes use `import *` because Zod Z* schemas are runtime values. This is needed for eslint rules.

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

  async getCompanyDetails(params: { userId: string; id: number }) {
    return await this.dal.getCompanyDetails({ createdBy: params.userId, id: params.id });
  }

  async getCompanies(params: { userId: string }) {
    return await this.dal.getCompanies({ createdBy: params.userId });
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
      isSalaryMatch: params.company.isSalaryMatch ?? null,
      isLocationMatch: params.company.isLocationMatch ?? null,
      isEthicsCompliant: params.company.isEthicsCompliant ?? null,
      ethicsNotes: params.company.ethicsNotes ?? null,
      weightedScore: params.company.weightedScore ?? null,
      fitBand: params.company.fitBand ?? null,
      aiSummary: params.company.aiSummary ?? null,
      userContext: params.company.userContext ?? null,
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
}
