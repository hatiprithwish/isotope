import ContactsDAL from "@/data-access-layer/ContactsDAL";
import TasksRepo from "@/repositories/TasksRepo";
import FollowUpSettingsRepo from "@/repositories/FollowUpSettingsRepo";
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

    if (!response.isSuccess) return response;

    if (params.direction === Schemas.ContactHistoryDirectionEnum.Contact) {
      // Inbound reply — pause the active Pending follow-up, if any (no-op if none/already Paused).
      await new TasksRepo(this.env).pauseFollowUpForContact({
        userId: params.userId,
        contactId: params.contactId,
      });
      return response;
    }

    // direction === Me: outbound message sent. A Paused row existing here means the contact replied
    // since the last resync; the new outbound message supersedes it. resyncFollowUp's UPDATE-not-INSERT
    // semantics (widened to match Paused rows too, see TasksDAL.syncFollowUpForContact) unconditionally
    // advance it to Pending + the newly computed dueAt + stepNumber, naturally clearing Paused state.
    await this.resyncFollowUp({ userId: params.userId, contactId: params.contactId });
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
   * Recomputes the contact's follow-up state from the latest remaining sent message and the user's
   * configured step offsets — the single "advance to next step" mechanism invoked after every history
   * mutation (create-outbound, update, delete). The task row is written first; nextTouchDueAt follows
   * only on success so the two never diverge. Must NOT run as a side effect of an inbound reply —
   * that is the separate pause path in logContactHistory.
   */
  private async resyncFollowUp(params: { userId: string; contactId: number }) {
    const lastSentResponse = await this.dal.getLastSentHistory({
      contactId: params.contactId,
      createdBy: params.userId,
    });

    // A failed read must not be mistaken for "no sent messages" — bail without touching follow-up state.
    if (!lastSentResponse.isSuccess) return;

    const tasksRepo = new TasksRepo(this.env);

    // No sent messages left at all (e.g. the last one was deleted) — clear any follow-up task/state entirely.
    if (!lastSentResponse.lastSentAt) {
      const deleteResponse = await tasksRepo.deleteFollowUpTasks({
        userId: params.userId,
        contactId: params.contactId,
      });
      if (!deleteResponse.isSuccess) return;

      await this.dal.updateNextTouchDueAt({
        id: params.contactId,
        createdBy: params.userId,
        nextTouchDueAt: null,
      });
      return;
    }

    // Resolve the user's configured offsets (global-for-now; contact-level override slot reserved in FollowUpSettingsRepo).
    const settingsRepo = new FollowUpSettingsRepo(this.env);
    const settingsResponse = await settingsRepo.getSettingsDetails({ userId: params.userId });
    if (!settingsResponse.isSuccess) return;
    const offsetDays =
      settingsResponse.settings?.stepOffsetDays ??
      Constants.FOLLOWUP_SETTINGS_DEFAULTS.stepOffsetDays;

    // How many outbound messages have actually been sent so far == latest Touch N.
    const sentCountResponse = await this.dal.getSentMessageCount({
      contactId: params.contactId,
      createdBy: params.userId,
    });
    if (!sentCountResponse.isSuccess) return;
    const sentCount = sentCountResponse.count ?? 0; // defensive; lastSentAt truthy above implies >= 1

    // stepNumber of the NEXT follow-up to schedule = sentCount (1-based; see plan §0 derivation).
    const stepNumber = sentCount;

    // Sequence complete — no more offsets configured for this step. Clear any dangling task.
    if (stepNumber > offsetDays.length) {
      const deleteResponse = await tasksRepo.deleteFollowUpTasks({
        userId: params.userId,
        contactId: params.contactId,
      });
      if (!deleteResponse.isSuccess) return;

      await this.dal.updateNextTouchDueAt({
        id: params.contactId,
        createdBy: params.userId,
        nextTouchDueAt: null,
      });
      return;
    }

    // Due date: lastSentAt (actual send date of the most recent outbound message) + offset[stepNumber-1].
    const dueAt = Utility.getDateKey(
      new Date(Date.parse(lastSentResponse.lastSentAt) + offsetDays[stepNumber - 1] * 86_400_000),
    );

    const syncResponse = await tasksRepo.syncFollowUpForContact({
      userId: params.userId,
      contactId: params.contactId,
      dueAt,
      stepNumber,
    });
    if (!syncResponse.isSuccess) return;

    await this.dal.updateNextTouchDueAt({
      id: params.contactId,
      createdBy: params.userId,
      nextTouchDueAt: dueAt,
    });
  }

  /**
   * Deletes any active Pending/Paused follow-up task the moment the contact transitions into Dead,
   * and auto-stamps deadAt on that same transition (never trusted from the client as-is — see plan §8a).
   */
  async updateContact(params: Schemas.UpdateContactApiRequest & { userId: string; id: number }) {
    let deadAt = params.contact.deadAt ?? null;

    if (params.contact.status === Schemas.ContactStatusIntEnum.Dead && deadAt === null) {
      const existing = await this.dal.getContactDetails({
        id: params.id,
        createdBy: params.userId,
      });
      const wasAlreadyDead = existing.contact?.status === Schemas.ContactStatusIntEnum.Dead;
      deadAt = wasAlreadyDead
        ? (existing.contact?.deadAt ?? null)
        : Utility.getCurrentISOTimestamp();
    }

    const response = await this.dal.updateContact({
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
      deadAt,
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

    if (response.isSuccess && params.contact.status === Schemas.ContactStatusIntEnum.Dead) {
      await new TasksRepo(this.env).deleteFollowUpTasks({
        userId: params.userId,
        contactId: params.id,
      });
    }

    return response;
  }
}
