import JobsDAL from "@/data-access-layer/JobsDAL";
import FrameworksDAL from "@/data-access-layer/FrameworksDAL";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";
import Constants from "@/config/Constants";

export default class JobsRepo {
  private dal: JobsDAL;
  private env: Env;

  constructor(env: Env) {
    this.dal = new JobsDAL(env);
    this.env = env;
  }

  async createJob(params: Schemas.CreateJobApiRequest & { userId: string }) {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.CreateJob,
      message: "Creating job",
      metadata: { userId: params.userId, title: params.job.title },
    });

    return await this.dal.createJob({
      title: params.job.title,
      status: params.job.status ?? Schemas.JobStatusIntEnum.NotStarted,
      type: Schemas.JobTypeIntEnum.Manual,
      companyId: params.job.companyId ?? null,
      url: params.job.url,
      salary: params.job.salary ?? null,
      source: params.job.source ?? null,
      description: params.job.description ?? null,
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

    const { job } = params;
    const dalParams: Schemas.UpdateJobDALRequest = {
      id: params.id,
      createdBy: params.userId,
    };
    if (job.title !== undefined) dalParams.title = job.title;
    if (job.companyId !== undefined) dalParams.companyId = job.companyId ?? null;
    if (job.url !== undefined) dalParams.url = job.url ?? null;
    if (job.description !== undefined) dalParams.description = job.description ?? null;
    if (job.salary !== undefined) dalParams.salary = job.salary ?? null;
    if (job.source !== undefined) dalParams.source = job.source ?? null;
    if (job.status !== undefined) dalParams.status = job.status;
    if (job.type !== undefined) dalParams.type = job.type;
    if (job.skills !== undefined) dalParams.skills = job.skills ?? null;
    if (job.matchScore !== undefined) dalParams.matchScore = job.matchScore ?? null;

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

  async deleteJob(params: { userId: string; id: number }) {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.DeleteJob,
      message: "Deleting job",
      metadata: params,
    });

    return await this.dal.deleteJob({ id: params.id, createdBy: params.userId });
  }

  async bulkDeleteJobs(params: Schemas.BulkDeleteJobsApiRequest & { userId: string }) {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.BulkDeleteJobs,
      message: "Bulk deleting jobs",
      metadata: { userId: params.userId, count: params.ids.length },
    });

    return await this.dal.bulkDeleteJobs({ ids: params.ids, createdBy: params.userId });
  }

  async bulkUpdateJobs(params: Schemas.BulkUpdateJobsApiRequest & { userId: string }) {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.BulkUpdateJobs,
      message: "Bulk updating jobs",
      metadata: { userId: params.userId, count: params.ids.length, status: params.status },
    });

    return await this.dal.bulkUpdateJobs({
      ids: params.ids,
      createdBy: params.userId,
      status: params.status,
    });
  }

  async countJobs(params: Schemas.GetJobsApiRequest & { userId: string }) {
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

  async discoverJobs(params: { userId: string }): Promise<Schemas.DiscoverJobsApiResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.DiscoverJobs,
      message: "Triggering job discovery workflow",
      metadata: { userId: params.userId },
    });

    const frameworksDal = new FrameworksDAL(this.env);
    const frameworkResult = await frameworksDal.getFrameworkDetails({ createdBy: params.userId });

    if (!frameworkResult.isSuccess || !frameworkResult.framework?.isCustomized) {
      return {
        isSuccess: false,
        message: "No job search framework found. Please set up your framework first.",
      };
    }

    const instance = await this.env.JOB_DISCOVERY_WORKFLOW.create({
      params: { createdBy: params.userId },
    });

    return {
      isSuccess: true,
      message: "Job discovery started",
      workflowInstanceId: instance.id,
    };
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
      pageNo: params.pageNo ?? Constants.DEFAULT_PAGE_NO,
      pageSize: params.pageSize ?? Constants.DEFAULT_PAGE_SIZE,
      sortColumn: params.sortColumn ?? Schemas.JobSortColumn.CreatedAt,
      sortDirection: params.sortDirection ?? Schemas.SortDirection.Desc,
    });
  }
}
