import StatusChangeNotesDAL from "@/data-access-layer/StatusChangeNotesDAL";
import CompaniesDAL from "@/data-access-layer/CompaniesDAL";
import ContactsDAL from "@/data-access-layer/ContactsDAL";
import JobsDAL from "@/data-access-layer/JobsDAL";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";

export default class StatusChangeNotesRepo {
  private dal: StatusChangeNotesDAL;
  private companiesDal: CompaniesDAL;
  private contactsDal: ContactsDAL;
  private jobsDal: JobsDAL;

  constructor(env: Env) {
    this.dal = new StatusChangeNotesDAL(env);
    this.companiesDal = new CompaniesDAL(env);
    this.contactsDal = new ContactsDAL(env);
    this.jobsDal = new JobsDAL(env);
  }

  /** Batched ownership check — one query per entity type instead of one per id. */
  private async getOwnedEntityIds(params: {
    userId: string;
    entityType: Schemas.StatusChangeEntityTypeEnum;
    entityIds: number[];
  }): Promise<number[]> {
    switch (params.entityType) {
      case Schemas.StatusChangeEntityTypeEnum.Company:
        return await this.companiesDal.getOwnedIds(params.userId, params.entityIds);
      case Schemas.StatusChangeEntityTypeEnum.Contact:
        return await this.contactsDal.getOwnedIds(params.userId, params.entityIds);
      case Schemas.StatusChangeEntityTypeEnum.Job:
        return await this.jobsDal.getOwnedIds(params.userId, params.entityIds);
    }
  }

  async createStatusChangeNote(
    params: Schemas.CreateStatusChangeNoteApiRequest & { userId: string },
  ) {
    const response: Schemas.CreateStatusChangeNoteApiResponse = { isSuccess: false };

    const ownedIds = await this.getOwnedEntityIds({
      userId: params.userId,
      entityType: params.statusChangeNote.entityType,
      entityIds: [params.statusChangeNote.entityId],
    });
    if (!ownedIds.includes(params.statusChangeNote.entityId)) {
      const message = "Entity not found";
      AppLogger.error({
        category: Schemas.LogCategory.Repo,
        action: Schemas.LogAction.CreateStatusChangeNote,
        message,
        metadata: params,
      });
      response.message = message;
      return response;
    }

    return await this.dal.createStatusChangeNote({
      createdBy: params.userId,
      entityType: params.statusChangeNote.entityType,
      entityId: params.statusChangeNote.entityId,
      fromStatus: params.statusChangeNote.fromStatus,
      toStatus: params.statusChangeNote.toStatus,
      note: params.statusChangeNote.note,
    });
  }

  async bulkCreateStatusChangeNotes(
    params: Schemas.BulkCreateStatusChangeNotesApiRequest & { userId: string },
  ) {
    const response: Schemas.BulkCreateStatusChangeNotesApiResponse = { isSuccess: false };

    const ownedEntityIds = await this.getOwnedEntityIds({
      userId: params.userId,
      entityType: params.entityType,
      entityIds: params.entityIds,
    });
    const skippedIds = params.entityIds.filter((id) => !ownedEntityIds.includes(id));

    if (ownedEntityIds.length === 0) {
      const message = "No owned entities to update";
      AppLogger.error({
        category: Schemas.LogCategory.Repo,
        action: Schemas.LogAction.BulkCreateStatusChangeNotes,
        message,
        metadata: params,
      });
      response.message = message;
      response.skippedIds = skippedIds;
      return response;
    }

    if (skippedIds.length > 0) {
      // Not fatal — the owned subset still gets its notes written — but callers (e.g. the
      // frontend's bulk status-change flow) need `skippedIds` to reconcile against the ids
      // they requested notes for, the same way `updatedIds` lets them reconcile bulk updates.
      AppLogger.error({
        category: Schemas.LogCategory.Repo,
        action: Schemas.LogAction.BulkCreateStatusChangeNotes,
        message: "Some entities were skipped because they are not owned by the caller",
        metadata: { ...params, skippedIds },
      });
    }

    const dalResponse = await this.dal.bulkCreateStatusChangeNotes({
      createdBy: params.userId,
      entityType: params.entityType,
      entityIds: ownedEntityIds,
      toStatus: params.toStatus,
      note: params.note,
    });

    return {
      ...dalResponse,
      createdIds: dalResponse.statusChangeNotes?.map((note) => note.entityId),
      skippedIds,
    };
  }

  async getStatusChangeNotes(params: Schemas.GetStatusChangeNotesApiRequest & { userId: string }) {
    return await this.dal.getStatusChangeNotes({
      createdBy: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
    });
  }
}
