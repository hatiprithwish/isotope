import ContactsDAL from "@/data-access-layer/ContactsDAL";
import TasksRepo from "@/repositories/TasksRepo";
import Constants from "@/config/Constants";
import Utility from "@/utils";
import * as Schemas from "@app/schemas"; // runtime `import *` (not `import type`): this repo consumes buildContactHistoryType for the history-type convention.

export default class ContactsRepo {
  private dal: ContactsDAL;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.dal = new ContactsDAL(env);
  }

  async createContact(params: Schemas.CreateContactApiRequest & { userId: string }) {
    return await this.dal.createContact({
      createdBy: params.userId,
      ...params.contact,
    });
  }

  async getContactDetails(params: { userId: string; id: number }) {
    return await this.dal.getContactDetails({ createdBy: params.userId, id: params.id });
  }

  async getContacts(params: Schemas.GetContactsApiRequest & { userId: string }) {
    return await this.dal.getContacts({
      createdBy: params.userId,
      search: params.search ?? null,
      pageNo: params.pageNo ?? Constants.DEFAULT_PAGE_NO,
      pageSize: params.pageSize ?? Constants.DEFAULT_PAGE_SIZE,
    });
  }

  async getContactsByCompany(params: { userId: string; companyId: number }) {
    return await this.dal.getContactsByCompany({
      createdBy: params.userId,
      companyId: params.companyId,
    });
  }

  async updateContact(params: Schemas.UpdateContactApiRequest & { userId: string; id: number }) {
    return this.dal.updateContact({
      id: params.id,
      createdBy: params.userId,
      name: params.contact.name ?? null,
      designation: params.contact.designation ?? null,
      email: params.contact.email ?? null,
      linkedinUrl: params.contact.linkedinUrl ?? null,
      linkedinConnected: params.contact.linkedinConnected ?? null,
      companyId: params.contact.companyId ?? null,
      sequencePosition: params.contact.sequencePosition ?? null,
      lastTouchAt: params.contact.lastTouchAt ?? null,
      nextTouchDueAt: params.contact.nextTouchDueAt ?? null,
      deadAt: params.contact.deadAt ?? null,
      reEngageAt: params.contact.reEngageAt ?? null,
      abVariable: params.contact.abVariable ?? null,
      abVariant: params.contact.abVariant ?? null,
      abReplied: params.contact.abReplied ?? null,
      status: params.contact.status ?? null,
      draftBody: params.contact.draftBody ?? null,
      draftSubject: params.contact.draftSubject ?? null,
      personalizationNotes: params.contact.personalizationNotes ?? null,
      manualPersonalizationNotes: params.contact.manualPersonalizationNotes ?? null,
      reengagementRecommendation: params.contact.reengagementRecommendation ?? null,
      source: params.contact.source ?? null,
      notes: params.contact.notes ?? null,
      failedAt: params.contact.failedAt ?? null,
      retryCount: params.contact.retryCount ?? null,
      companyName: null,
      companyFitBand: null,
      updatedAt: null,
    });
  }

  async deleteContact(params: { userId: string; id: number }) {
    return await this.dal.deleteContact({ createdBy: params.userId, id: params.id });
  }

  async bulkDeleteContacts(params: Schemas.BulkDeleteContactsApiRequest & { userId: string }) {
    return await this.dal.bulkDeleteContacts({ ids: params.ids, createdBy: params.userId });
  }

  async bulkUpdateContacts(params: Schemas.BulkUpdateContactsApiRequest & { userId: string }) {
    return await this.dal.bulkUpdateContacts({
      ids: params.ids,
      createdBy: params.userId,
      updates: params.updates,
    });
  }

  async getContactHistory(params: { userId: string; contactId: number }) {
    return await this.dal.getContactHistory({
      createdBy: params.userId,
      contactId: params.contactId,
    });
  }

  async createContactHistory(
    params: Schemas.CreateContactHistoryApiRequest & { userId: string; contactId: number },
  ) {
    // Spread first — createdBy/contactId must come from auth + URL, never the request body.
    return await this.dal.createContactHistory({
      ...params.history,
      createdBy: params.userId,
      contactId: params.contactId,
    });
  }

  async logContactHistory(
    params: Schemas.LogContactHistoryApiRequest & { userId: string; contactId: number },
  ) {
    const response = await this.dal.createContactHistory({
      createdBy: params.userId,
      contactId: params.contactId,
      type: Schemas.buildContactHistoryType(params.channel, params.direction),
      channel: params.channel,
      body: params.body,
      sentAt: params.sentAt,
      subject: params.subject ?? null,
    });

    if (response.isSuccess && params.direction === Schemas.ContactHistoryDirectionEnum.Me) {
      await this.resyncFollowUp({ userId: params.userId, contactId: params.contactId });
    }

    return response;
  }

  async updateContactHistory(
    params: Schemas.UpdateContactHistoryApiRequest & {
      userId: string;
      historyId: number;
      contactId: number;
    },
  ) {
    const response = await this.dal.updateContactHistory({
      id: params.historyId,
      createdBy: params.userId,
      body: params.body,
      sentAt: params.sentAt,
      subject: params.subject,
    });

    // sentAt is editable, so the follow-up schedule may no longer be derived from the latest sent message.
    if (response.isSuccess) {
      await this.resyncFollowUp({ userId: params.userId, contactId: params.contactId });
    }

    return response;
  }

  async deleteContactHistory(params: { userId: string; historyId: number; contactId: number }) {
    const response = await this.dal.deleteContactHistory({
      id: params.historyId,
      contactId: params.contactId,
      createdBy: params.userId,
    });

    if (response.isSuccess) {
      await this.resyncFollowUp({ userId: params.userId, contactId: params.contactId });
    }

    return response;
  }

  /**
   * Recomputes the contact's follow-up state from the latest remaining sent message — the single
   * sync mechanism invoked after every history mutation (create, update, delete).
   * The task row is written first; nextTouchDueAt follows only on success so the two never diverge.
   */
  private async resyncFollowUp(params: { userId: string; contactId: number }) {
    const lastSentResponse = await this.dal.getLastSentHistory({
      contactId: params.contactId,
      createdBy: params.userId,
    });

    // A failed read must not be mistaken for "no sent messages" — bail without touching follow-up state.
    if (!lastSentResponse.isSuccess) return;

    const tasksRepo = new TasksRepo(this.env);

    if (lastSentResponse.lastSentAt) {
      const dueAt = Utility.getDateKey(
        new Date(
          Date.parse(lastSentResponse.lastSentAt) +
            Constants.TASK_FOLLOWUP_INTERVAL_DAYS * 86_400_000,
        ),
      );

      const syncResponse = await tasksRepo.syncFollowUpForContact({
        userId: params.userId,
        contactId: params.contactId,
        dueAt,
      });
      if (!syncResponse.isSuccess) return;

      await this.dal.updateNextTouchDueAt({
        id: params.contactId,
        createdBy: params.userId,
        nextTouchDueAt: dueAt,
      });
      return;
    }

    const deleteResponse = await tasksRepo.deletePendingFollowUp({
      userId: params.userId,
      contactId: params.contactId,
    });
    if (!deleteResponse.isSuccess) return;

    await this.dal.updateNextTouchDueAt({
      id: params.contactId,
      createdBy: params.userId,
      nextTouchDueAt: null,
    });
  }
}
