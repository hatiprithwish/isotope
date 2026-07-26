import ContactRolePillsDAL from "@/data-access-layer/ContactRolePillsDAL";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";

export default class ContactRolePillsRepo {
  private dal: ContactRolePillsDAL;

  constructor(env: Env) {
    this.dal = new ContactRolePillsDAL(env);
  }

  async getPillsDetails(params: {
    userId: string;
  }): Promise<Schemas.GetContactRolePillsApiResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.GetContactRolePills,
      message: "Fetching latest contact role pills",
      metadata: { userId: params.userId },
    });

    const response = await this.dal.getPillsDetails({ createdBy: params.userId });

    // Self-heal accounts that synced before this feature shipped and never got seeded —
    // seed once (idempotent, no-op if a row now exists) and re-fetch instead of returning empty.
    if (response.isSuccess && !response.pills) {
      await this.dal.createDefaultIfAbsent(params.userId);
      return this.dal.getPillsDetails({ createdBy: params.userId });
    }

    return response;
  }

  async savePills(params: {
    userId: string;
    input: Schemas.SaveContactRolePillsApiRequest;
  }): Promise<Schemas.SaveContactRolePillsApiResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.SaveContactRolePills,
      message: "Saving contact role pills",
      metadata: { userId: params.userId, input: params.input },
    });

    return this.dal.savePills({ createdBy: params.userId, input: params.input });
  }
}
