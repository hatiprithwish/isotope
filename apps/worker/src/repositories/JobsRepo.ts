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

  async updateJob(params: Schemas.UpdateJobApiRequest & { userId: string; id: number }) {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.UpdateJob,
      message: "Updating job",
      metadata: { userId: params.userId, id: params.id },
    });

    const dalParams: Schemas.UpdateJobDALRequest = {
      id: params.id,
      createdBy: params.userId,
    };
    if (params.title !== undefined) dalParams.title = params.title;
    if (params.companyId !== undefined) dalParams.companyId = params.companyId ?? null;
    if (params.url !== undefined) dalParams.url = params.url;
    if (params.description !== undefined) dalParams.description = params.description ?? null;
    if (params.location !== undefined) dalParams.location = params.location ?? null;
    if (params.salary !== undefined) dalParams.salary = params.salary ?? null;
    if (params.source !== undefined) dalParams.source = params.source ?? null;
    if (params.status !== undefined) dalParams.status = params.status;
    if (params.type !== undefined) dalParams.type = params.type;
    if (params.skills !== undefined) dalParams.skills = params.skills ?? null;
    if (params.matchScore !== undefined) dalParams.matchScore = params.matchScore ?? null;

    return await this.dal.updateJob(dalParams);
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

  async countJobs(params: { userId: string } & Schemas.GetJobsApiRequest) {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.CountJobs,
      message: "Counting jobs",
      metadata: params,
    });

    return await this.dal.getJobsCount({
      createdBy: params.userId,
      searchText: params.searchText ?? null,
    });
  }

  async getJobs(params: Schemas.GetJobsApiRequest & { userId: string }) {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.ListJobs,
      message: "Listing jobs",
      metadata: params,
    });

    return await this.dal.getJobs({
      createdBy: params.userId,
      searchText: params.searchText ?? null,
    });
  }
}
