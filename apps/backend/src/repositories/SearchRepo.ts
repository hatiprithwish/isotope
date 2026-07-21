import SearchDAL from "@/data-access-layer/SearchDAL";
import type * as Schemas from "@app/schemas";

export default class SearchRepo {
  private dal: SearchDAL;

  constructor(env: Env) {
    this.dal = new SearchDAL(env);
  }

  async search(params: Schemas.SearchApiRequest & { userId: string }) {
    return await this.dal.search({
      query: params.q,
      createdBy: params.userId,
      limit: params.limit,
    });
  }
}
