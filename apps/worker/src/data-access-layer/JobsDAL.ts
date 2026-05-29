import { and, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { jobs } from "@/db/tables";
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

  async getJobDetails(params: Schemas.FindJobDALRequest) {
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

  async getJobsList(params: Schemas.GetJobsDALRequest) {
    const response: Schemas.GetJobsApiResponse = { isSuccess: false };

    try {
      AppLogger.info({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.ListJobs,
        message: "Querying jobs list",
        metadata: params,
      });

      const rows = await this.db.select().from(jobs).where(eq(jobs.createdBy, params.createdBy));

      response.isSuccess = true;
      response.message = "Jobs fetched successfully";
      response.jobs = rows.map((row) => ({
        ...row,
        skills: row.skills ? (JSON.parse(row.skills) as string[]) : null,
        statusLabel: Schemas.jobStatusIntToLabel[row.status],
        typeLabel: Schemas.jobTypeIntToLabel[row.type],
      }));
    } catch (error) {
      const message = "Unknown error in listing jobs";
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
