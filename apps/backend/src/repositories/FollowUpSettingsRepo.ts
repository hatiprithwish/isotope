import FollowUpSettingsDAL from "@/data-access-layer/FollowUpSettingsDAL";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";

export default class FollowUpSettingsRepo {
  private dal: FollowUpSettingsDAL;

  constructor(env: Env) {
    this.dal = new FollowUpSettingsDAL(env);
  }

  async getSettingsDetails(params: {
    userId: string;
  }): Promise<Schemas.GetFollowUpSettingsApiResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.GetFollowUpSettings,
      message: "Fetching latest follow-up settings",
      metadata: { userId: params.userId },
    });

    return this.dal.getSettingsDetails({ createdBy: params.userId });
  }

  async saveSettings(params: {
    userId: string;
    input: Schemas.SaveFollowUpSettingsApiRequest;
  }): Promise<Schemas.SaveFollowUpSettingsApiResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.SaveFollowUpSettings,
      message: "Saving follow-up settings",
      metadata: { userId: params.userId, input: params.input },
    });

    return this.dal.saveSettings({ createdBy: params.userId, input: params.input });
  }
}
