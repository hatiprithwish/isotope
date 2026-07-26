import RoleTypesDAL from "@/data-access-layer/RoleTypesDAL";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";

export default class RoleTypesRepo {
  private dal: RoleTypesDAL;

  constructor(env: Env) {
    this.dal = new RoleTypesDAL(env);
  }

  async getRoleTypesDetails(params: { userId: string }): Promise<Schemas.GetRoleTypesApiResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.GetRoleTypes,
      message: "Fetching role types",
      metadata: { userId: params.userId },
    });

    const response = await this.dal.getRoleTypesDetails({ createdBy: params.userId });

    // Self-heal accounts that synced before this feature shipped and never got seeded —
    // seed once (idempotent, no-op if a row now exists) and re-fetch instead of returning empty.
    if (response.isSuccess && !response.roleTypes) {
      await this.dal.createDefaultIfAbsent(params.userId);
      return this.dal.getRoleTypesDetails({ createdBy: params.userId });
    }

    return response;
  }

  async saveRoleTypes(params: {
    userId: string;
    input: Schemas.SaveRoleTypesApiRequest;
  }): Promise<Schemas.SaveRoleTypesApiResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.SaveRoleTypes,
      message: "Saving role types",
      metadata: { userId: params.userId },
    });

    return this.dal.saveRoleTypes({ createdBy: params.userId, input: params.input });
  }
}
