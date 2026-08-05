import SavedFiltersDAL from "@/data-access-layer/SavedFiltersDAL";
import * as Schemas from "@app/schemas";

export default class SavedFiltersRepo {
  private dal: SavedFiltersDAL;

  constructor(env: Env) {
    this.dal = new SavedFiltersDAL(env);
  }

  async createSavedFilter(
    params: Schemas.CreateSavedFilterApiRequest & { userId: string },
  ): Promise<Schemas.CreateSavedFilterApiResponse> {
    const response = await this.dal.createSavedFilter({
      createdBy: params.userId,
      name: params.savedFilter.name,
      entityType: params.savedFilter.entityType,
      criteria: params.savedFilter.criteria,
    });

    return {
      ...response,
      savedFilter: response.savedFilter ? this.withLabels(response.savedFilter) : undefined,
    };
  }

  async getSavedFilters(
    params: Schemas.GetSavedFiltersApiRequest & { userId: string },
  ): Promise<Schemas.GetSavedFiltersApiResponse> {
    const response = await this.dal.getSavedFilters({
      createdBy: params.userId,
      entityType: params.entityType,
    });

    return {
      ...response,
      savedFilters: response.savedFilters?.map((savedFilter) => this.withLabels(savedFilter)),
    };
  }

  async updateSavedFilter(
    params: Schemas.UpdateSavedFilterApiRequest & { userId: string; id: number },
  ): Promise<Schemas.UpdateSavedFilterApiResponse> {
    const response = await this.dal.updateSavedFilter({
      id: params.id,
      createdBy: params.userId,
      name: params.savedFilter.name,
      criteria: params.savedFilter.criteria,
    });

    return {
      ...response,
      savedFilter: response.savedFilter ? this.withLabels(response.savedFilter) : undefined,
    };
  }

  async deleteSavedFilter(params: { userId: string; id: number }) {
    return await this.dal.deleteSavedFilter({ id: params.id, createdBy: params.userId });
  }

  private withLabels(savedFilter: Schemas.SavedFilter): Schemas.SavedFilterWithLabel {
    return {
      ...savedFilter,
      savedFilterEntityType: savedFilter.entityType,
      savedFilterEntityTypeLabel:
        Schemas.SAVED_FILTER_ENTITY_TYPE_LABEL_MAP[savedFilter.entityType],
    };
  }
}
