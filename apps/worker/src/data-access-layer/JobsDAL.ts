import { and, count, eq, like, or } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { jobs, companies } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/logger";
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
          location: params.location,
          salary: params.salary,
          source: params.source,
          description: params.description,
          skills: params.skills ? JSON.stringify(params.skills) : null,
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

  async getJobDetails(params: Schemas.FindJobDetailsDALRequest) {
    const response: Schemas.GetJobApiResponse = { isSuccess: false };

    try {
      const [row] = await this.db
        .select()
        .from(jobs)
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

  async getJobsCount(params: Schemas.GetJobsDALRequest) {
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
                  like(jobs.location, pattern),
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
        action: Schemas.LogAction.SearchJobs,
        message: "Fetching jobs",
        metadata: { userId: params.createdBy, searchText: params.searchText },
      });

      const term = params.searchText?.trim();
      const pattern = term ? `%${term}%` : undefined;

      const rows = await this.db
        .select({
          id: jobs.id,
          createdBy: jobs.createdBy,
          title: jobs.title,
          status: jobs.status,
          type: jobs.type,
          companyId: jobs.companyId,
          url: jobs.url,
          location: jobs.location,
          salary: jobs.salary,
          source: jobs.source,
          description: jobs.description,
          skills: jobs.skills,
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
                  like(jobs.location, pattern),
                  like(jobs.salary, pattern),
                  like(companies.name, pattern),
                ),
              )
            : eq(jobs.createdBy, params.createdBy),
        );

      response.isSuccess = true;
      response.message = "Jobs searched successfully";
      response.jobs = rows.map((row) => ({
        ...row,
        skills: row.skills ? (JSON.parse(row.skills) as string[]) : null,
        statusLabel: Schemas.jobStatusIntToLabel[row.status],
        typeLabel: Schemas.jobTypeIntToLabel[row.type],
      }));
    } catch (error) {
      const message = "Unknown error in searching jobs";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.SearchJobs,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }
}
