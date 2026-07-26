import { and, asc, count, desc, eq, inArray, like, or } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { jobs, companies } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";
import Utility from "@/utils";

export default class JobsDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  async createJob(params: Schemas.CreateJobDALRequest) {
    const response: Schemas.CreateJobApiResponse = { isSuccess: false };

    try {
      AppLogger.info({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.CreateJob,
        message: "Inserting job row",
        metadata: params,
      });

      const row = await this.db
        .insert(jobs)
        .values({
          title: params.title,
          status: params.status,
          type: params.type,
          companyId: params.companyId,
          url: params.url,
          salary: params.salary,
          source: params.source,
          description: params.description,
          skills: params.skills ? JSON.stringify(params.skills) : null,
          roleType: params.roleType,
          matchScore: params.matchScore,
          createdBy: params.createdBy,
          createdAt: Utility.getCurrentISOTimestamp(),
        })
        .returning()
        .get();

      response.isSuccess = true;
      response.message = "Job created successfully";
      response.job = {
        ...row,
        skills: row.skills ? (JSON.parse(row.skills) as string[]) : null,
        statusLabel: Schemas.jobStatusIntToLabel[row.status],
        typeLabel: Schemas.jobTypeIntToLabel[row.type],
      };
    } catch (error) {
      const message = "Unknown error in creating job";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.CreateJob,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async updateJob(params: Schemas.UpdateJobDALRequest) {
    const response: Schemas.UpdateJobApiResponse = { isSuccess: false };

    try {
      AppLogger.info({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.UpdateJob,
        message: "Updating job row",
        metadata: { id: params.id, createdBy: params.createdBy },
      });

      const {
        id,
        createdBy,
        title,
        status,
        type,
        companyId,
        url,
        salary,
        source,
        description,
        skills,
        roleType,
        matchScore,
        updatedAt,
      } = params;

      const setValues: Record<string, unknown> = {
        updatedAt: updatedAt ?? Utility.getCurrentISOTimestamp(),
      };
      if (title !== undefined) setValues.title = title;
      if (status !== undefined) setValues.status = status;
      if (type !== undefined) setValues.type = type;
      if (companyId !== undefined) setValues.companyId = companyId;
      if (url !== undefined) setValues.url = url;
      if (salary !== undefined) setValues.salary = salary;
      if (source !== undefined) setValues.source = source;
      if (description !== undefined) setValues.description = description;
      if (skills !== undefined) setValues.skills = skills ? JSON.stringify(skills) : null;
      if (roleType !== undefined) setValues.roleType = roleType;
      if (matchScore !== undefined) setValues.matchScore = matchScore;

      const row = await this.db
        .update(jobs)
        .set(setValues)
        .where(and(eq(jobs.id, id), eq(jobs.createdBy, createdBy)))
        .returning()
        .get();

      if (!row) {
        const message = "Job not found or not owned by user";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.UpdateJob,
          message,
          metadata: params,
        });
        response.message = message;
        return response;
      }

      response.isSuccess = true;
      response.message = "Job updated successfully";
      response.job = {
        ...row,
        skills: row.skills ? (JSON.parse(row.skills) as string[]) : null,
        statusLabel: Schemas.jobStatusIntToLabel[row.status],
        typeLabel: Schemas.jobTypeIntToLabel[row.type],
      };
    } catch (error) {
      const message = "Unknown error in updating job";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.UpdateJob,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getJobDetails(params: Schemas.FindJobDetailsDALRequest) {
    const response: Schemas.GetJobApiResponse = { isSuccess: false };

    try {
      const [row] = await this.db
        .select({
          id: jobs.id,
          createdBy: jobs.createdBy,
          title: jobs.title,
          status: jobs.status,
          type: jobs.type,
          companyId: jobs.companyId,
          companyName: companies.name,
          companyIndustry: companies.industry,
          companyLocation: companies.location,
          companyStatus: companies.status,
          companyFitBand: companies.fitBand,
          url: jobs.url,
          salary: jobs.salary,
          source: jobs.source,
          description: jobs.description,
          skills: jobs.skills,
          roleType: jobs.roleType,
          matchScore: jobs.matchScore,
          createdAt: jobs.createdAt,
          updatedAt: jobs.updatedAt,
        })
        .from(jobs)
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .where(and(eq(jobs.id, params.id), eq(jobs.createdBy, params.createdBy)))
        .limit(1);

      if (!row) {
        const message = "Job not found";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.GetJobDetails,
          message,
          metadata: params,
        });
        response.message = message;
        return response;
      }

      response.isSuccess = true;
      response.message = "Job fetched successfully";
      response.job = {
        ...row,
        skills: row.skills ? (JSON.parse(row.skills) as string[]) : null,
        statusLabel: Schemas.jobStatusIntToLabel[row.status],
        typeLabel: Schemas.jobTypeIntToLabel[row.type],
        companyStatusLabel:
          row.companyStatus != null
            ? (Schemas.companyStatusIntToLabel[row.companyStatus] ?? null)
            : null,
        companyFitBandLabel:
          row.companyFitBand != null
            ? (Schemas.companyFitBandIntToLabel[row.companyFitBand] ?? null)
            : null,
      };
    } catch (error) {
      const message = "Unknown error in fetching job";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetJobDetails,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getExistingUrls(params: { createdBy: string; urls: string[] }): Promise<Set<string>> {
    try {
      if (params.urls.length === 0) return new Set();

      const rows = await this.db
        .select({ url: jobs.url })
        .from(jobs)
        .where(and(eq(jobs.createdBy, params.createdBy), inArray(jobs.url, params.urls)));

      return new Set(rows.map((r) => r.url).filter((u): u is string => u !== null));
    } catch (error) {
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.DuplicateJobBlocked,
        message: "Failed to fetch existing job URLs for dedup",
        error,
        metadata: { createdBy: params.createdBy, urlCount: params.urls.length },
      });
      return new Set();
    }
  }

  async bulkInsertJobs(params: {
    createdBy: string;
    jobs: Schemas.CreateJobDALRequest[];
  }): Promise<number> {
    let inserted = 0;

    for (const job of params.jobs) {
      try {
        await this.db.insert(jobs).values({
          title: job.title,
          status: job.status,
          type: job.type,
          companyId: job.companyId,
          url: job.url,
          salary: job.salary,
          source: job.source,
          description: job.description,
          skills: job.skills ? JSON.stringify(job.skills) : null,
          matchScore: job.matchScore,
          createdBy: job.createdBy,
          createdAt: Utility.getCurrentISOTimestamp(),
        });
        inserted++;
      } catch (error) {
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.BulkInsertJobs,
          message: "Failed to insert single job during bulk insert — continuing",
          error,
          metadata: { title: job.title, url: job.url, createdBy: job.createdBy },
        });
      }
    }

    AppLogger.info({
      category: Schemas.LogCategory.DAL,
      action: Schemas.LogAction.BulkInsertJobs,
      message: "Bulk insert complete",
      metadata: { attempted: params.jobs.length, inserted, createdBy: params.createdBy },
    });

    return inserted;
  }

  async deleteJob(params: Schemas.DeleteJobDALRequest) {
    const response: Schemas.DeleteJobApiResponse = { isSuccess: false };

    try {
      AppLogger.info({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.DeleteJob,
        message: "Deleting job row",
        metadata: { id: params.id, createdBy: params.createdBy },
      });

      const result = await this.db
        .delete(jobs)
        .where(and(eq(jobs.id, params.id), eq(jobs.createdBy, params.createdBy)))
        .returning({ id: jobs.id })
        .get();

      if (!result) {
        const message = "Job not found or not owned by user";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.DeleteJob,
          message,
          metadata: params,
        });
        response.message = message;
        return response;
      }

      response.isSuccess = true;
      response.message = "Job deleted successfully";
    } catch (error) {
      const message = "Unknown error in deleting job";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.DeleteJob,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async bulkDeleteJobs(params: Schemas.BulkDeleteJobsDALRequest) {
    const response: Schemas.BulkDeleteJobsApiResponse = { isSuccess: false };

    try {
      AppLogger.info({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.BulkDeleteJobs,
        message: "Bulk deleting jobs",
        metadata: { count: params.ids.length, createdBy: params.createdBy },
      });

      const result = await this.db
        .delete(jobs)
        .where(and(eq(jobs.createdBy, params.createdBy), inArray(jobs.id, params.ids)))
        .returning({ id: jobs.id });

      response.isSuccess = true;
      response.message = `${result.length} job(s) deleted`;
      response.deletedCount = result.length;
    } catch (error) {
      const message = "Unknown error in bulk deleting jobs";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.BulkDeleteJobs,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async bulkUpdateJobs(params: Schemas.BulkUpdateJobsDALRequest) {
    const response: Schemas.BulkUpdateJobsApiResponse = { isSuccess: false };

    try {
      AppLogger.info({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.BulkUpdateJobs,
        message: "Bulk updating job status",
        metadata: { count: params.ids.length, status: params.status, createdBy: params.createdBy },
      });

      const result = await this.db
        .update(jobs)
        .set({ status: params.status, updatedAt: Utility.getCurrentISOTimestamp() })
        .where(and(eq(jobs.createdBy, params.createdBy), inArray(jobs.id, params.ids)))
        .returning({ id: jobs.id });

      response.isSuccess = true;
      response.message = `${result.length} job(s) updated`;
      response.updatedCount = result.length;
    } catch (error) {
      const message = "Unknown error in bulk updating jobs";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.BulkUpdateJobs,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getJobsCount(params: Schemas.GetJobsCountDALRequest) {
    const response: Schemas.GetJobsCountApiResponse = { isSuccess: false };

    try {
      AppLogger.info({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.CountJobs,
        message: "Counting jobs",
        metadata: params,
      });

      const term = params.searchText?.trim();
      const pattern = term ? `%${term}%` : undefined;

      const [row] = await this.db
        .select({ count: count() })
        .from(jobs)
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .where(
          pattern
            ? and(
                eq(jobs.createdBy, params.createdBy),
                or(
                  like(jobs.title, pattern),
                  like(companies.location, pattern),
                  like(jobs.salary, pattern),
                  like(companies.name, pattern),
                ),
              )
            : eq(jobs.createdBy, params.createdBy),
        );

      response.isSuccess = true;
      response.message = "Jobs counted successfully";
      response.count = row?.count ?? 0;
    } catch (error) {
      const message = "Unknown error in counting jobs";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.CountJobs,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getJobs(params: Schemas.GetJobsDALRequest) {
    const response: Schemas.GetJobsApiResponse = { isSuccess: false };

    try {
      AppLogger.info({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.ListJobs,
        message: "Fetching jobs",
        metadata: params,
      });

      const term = params.searchText?.trim();
      const pattern = term ? `%${term}%` : undefined;

      const sortColumnMap = {
        [Schemas.JobSortColumn.CreatedAt]: jobs.createdAt,
        [Schemas.JobSortColumn.Title]: jobs.title,
        [Schemas.JobSortColumn.Status]: jobs.status,
      };
      const sortCol = sortColumnMap[params.sortColumn] ?? jobs.createdAt;
      const orderExpr =
        params.sortDirection === Schemas.SortDirection.Asc ? asc(sortCol) : desc(sortCol);
      const offset = (params.pageNo - 1) * params.pageSize;

      const rows = await this.db
        .select({
          id: jobs.id,
          createdBy: jobs.createdBy,
          title: jobs.title,
          status: jobs.status,
          type: jobs.type,
          companyId: jobs.companyId,
          companyName: companies.name,
          companyLocation: companies.location,
          url: jobs.url,
          salary: jobs.salary,
          source: jobs.source,
          description: jobs.description,
          skills: jobs.skills,
          roleType: jobs.roleType,
          matchScore: jobs.matchScore,
          createdAt: jobs.createdAt,
          updatedAt: jobs.updatedAt,
        })
        .from(jobs)
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .where(
          pattern
            ? and(
                eq(jobs.createdBy, params.createdBy),
                or(
                  like(jobs.title, pattern),
                  like(companies.location, pattern),
                  like(jobs.salary, pattern),
                  like(companies.name, pattern),
                ),
              )
            : eq(jobs.createdBy, params.createdBy),
        )
        .orderBy(orderExpr)
        .limit(params.pageSize)
        .offset(offset);

      response.isSuccess = true;
      response.message = "Jobs fetched successfully";
      response.jobs = rows.map((row) => ({
        ...row,
        skills: row.skills ? (JSON.parse(row.skills) as string[]) : null,
        statusLabel: Schemas.jobStatusIntToLabel[row.status],
        typeLabel: Schemas.jobTypeIntToLabel[row.type],
      }));
    } catch (error) {
      const message = "Unknown error in fetching jobs";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.ListJobs,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getJobsByCompany(params: Schemas.GetJobsByCompanyDALRequest) {
    const response: Schemas.GetJobsApiResponse = { isSuccess: false };

    try {
      const rows = await this.db
        .select({
          id: jobs.id,
          createdBy: jobs.createdBy,
          title: jobs.title,
          status: jobs.status,
          type: jobs.type,
          companyId: jobs.companyId,
          companyName: companies.name,
          companyLocation: companies.location,
          url: jobs.url,
          salary: jobs.salary,
          source: jobs.source,
          description: jobs.description,
          skills: jobs.skills,
          roleType: jobs.roleType,
          matchScore: jobs.matchScore,
          createdAt: jobs.createdAt,
          updatedAt: jobs.updatedAt,
        })
        .from(jobs)
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .where(and(eq(jobs.createdBy, params.createdBy), eq(jobs.companyId, params.companyId)))
        .orderBy(desc(jobs.createdAt))
        // TODO: paginate — capped at 20 until the company-context UI supports pagination.
        .limit(20);

      response.isSuccess = true;
      response.message = "Jobs fetched successfully";
      response.jobs = rows.map((row) => ({
        ...row,
        skills: row.skills ? (JSON.parse(row.skills) as string[]) : null,
        statusLabel: Schemas.jobStatusIntToLabel[row.status],
        typeLabel: Schemas.jobTypeIntToLabel[row.type],
      }));
    } catch (error) {
      const message = "Unknown error in listing jobs by company";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.ListJobs,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }
}
