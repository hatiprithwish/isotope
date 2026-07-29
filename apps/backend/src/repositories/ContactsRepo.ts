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

  /**
   * Creates each entry independently via createContact and never lets one entry's failure stop
   * the rest — the caller gets a per-tempId success/failure map back. Mirrors bulkLogContactHistory.
   */
  async bulkCreateContacts(
    params: Schemas.BulkCreateContactsApiRequest & { userId: string },
  ): Promise<Schemas.BulkCreateContactsApiResponse> {
    const results: Schemas.BulkCreateContactsResult[] = [];

    for (const entry of params.entries) {
      const { tempId, ...contact } = entry;
      const response = await this.createContact({ contact, userId: params.userId });
      results.push({
        tempId,
        isSuccess: response.isSuccess,
        message: response.message,
        contact: response.contact,
      });
    }

    return {
      // At least one entry must have actually been created — mirrors bulkLogContactHistory, so a
      // batch where every entry failed is never reported as a success.
      isSuccess: results.some((r) => r.isSuccess),
      message: "Bulk contact creation processed",
      results,
    };
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
    const response = await this.dal.bulkUpdateContacts({
      ids: params.ids,
      createdBy: params.userId,
      updates: params.updates,
    });

    if (response.isSuccess) {
      // Only the ids the DAL actually confirmed updated — not the raw request list, which may
      // include ids that matched no row (wrong owner, already deleted, stale client state).
      await this.clearFollowUpTasksIfTerminal({
        userId: params.userId,
        status: params.updates.status,
        contactIds: response.updatedIds ?? [],
        previousStatusById: response.previousStatusById,
      });
    }

    return response;
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
      // Inbound reply — pause the active Pending follow-up for this channel's sequence, if any
      // (no-op if none/already Paused). Email and linkedin sequences pause independently.
      await new TasksRepo(this.env).pauseFollowUpForContact({
        userId: params.userId,
        contactId: params.contactId,
        channel: params.channel,
      });
      return response;
    }

    // direction === Me: outbound message sent. A Paused row existing here means the contact replied
    // since the last resync; the new outbound message supersedes it. This is a genuine new touch,
    // so the prior active row (Pending or Paused) is marked Completed and a fresh Pending row is
    // inserted for the next step. Email and linkedin run independent sequences, so this resyncs
    // only this message's channel.
    await this.resyncFollowUp({
      userId: params.userId,
      contactId: params.contactId,
      channel: params.channel,
      completePriorStep: true,
    });
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
    // Resyncs only the edited message's own channel — email and linkedin sequences are independent.
    // Not a new touch, so completePriorStep=false: only the due date moves, no row is completed.
    if (response.isSuccess && response.history) {
      await this.resyncFollowUp({
        userId: params.userId,
        contactId: params.contactId,
        channel: response.history.channel,
        completePriorStep: false,
      });
    }

    return response;
  }

  /**
   * Soft-deletes only — the row is hidden immediately (filtered from every read query) but kept
   * for a 15 min undo window. Queues the real deletion via ISOTOPE_QUEUE with a 900s delay;
   * follow-up resync and the InPipeline status revert are deferred until that hard-delete
   * actually happens (see hardDeleteContactHistory), so undo requires no reverse side effects.
   */
  async deleteContactHistory(params: { userId: string; historyId: number; contactId: number }) {
    const response = await this.dal.deleteContactHistory({
      id: params.historyId,
      contactId: params.contactId,
      createdBy: params.userId,
    });

    if (response.isSuccess) {
      await this.env.ISOTOPE_QUEUE.send(
        {
          type: "HardDeleteContactHistory" as const,
          historyId: params.historyId,
          contactId: params.contactId,
          userId: params.userId,
        },
        { delaySeconds: Constants.CONTACT_HISTORY_UNDO_WINDOW_SECONDS },
      );
    }

    return response;
  }

  /** Undo — clears deletedAt within the 15 min window. The queued hard-delete message still fires but no-ops once restored. */
  async restoreContactHistory(params: { userId: string; historyId: number; contactId: number }) {
    return await this.dal.restoreContactHistory({
      id: params.historyId,
      contactId: params.contactId,
      createdBy: params.userId,
    });
  }

  /**
   * Invoked only by the queued message ~15 min after soft-delete (see deleteContactHistory).
   * Performs the real DELETE, then runs the resync/status-revert side effects that used to fire
   * immediately on delete — deferred here so an undo within the window never needs to reverse them.
   * A false isSuccess means the row was already restored or already hard-deleted by a prior
   * delivery — treated as a no-op, no side effects run.
   */
  async hardDeleteContactHistory(params: { userId: string; historyId: number; contactId: number }) {
    const response = await this.dal.hardDeleteContactHistory({
      id: params.historyId,
      contactId: params.contactId,
      createdBy: params.userId,
    });

    if (response.isSuccess && response.channel) {
      // Not a new touch, so completePriorStep=false: only the due date moves, no row is completed.
      await this.resyncFollowUp({
        userId: params.userId,
        contactId: params.contactId,
        channel: response.channel,
        completePriorStep: false,
      });

      // Hard-deleting the last remaining LIVE message reverts the auto-bump from logContactHistory —
      // only if status is still InPipeline (untouched since), never a further/manual status.
      // getContactHistory intentionally also returns soft-deleted (tombstoned) rows for the undo
      // UI, so "no messages left" must filter those out rather than checking length === 0 directly.
      const historyResponse = await this.dal.getContactHistory({
        contactId: params.contactId,
        createdBy: params.userId,
      });
      const existing = await this.dal.getContactDetails({
        id: params.contactId,
        createdBy: params.userId,
      });
      const hasLiveHistory = historyResponse.history?.some((h) => h.deletedAt == null) ?? true;
      if (
        historyResponse.isSuccess &&
        !hasLiveHistory &&
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
   * Recomputes the contact's follow-up state, for one channel, from that channel's latest remaining
   * sent message and the user's configured step offsets — the single "advance to next step"
   * mechanism invoked after every history mutation (create-outbound, update, delete) on that channel.
   * Email and linkedin each run their own independent sequence/task, so this only ever touches the
   * channel of the message that triggered it. Must NOT run as a side effect of an inbound reply —
   * that is the separate pause path in logContactHistory.
   *
   * `completePriorStep` must be true only when called for a genuinely new outbound message (marks
   * the prior active row Completed before advancing); false for a recompute after editing/undoing
   * an existing message's sentAt, where the due date moves but nothing gets marked Completed.
   */
  private async resyncFollowUp(params: {
    userId: string;
    contactId: number;
    channel: Schemas.ContactHistoryChannelEnum;
    completePriorStep: boolean;
  }) {
    // A contact already in a terminal status (Dead/Failed/Closed) has no active sequence to
    // advance — resyncing here would silently recreate the follow-up task that status transition
    // cleared. Checked centrally so every call site (log/update/delete history) is covered.
    const contactResponse = await this.dal.getContactDetails({
      id: params.contactId,
      createdBy: params.userId,
    });
    if (
      contactResponse.contact?.status != null &&
      Schemas.CONTACT_TERMINAL_STATUSES.includes(contactResponse.contact.status)
    ) {
      return;
    }

    const lastSentResponse = await this.dal.getLastSentHistory({
      contactId: params.contactId,
      createdBy: params.userId,
      channel: params.channel,
    });

    // A failed read must not be mistaken for "no sent messages" — bail without touching follow-up state.
    if (!lastSentResponse.isSuccess) return;

    const tasksRepo = new TasksRepo(this.env);

    // No sent messages left on this channel (e.g. the last one was deleted) — clear this channel's follow-up task.
    if (!lastSentResponse.lastSentAt) {
      await tasksRepo.deleteFollowUpTasks({
        userId: params.userId,
        contactId: params.contactId,
        channel: params.channel,
      });
      return;
    }

    // Resolve the user's configured offsets (global-for-now, shared across channels; contact-level override slot reserved in FollowUpSettingsRepo).
    const settingsRepo = new FollowUpSettingsRepo(this.env);
    const settingsResponse = await settingsRepo.getSettingsDetails({ userId: params.userId });
    if (!settingsResponse.isSuccess) return;
    const offsetDays =
      settingsResponse.settings?.stepOffsetDays ??
      Constants.FOLLOWUP_SETTINGS_DEFAULTS.stepOffsetDays;

    // How many outbound messages have actually been sent so far on this channel == latest Touch N for this channel.
    const sentCountResponse = await this.dal.getSentMessageCount({
      contactId: params.contactId,
      createdBy: params.userId,
      channel: params.channel,
    });
    if (!sentCountResponse.isSuccess) return;
    const sentCount = sentCountResponse.count ?? 0; // defensive; lastSentAt truthy above implies >= 1

    // stepNumber of the NEXT follow-up to schedule = sentCount (1-based; see plan §0 derivation).
    const stepNumber = sentCount;

    // Sequence complete — no more offsets configured for this step.
    if (stepNumber > offsetDays.length) {
      if (params.completePriorStep) {
        // This outbound message was the final configured touch — mark the active row Completed
        // rather than deleting it, so the finished sequence is still visible in Past tasks.
        await tasksRepo.completeActiveFollowUp({
          userId: params.userId,
          contactId: params.contactId,
          channel: params.channel,
        });
      } else {
        // A recompute (edit/undo) that no longer has enough steps to justify an active task —
        // no real completion happened, so just clear the dangling row.
        await tasksRepo.deleteFollowUpTasks({
          userId: params.userId,
          contactId: params.contactId,
          channel: params.channel,
        });
      }
      return;
    }

    // Due date: lastSentAt (actual send date of the most recent outbound message on this channel) + offset[stepNumber-1].
    const dueAt = Utility.getDateKey(
      new Date(Date.parse(lastSentResponse.lastSentAt) + offsetDays[stepNumber - 1] * 86_400_000),
    );

    await tasksRepo.syncFollowUpForContact({
      userId: params.userId,
      contactId: params.contactId,
      channel: params.channel,
      dueAt,
      stepNumber,
      completePriorStep: params.completePriorStep,
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
      name: contact.name.trim().split(/\s+/)[0] ?? contact.name,
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
   * Single owner of the "terminal status → clear follow-up tasks" rule — called from both
   * updateContact and bulkUpdateContacts so the two paths can never drift out of sync.
   * No-ops if the new status isn't terminal or contactIds is empty. Each id whose
   * previousStatusById entry was already terminal is skipped too — re-saving an
   * already-Dead/Failed/Closed contact has no follow-up tasks left to clear.
   */
  private async clearFollowUpTasksIfTerminal(params: {
    userId: string;
    status: Schemas.ContactStatusIntEnum | null | undefined;
    contactIds: number[];
    previousStatusById?: Record<number, Schemas.ContactStatusIntEnum>;
  }) {
    if (params.status == null || !Schemas.CONTACT_TERMINAL_STATUSES.includes(params.status)) return;

    const targetIds = params.previousStatusById
      ? params.contactIds.filter((id) => {
          const previous = params.previousStatusById?.[id];
          return previous == null || !Schemas.CONTACT_TERMINAL_STATUSES.includes(previous);
        })
      : params.contactIds;
    if (targetIds.length === 0) return;

    const tasksRepo = new TasksRepo(this.env);
    // Sequential, not Promise.all — bulk requests are capped at BULK_CONTACT_IDS_MAX_ENTRIES but
    // this avoids fanning out unbounded concurrent DELETEs to D1 regardless of caller.
    // No channel = clears the follow-up task on every channel (email and linkedin sequences alike).
    for (const contactId of targetIds) {
      await tasksRepo.deleteFollowUpTasks({ userId: params.userId, contactId });
    }
  }

  /**
   * Deletes any active Pending/Paused follow-up task the moment the contact transitions into a
   * terminal status (Dead, Failed, Closed), and auto-stamps deadAt on the Dead transition specifically
   * (never trusted from the client as-is — see plan §8a).
   */
  async updateContact(params: Schemas.UpdateContactApiRequest & { userId: string; id: number }) {
    let deadAt = params.contact.deadAt ?? null;

    // Fetched once up front whenever the incoming status is terminal — feeds both the deadAt
    // stamping below (Dead only) and the previous-status check before clearing follow-up tasks.
    const newStatus = params.contact.status;
    const existing =
      newStatus != null && Schemas.CONTACT_TERMINAL_STATUSES.includes(newStatus)
        ? await this.dal.getContactDetails({ id: params.id, createdBy: params.userId })
        : null;
    const previousStatus = existing?.contact?.status;

    if (newStatus === Schemas.ContactStatusIntEnum.Dead && deadAt === null) {
      const wasAlreadyDead = previousStatus === Schemas.ContactStatusIntEnum.Dead;
      deadAt = wasAlreadyDead
        ? (existing?.contact?.deadAt ?? null)
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

    if (response.isSuccess) {
      await this.clearFollowUpTasksIfTerminal({
        userId: params.userId,
        status: newStatus,
        contactIds: [params.id],
        previousStatusById: previousStatus != null ? { [params.id]: previousStatus } : undefined,
      });
    }

    return response;
  }
}
