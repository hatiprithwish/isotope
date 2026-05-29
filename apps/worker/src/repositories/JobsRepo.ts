import JobsDAL from "@/data-access-layer/JobsDAL";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/logger";

export default class JobsRepo {
  private dal: JobsDAL;

  constructor(env: Env) {
    this.dal = new JobsDAL(env);
  }

  async createJob(params: Schemas.CreateJobApiRequest & { userId: string }) {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.CreateJob,
      message: "Creating job",
      metadata: { userId: params.userId, title: params.title },
    });

    return await this.dal.createJob({
      title: params.title,
      status: params.status ?? Schemas.JobStatusIntEnum.NotStarted,
      type: Schemas.JobTypeIntEnum.Manual,
      companyId: params.companyId ?? null,
      url: params.url,
      location: params.location ?? null,
      salary: params.salary ?? null,
      source: params.source ?? null,
      description: params.description ?? null,
      skills: null,
      matchScore: null,
      createdBy: params.userId,
    });
  }

  async getJobDetails(params: { userId: string; id: number }) {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.GetJobDetails,
      message: "Fetching job details",
      metadata: params,
    });

    return await this.dal.getJobDetails({ id: params.id, createdBy: params.userId });
  }

  async countJobs(params: { userId: string }) {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.CountJobs,
      message: "Counting jobs",
      metadata: params,
    });

    return await this.dal.getJobsCount({ createdBy: params.userId });
  }

  async getJobs(params: { userId: string }) {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.ListJobs,
      message: "Listing jobs",
      metadata: params,
    });

    return await this.dal.getJobs({ createdBy: params.userId });
  }

  async searchJobs(params: { userId: string; searchText?: string }) {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.SearchJobs,
      message: "Searching jobs",
      metadata: { userId: params.userId, searchText: params.searchText },
    });

    return await this.dal.searchJobs({ createdBy: params.userId, searchText: params.searchText });
  }
}
