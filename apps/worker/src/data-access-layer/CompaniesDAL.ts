import type { SQL } from "drizzle-orm";
import { and, eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { companies, users } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/logger";
import Utility from "@/utils";

export default class CompaniesDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  async createCompany(params: Schemas.CreateCompanyDALRequest) {
    const response: Schemas.CreateCompanyApiResponse = { isSuccess: false };

    try {
      const createdCompany = await this.db
        .insert(companies)
        .values({
          createdBy: params.createdBy,
          name: params.name,
          website: params.website,
          industry: params.industry,
          size: params.size,
          location: params.location,
          isSalaryMatch: params.isSalaryMatch,
          isLocationMatch: params.isLocationMatch,
          isEthicsCompliant: params.isEthicsCompliant,
          ethicsNotes: params.ethicsNotes,
          weightedScore: params.weightedScore,
          fitBand: params.fitBand,
          aiSummary: params.aiSummary,
          userContext: params.userContext,
          notes: params.notes,
          status: params.status,
          createdAt: Utility.getCurrentISOTimestamp(),
          updatedAt: null,
        })
        .returning({
          id: companies.id,
        })
        .get();

      const companyDetailsResponse = await this.getCompanyDetails({
        id: createdCompany.id,
        createdBy: params.createdBy,
      });

      if (companyDetailsResponse.company) {
        response.isSuccess = true;
        response.message = "Company created successfully";
        response.company = companyDetailsResponse.company;
      }
    } catch (error) {
      const message = "Unknown error in creating company";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.CreateCompany,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getCompanyDetails(params: Schemas.FindCompanyDALRequest) {
    const response: Schemas.GetCompanyApiResponse = { isSuccess: false };

    try {
      const conditions: SQL[] = [
        eq(companies.id, params.id),
        eq(companies.createdBy, params.createdBy),
      ];

      const [company] = await this.db
        .select({
          id: companies.id,
          name: companies.name,
          website: companies.website,
          industry: companies.industry,
          size: companies.size,
          location: companies.location,
          isSalaryMatch: companies.isSalaryMatch,
          isLocationMatch: companies.isLocationMatch,
          isEthicsCompliant: companies.isEthicsCompliant,
          ethicsNotes: companies.ethicsNotes,
          weightedScore: companies.weightedScore,
          fitBand: companies.fitBand,
          aiSummary: companies.aiSummary,
          userContext: companies.userContext,
          notes: companies.notes,
          status: companies.status,
          statusLabel: sql<Schemas.CompanyStatusLabelEnum>`CASE
          WHEN ${companies.status} = ${Schemas.CompanyStatusIntEnum.Accepted} THEN ${Schemas.CompanyStatusLabelEnum.Accepted}
          WHEN ${companies.status} = ${Schemas.CompanyStatusIntEnum.ContactsAdded} THEN ${Schemas.CompanyStatusLabelEnum.ContactsAdded}
          WHEN ${companies.status} = ${Schemas.CompanyStatusIntEnum.Interviewed} THEN ${Schemas.CompanyStatusLabelEnum.Interviewed}
          WHEN ${companies.status} = ${Schemas.CompanyStatusIntEnum.RejectedHuman} THEN ${Schemas.CompanyStatusLabelEnum.RejectedHuman}
          WHEN ${companies.status} = ${Schemas.CompanyStatusIntEnum.Offer} THEN ${Schemas.CompanyStatusLabelEnum.Offer}
          ELSE ${Schemas.CompanyStatusLabelEnum.WaitingHuman}
        END
          `,
          createdBy: companies.createdBy,
          createdAt: companies.createdAt,
          updatedAt: companies.updatedAt,
        })
        .from(companies)
        .where(and(...conditions))
        .limit(1);

      if (!company) {
        const message = "Company not found";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.GetCompanyDetails,
          message,
          metadata: params,
        });
        response.message = message;
        return response;
      }

      response.isSuccess = true;
      response.message = "Company fetched successfully";
      response.company = company;
    } catch (error) {
      const message = "Unknown error in fetching company";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetCompanyDetails,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getCompanies(params: Schemas.GetCompaniesDALRequest) {
    const response: Schemas.GetCompaniesApiResponse = { isSuccess: false };

    try {
      const companiesResponse = await this.db
        .select({
          id: companies.id,
          name: companies.name,
          website: companies.website,
          industry: companies.industry,
          size: companies.size,
          location: companies.location,
          isSalaryMatch: companies.isSalaryMatch,
          isLocationMatch: companies.isLocationMatch,
          isEthicsCompliant: companies.isEthicsCompliant,
          ethicsNotes: companies.ethicsNotes,
          weightedScore: companies.weightedScore,
          fitBand: companies.fitBand,
          aiSummary: companies.aiSummary,
          userContext: companies.userContext,
          notes: companies.notes,
          status: companies.status,
          statusLabel: sql<Schemas.CompanyStatusLabelEnum>`CASE
          WHEN ${companies.status} = ${Schemas.CompanyStatusIntEnum.Accepted} THEN ${Schemas.CompanyStatusLabelEnum.Accepted}
          WHEN ${companies.status} = ${Schemas.CompanyStatusIntEnum.ContactsAdded} THEN ${Schemas.CompanyStatusLabelEnum.ContactsAdded}
          WHEN ${companies.status} = ${Schemas.CompanyStatusIntEnum.Interviewed} THEN ${Schemas.CompanyStatusLabelEnum.Interviewed}
          WHEN ${companies.status} = ${Schemas.CompanyStatusIntEnum.RejectedHuman} THEN ${Schemas.CompanyStatusLabelEnum.RejectedHuman}
          WHEN ${companies.status} = ${Schemas.CompanyStatusIntEnum.Offer} THEN ${Schemas.CompanyStatusLabelEnum.Offer}
          ELSE ${Schemas.CompanyStatusLabelEnum.WaitingHuman}
        END
          `,
          createdBy: users.clerkId,
          createdAt: companies.createdAt,
          updatedAt: companies.updatedAt,
        })
        .from(companies)
        .innerJoin(users, eq(companies.createdBy, users.clerkId))
        .where(eq(companies.createdBy, params.createdBy));

      response.isSuccess = true;
      response.message = "Companies fetched successfully";
      response.companies = companiesResponse;
    } catch (error) {
      const message = "Unknown error in listing companies";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.ListCompanies,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async updateCompany(params: Schemas.UpdateCompanyDALRequest) {
    const response: Schemas.UpdateCompanyApiResponse = { isSuccess: false };

    try {
      const updatedCompany = await this.db
        .update(companies)
        .set({
          name: params.name ?? undefined,
          website: params.website,
          industry: params.industry,
          size: params.size,
          location: params.location,
          isSalaryMatch: params.isSalaryMatch,
          isLocationMatch: params.isLocationMatch,
          isEthicsCompliant: params.isEthicsCompliant,
          ethicsNotes: params.ethicsNotes,
          weightedScore: params.weightedScore,
          fitBand: params.fitBand,
          aiSummary: params.aiSummary,
          userContext: params.userContext,
          notes: params.notes,
          status: params.status ?? undefined,
          updatedAt: Utility.getCurrentISOTimestamp(),
        })
        .where(and(eq(companies.id, params.id), eq(companies.createdBy, params.createdBy)))
        .returning({ id: companies.id })
        .get();

      if (!updatedCompany) {
        const message = "Company not found";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.UpdateCompany,
          message,
          metadata: params,
        });
        response.message = message;
        return response;
      }

      const companyDetailsResponse = await this.getCompanyDetails({
        id: updatedCompany.id,
        createdBy: params.createdBy,
      });

      response.isSuccess = true;
      response.message = "Company updated successfully";
      response.company = companyDetailsResponse.company;
    } catch (error) {
      const message = "Unknown error in updating company";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.UpdateCompany,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async deleteCompany(params: Schemas.FindCompanyDALRequest) {
    const response: Schemas.ApiResponse = { isSuccess: false };

    try {
      await this.db
        .delete(companies)
        .where(and(eq(companies.id, params.id), eq(companies.createdBy, params.createdBy)));

      response.isSuccess = true;
      response.message = "Company deleted successfully";
    } catch (error) {
      const message = "Unknown error in deleting company";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.DeleteCompany,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }
}
