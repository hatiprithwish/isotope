import ContactsDAL from "@/data-access-layer/ContactsDAL";
import TasksRepo from "@/repositories/TasksRepo";
import FollowUpSettingsRepo from "@/repositories/FollowUpSettingsRepo";
import MessageTemplateRepo from "@/repositories/MessageTemplateRepo";
import RoleTypesRepo from "@/repositories/RoleTypesRepo";
import JobsRepo from "@/repositories/JobsRepo";
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

  async checkDuplicateContact(
    params: Schemas.CheckDuplicateContactApiRequest & { userId: string },
  ) {
    const response: Schemas.CheckDuplicateContactApiResponse = { isSuccess: false };

    const normalizedEmail = this.normalizeEmail(params.email);
    const normalizedLinkedinUrl = this.normalizeLinkedinUrl(params.linkedinUrl);
    const linkedinSlug = this.extractLinkedinSlug(params.linkedinUrl);

    const candidatesResponse = await this.dal.findDuplicateContactCandidates({
      createdBy: params.userId,
      normalizedEmail,
      linkedinSlug,
      excludeId: params.excludeId,
    });

    if (!candidatesResponse.isSuccess) {
      response.message = candidatesResponse.message;
      return response;
    }

    const candidates = candidatesResponse.candidates ?? [];

    // Email is stored/compared exactly (no format ambiguity) — the DAL already filtered on it,
    // so any candidate whose stored email matches is a confirmed duplicate on that basis alone.
    const emailMatch = normalizedEmail
      ? candidates.find((c) => this.normalizeEmail(c.email) === normalizedEmail)
      : undefined;

    // LinkedIn URLs vary in format (protocol/www/trailing-slash/query), so the LIKE-narrowed
    // candidates must be re-verified by comparing normalized slugs, not raw stored strings.
    const linkedinMatch = normalizedLinkedinUrl
      ? candidates.find((c) => this.normalizeLinkedinUrl(c.linkedinUrl) === normalizedLinkedinUrl)
      : undefined;

    response.isSuccess = true;
    const match = emailMatch ?? linkedinMatch ?? null;
    response.message = match ? "Duplicate contact found" : "No duplicate contact found";
    response.match = match;
    return response;
  }

  private normalizeEmail(email: string | null | undefined): string | null {
    const trimmed = email?.trim().toLowerCase();
    return trimmed || null;
  }

  private extractLinkedinSlug(linkedinUrl: string | null | undefined): string | null {
    const slugMatch = linkedinUrl?.trim().match(/linkedin\.com\/in\/([^/?#]+)/i);
    return slugMatch?.[1]?.toLowerCase() ?? null;
  }

  private normalizeLinkedinUrl(linkedinUrl: string | null | undefined): string | null {
    const trimmed = linkedinUrl?.trim().toLowerCase();
    if (!trimmed) return null;

    // Reduce to the profile slug so protocol/www/trailing-slash/query variants of the
    // same profile all compare equal (e.g. "linkedin.com/in/x" vs "https://www.linkedin.com/in/x/").
    const slug = this.extractLinkedinSlug(trimmed);
    if (slug) return `linkedin.com/in/${slug}`;

    // Not a recognizable /in/ profile URL (e.g. a company page) — still strip protocol/www/query/
    // trailing-slash so equivalent URLs compare equal, same as the profile-slug path above.
    return (
      trimmed
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split(/[?#]/)[0]
        .replace(/\/+$/, "") || null
    );
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

    // First message ever logged on a fresh contact moves it out of NotStarted, regardless of direction.
    const existing = await this.dal.getContactDetails({
      id: params.contactId,
      createdBy: params.userId,
    });
    if (existing.contact?.status === Schemas.ContactStatusIntEnum.NotStarted) {
      await this.dal.updateContactStatus({
        id: params.contactId,
        createdBy: params.userId,
        status: Schemas.ContactStatusIntEnum.InPipeline,
      });
    }

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

  /**
   * Logs each entry independently via logContactHistory (so every entry gets the same
   * NotStarted->InPipeline bump, pause/resync side effects as a single log) and never lets one
   * entry's failure stop the rest — the caller gets a per-contact success/failure map back.
   */
  async bulkLogContactHistory(
    params: Schemas.BulkLogContactHistoryApiRequest & { userId: string },
  ): Promise<Schemas.BulkLogContactHistoryApiResponse> {
    const results: Schemas.BulkLogContactHistoryResult[] = [];

    for (const entry of params.entries) {
      const { contactId, ...history } = entry;
      const response = await this.logContactHistory({
        ...history,
        userId: params.userId,
        contactId,
      });
      results.push({
        contactId,
        isSuccess: response.isSuccess,
        message: response.message,
      });
    }

    return {
      // At least one entry must have actually been logged — mirrors how the route maps this to
      // a 201/500 status, so a batch where every entry failed is never reported as a success.
      isSuccess: results.some((r) => r.isSuccess),
      message: "Bulk history log processed",
      results,
    };
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

      // Deleting the last remaining message reverts the auto-bump from logContactHistory —
      // only if status is still InPipeline (untouched since), never a further/manual status.
      const historyResponse = await this.dal.getContactHistory({
        contactId: params.contactId,
        createdBy: params.userId,
      });
      const existing = await this.dal.getContactDetails({
        id: params.contactId,
        createdBy: params.userId,
      });
      if (
        historyResponse.isSuccess &&
        historyResponse.history?.length === 0 &&
        existing.contact?.status === Schemas.ContactStatusIntEnum.InPipeline
      ) {
        await this.dal.updateContactStatus({
          id: params.contactId,
          createdBy: params.userId,
          status: Schemas.ContactStatusIntEnum.NotStarted,
        });
      }
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
   * Resolves which message template applies to a contact right now, and renders it with
   * [Name]/[Company] substituted. step 0 = no outbound message sent yet; step N = the Nth
   * follow-up (mirrors resyncFollowUp's own step derivation via getSentMessageCount, so the
   * template step always matches the step the follow-up scheduler would compute — not
   * necessarily the live task's stepNumber, since sequence-complete contacts have no task left
   * but should still resolve to "no more templates" rather than silently reusing the last one).
   * Only step 0 has variants (role-type based); step >= 1 always resolves the single body
   * saved for that step, regardless of role type.
   */
  async resolveMessageTemplate(params: {
    userId: string;
    contactId: number;
  }): Promise<Schemas.ResolveMessageTemplateApiResponse> {
    const response: Schemas.ResolveMessageTemplateApiResponse = { isSuccess: false };

    const contactResponse = await this.dal.getContactDetails({
      id: params.contactId,
      createdBy: params.userId,
    });
    if (!contactResponse.isSuccess || !contactResponse.contact) {
      response.message = contactResponse.message ?? "Contact not found";
      return response;
    }
    const contact = contactResponse.contact;

    const sentCountResponse = await this.dal.getSentMessageCount({
      contactId: params.contactId,
      createdBy: params.userId,
    });
    if (!sentCountResponse.isSuccess) {
      response.message = sentCountResponse.message ?? "Failed to resolve message count";
      return response;
    }
    const step = sentCountResponse.count ?? 0;

    const messageTemplateRepo = new MessageTemplateRepo(this.env);

    let variantLabel: string | null = null;
    let isAmbiguousMatch = false;

    if (step === 0 && contact.companyId != null) {
      const roleTypesResponse = await new RoleTypesRepo(this.env).getRoleTypesDetails({
        userId: params.userId,
      });
      const defaultLabel = roleTypesResponse.roleTypes?.defaultLabel ?? null;

      const jobsResponse = await new JobsRepo(this.env).getJobsByCompany({
        userId: params.userId,
        companyId: contact.companyId,
      });
      const distinctRoleTypes = [
        ...new Set(
          (jobsResponse.jobs ?? []).map((j) => j.roleType).filter((v): v is string => !!v),
        ),
      ];

      if (distinctRoleTypes.length === 1) {
        variantLabel = distinctRoleTypes[0];
      } else {
        variantLabel = defaultLabel;
        isAmbiguousMatch = distinctRoleTypes.length > 1;
      }
    }

    const template = await messageTemplateRepo.findTemplate({
      userId: params.userId,
      step,
      variantLabel,
    });

    if (!template) {
      response.isSuccess = true;
      response.step = step;
      response.variantLabel = variantLabel;
      response.message = "No template configured for this step";
      return response;
    }

    response.isSuccess = true;
    response.step = step;
    response.variantLabel = variantLabel;
    response.isAmbiguousMatch = isAmbiguousMatch;
    response.renderedBody = Schemas.renderTemplate(template.body, {
      name: contact.name,
      company: contact.companyName ?? null,
    });
    response.message = "Log template resolved successfully";
    return response;
  }

  /**
   * Resolves each contact's template independently via resolveMessageTemplate, so one contact
   * with no company/template configured doesn't block the rest of the batch.
   */
  async resolveMessageTemplatesBulk(params: {
    userId: string;
    contactIds: number[];
  }): Promise<Schemas.ResolveMessageTemplatesBulkApiResponse> {
    const results: Schemas.ResolveMessageTemplatesBulkResult[] = [];

    for (const contactId of params.contactIds) {
      const response = await this.resolveMessageTemplate({ userId: params.userId, contactId });
      results.push({
        contactId,
        // resolveMessageTemplate's isSuccess is a real failure signal (contact not found, DAL
        // error) — "no template configured" is isSuccess: true with no renderedBody — so this
        // must be preserved per-contact, not collapsed away, or a lookup failure becomes
        // indistinguishable from "nothing configured".
        isSuccess: response.isSuccess,
        message: response.message,
        step: response.step,
        variantLabel: response.variantLabel,
        renderedBody: response.renderedBody,
        isAmbiguousMatch: response.isAmbiguousMatch,
      });
    }

    return {
      // At least one contact must have actually resolved — mirrors bulkLogContactHistory, so a
      // batch where every lookup failed is never reported as a success.
      isSuccess: results.some((r) => r.isSuccess),
      message: "Bulk message templates resolved",
      results,
    };
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
