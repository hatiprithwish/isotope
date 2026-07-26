import FrameworksDAL from "@/data-access-layer/FrameworksDAL";
import FollowUpSettingsDAL from "@/data-access-layer/FollowUpSettingsDAL";
import ContactRolePillsDAL from "@/data-access-layer/ContactRolePillsDAL";
import UsersDAL from "@/data-access-layer/UsersDAL";
import type * as Schemas from "@app/schemas";

export default class UsersRepo {
  private dal: UsersDAL;
  private env: Env;

  constructor(env: Env) {
    this.dal = new UsersDAL(env);
    this.env = env;
  }

  async syncClerkUser(params: Schemas.SyncClerkUserApiRequest) {
    const result = await this.dal.upsertUser(params);
    if (result.isSuccess && result.user) {
      const frameworksDAL = new FrameworksDAL(this.env);
      await frameworksDAL.createDefaultIfAbsent(params.clerkId);
      const followUpSettingsDAL = new FollowUpSettingsDAL(this.env);
      await followUpSettingsDAL.createDefaultIfAbsent(params.clerkId);
      const contactRolePillsDAL = new ContactRolePillsDAL(this.env);
      await contactRolePillsDAL.createDefaultIfAbsent(params.clerkId);
    }
    return result;
  }

  async getUserDetails(params: { clerkId: string }) {
    return await this.dal.getUserDetails({
      clerkId: params.clerkId,
    });
  }
}
