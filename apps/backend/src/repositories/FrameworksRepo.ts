import FrameworksDAL from "@/data-access-layer/FrameworksDAL";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";

export default class FrameworksRepo {
  private dal: FrameworksDAL;

  constructor(env: Env) {
    this.dal = new FrameworksDAL(env);
  }

  async getFrameworkDetails(params: {
    userId: string;
  }): Promise<Schemas.GetFrameworkDetailsApiResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.GetFramework,
      message: "Fetching latest framework",
      metadata: { userId: params.userId },
    });

    return this.dal.getFrameworkDetails({ createdBy: params.userId });
  }

  async saveFramework(params: {
    userId: string;
    input: Schemas.SaveFrameworkApiRequest;
  }): Promise<Schemas.SaveFrameworkApiResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.SaveFramework,
      message: "Saving framework",
      metadata: { userId: params.userId, input: params.input },
    });

    return this.dal.saveFramework({ createdBy: params.userId, input: params.input });
  }
}
