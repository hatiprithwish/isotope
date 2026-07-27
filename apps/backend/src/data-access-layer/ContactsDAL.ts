import type { SQL } from "drizzle-orm";
import { and, count, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { contacts, contactHistory, companies } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";
import Utility from "@/utils";

const contactStatusLabelExpr = sql<Schemas.ContactStatusLabelEnum>`CASE
  WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.NotStarted} THEN ${Schemas.ContactStatusLabelEnum.NotStarted}
  WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.DraftReady} THEN ${Schemas.ContactStatusLabelEnum.DraftReady}
  WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.InPipeline} THEN ${Schemas.ContactStatusLabelEnum.InPipeline}
  WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.Replied} THEN ${Schemas.ContactStatusLabelEnum.Replied}
  WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.Closed} THEN ${Schemas.ContactStatusLabelEnum.Closed}
  WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.Dead} THEN ${Schemas.ContactStatusLabelEnum.Dead}
  WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.ReEngage} THEN ${Schemas.ContactStatusLabelEnum.ReEngage}
  WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.Failed} THEN ${Schemas.ContactStatusLabelEnum.Failed}
  ELSE ${Schemas.ContactStatusLabelEnum.NotStarted}
END`;

export default class ContactsDAL {
  private db: DrizzleD1Database;

  constructor(env: Env) {
    this.db = getDbClient(env);
  }

  async createContact(params: Schemas.CreateContactDALRequest) {
    const response: Schemas.CreateContactApiResponse = { isSuccess: false };

    try {
      const created = await this.db
        .insert(contacts)
        .values({
          createdBy: params.createdBy,
          companyId: params.companyId,
          name: params.name,
          designation: params.designation ?? null,
          email: params.email ?? null,
          linkedinUrl: params.linkedinUrl ?? null,
          linkedinConnected: params.linkedinConnected ?? null,
          sequencePosition: params.sequencePosition ?? null,
          lastTouchAt: params.lastTouchAt ?? null,
          nextTouchDueAt: params.nextTouchDueAt ?? null,
          deadAt: params.deadAt ?? null,
          reEngageAt: params.reEngageAt ?? null,
          abVariable: params.abVariable ?? null,
          abVariant: params.abVariant ?? null,
          abReplied: params.abReplied ?? null,
          status: params.status,
          draftBody: params.draftBody ?? null,
          draftSubject: params.draftSubject ?? null,
          personalizationNotes: params.personalizationNotes ?? null,
          manualPersonalizationNotes: params.manualPersonalizationNotes ?? null,
          reengagementRecommendation: params.reengagementRecommendation ?? null,
          source: params.source ?? null,
          notes: params.notes ?? null,
          failedAt: params.failedAt ?? null,
          retryCount: params.retryCount ?? null,
          createdAt: Utility.getCurrentISOTimestamp(),
          updatedAt: null,
        })
        .returning({ id: contacts.id })
        .get();

      const detailResponse = await this.getContactDetails({
        id: created.id,
        createdBy: params.createdBy,
      });

      if (detailResponse.contact) {
        response.isSuccess = true;
        response.message = "Contact created successfully";
        response.contact = detailResponse.contact;
      }
    } catch (error) {
      const message = "Unknown error in creating contact";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.CreateContact,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  /**
   * Returns candidate contacts that might match on email or LinkedIn URL — broad on purpose.
   * linkedin_url is stored as pasted (protocol/www/trailing-slash/query all vary), so an exact
   * DB-side comparison would miss same-profile URLs in a different format; the caller
   * (ContactsRepo) re-normalizes each candidate's raw linkedinUrl and picks the true match.
   */
  async findDuplicateContactCandidates(params: Schemas.FindDuplicateContactDALRequest) {
    const response: Schemas.FindDuplicateContactCandidatesDALResponse = { isSuccess: false };

    try {
      const matchConditions: SQL[] = [];
      if (params.normalizedEmail) {
        matchConditions.push(sql`lower(trim(${contacts.email})) = ${params.normalizedEmail}`);
      }
      if (params.linkedinSlug) {
        const pattern = `%${Utility.escapeLikePattern(params.linkedinSlug)}%`;
        matchConditions.push(sql`${contacts.linkedinUrl} LIKE ${pattern} ESCAPE '\\'`);
      }

      if (matchConditions.length === 0) {
        response.isSuccess = true;
        response.message = "No identifiers provided";
        response.candidates = [];
        return response;
      }

      const conditions: SQL[] = [
        eq(contacts.createdBy, params.createdBy),
        or(...matchConditions) as SQL,
      ];
      if (params.excludeId != null) {
        conditions.push(ne(contacts.id, params.excludeId));
      }

      const candidates = await this.db
        .select({
          id: contacts.id,
          name: contacts.name,
          designation: contacts.designation,
          email: contacts.email,
          linkedinUrl: contacts.linkedinUrl,
          linkedinConnected: contacts.linkedinConnected,
          companyId: contacts.companyId,
          sequencePosition: contacts.sequencePosition,
          lastTouchAt: contacts.lastTouchAt,
          nextTouchDueAt: contacts.nextTouchDueAt,
          deadAt: contacts.deadAt,
          reEngageAt: contacts.reEngageAt,
          abVariable: contacts.abVariable,
          abVariant: contacts.abVariant,
          abReplied: contacts.abReplied,
          status: contacts.status,
          statusLabel: contactStatusLabelExpr,
          draftBody: contacts.draftBody,
          draftSubject: contacts.draftSubject,
          personalizationNotes: contacts.personalizationNotes,
          manualPersonalizationNotes: contacts.manualPersonalizationNotes,
          reengagementRecommendation: contacts.reengagementRecommendation,
          source: contacts.source,
          notes: contacts.notes,
          failedAt: contacts.failedAt,
          retryCount: contacts.retryCount,
          createdBy: contacts.createdBy,
          companyName: companies.name,
          companyFitBand: companies.fitBand,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt,
        })
        .from(contacts)
        .leftJoin(companies, eq(contacts.companyId, companies.id))
        .where(and(...conditions))
        .limit(10);

      response.isSuccess = true;
      response.message = "Candidates fetched successfully";
      response.candidates = candidates;
    } catch (error) {
      const message = "Unknown error in fetching duplicate contact candidates";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.CheckDuplicateContact,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getContactDetails(params: Schemas.FindContactDALRequest) {
    const response: Schemas.GetContactApiResponse = { isSuccess: false };

    try {
      const conditions: SQL[] = [
        eq(contacts.id, params.id),
        eq(contacts.createdBy, params.createdBy),
      ];

      const [contact] = await this.db
        .select({
          id: contacts.id,
          name: contacts.name,
          designation: contacts.designation,
          email: contacts.email,
          linkedinUrl: contacts.linkedinUrl,
          linkedinConnected: contacts.linkedinConnected,
          companyId: contacts.companyId,
          sequencePosition: contacts.sequencePosition,
          lastTouchAt: contacts.lastTouchAt,
          nextTouchDueAt: contacts.nextTouchDueAt,
          deadAt: contacts.deadAt,
          reEngageAt: contacts.reEngageAt,
          abVariable: contacts.abVariable,
          abVariant: contacts.abVariant,
          abReplied: contacts.abReplied,
          status: contacts.status,
          statusLabel: contactStatusLabelExpr,
          draftBody: contacts.draftBody,
          draftSubject: contacts.draftSubject,
          personalizationNotes: contacts.personalizationNotes,
          manualPersonalizationNotes: contacts.manualPersonalizationNotes,
          reengagementRecommendation: contacts.reengagementRecommendation,
          source: contacts.source,
          notes: contacts.notes,
          failedAt: contacts.failedAt,
          retryCount: contacts.retryCount,
          createdBy: contacts.createdBy,
          companyName: companies.name,
          companyFitBand: companies.fitBand,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt,
        })
        .from(contacts)
        .leftJoin(companies, eq(contacts.companyId, companies.id))
        .where(and(...conditions))
        .limit(1);

      if (!contact) {
        const message = "Contact not found";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.GetContactDetails,
          message,
          metadata: params,
        });
        response.message = message;
        return response;
      }

      response.isSuccess = true;
      response.message = "Contact fetched successfully";
      response.contact = contact;
    } catch (error) {
      const message = "Unknown error in fetching contact";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetContactDetails,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getContacts(params: Schemas.GetContactsDALRequest) {
    const response: Schemas.GetContactsApiResponse = { isSuccess: false };

    try {
      const term = params.search?.trim();
      const pattern = term ? `%${Utility.escapeLikePattern(term)}%` : undefined;

      const whereClause = pattern
        ? and(
            eq(contacts.createdBy, params.createdBy),
            or(
              sql`${contacts.name} LIKE ${pattern} ESCAPE '\\'`,
              sql`${contacts.email} LIKE ${pattern} ESCAPE '\\'`,
              sql`${contacts.designation} LIKE ${pattern} ESCAPE '\\'`,
              sql`${companies.name} LIKE ${pattern} ESCAPE '\\'`,
            ),
          )
        : eq(contacts.createdBy, params.createdBy);

      const [countRow] = await this.db
        .select({ count: count() })
        .from(contacts)
        .leftJoin(companies, eq(contacts.companyId, companies.id))
        .where(whereClause);

      const offset = (params.pageNo - 1) * params.pageSize;

      const contactsResponse = await this.db
        .select({
          id: contacts.id,
          name: contacts.name,
          designation: contacts.designation,
          email: contacts.email,
          linkedinUrl: contacts.linkedinUrl,
          linkedinConnected: contacts.linkedinConnected,
          companyId: contacts.companyId,
          sequencePosition: contacts.sequencePosition,
          lastTouchAt: contacts.lastTouchAt,
          nextTouchDueAt: contacts.nextTouchDueAt,
          deadAt: contacts.deadAt,
          reEngageAt: contacts.reEngageAt,
          abVariable: contacts.abVariable,
          abVariant: contacts.abVariant,
          abReplied: contacts.abReplied,
          status: contacts.status,
          statusLabel: contactStatusLabelExpr,
          draftBody: contacts.draftBody,
          draftSubject: contacts.draftSubject,
          personalizationNotes: contacts.personalizationNotes,
          manualPersonalizationNotes: contacts.manualPersonalizationNotes,
          reengagementRecommendation: contacts.reengagementRecommendation,
          source: contacts.source,
          notes: contacts.notes,
          failedAt: contacts.failedAt,
          retryCount: contacts.retryCount,
          createdBy: contacts.createdBy,
          companyName: companies.name,
          companyFitBand: companies.fitBand,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt,
        })
        .from(contacts)
        .leftJoin(companies, eq(contacts.companyId, companies.id))
        .where(whereClause)
        .orderBy(desc(contacts.createdAt))
        .limit(params.pageSize)
        .offset(offset);

      response.isSuccess = true;
      response.message = "Contacts fetched successfully";
      response.contacts = contactsResponse;
      response.totalCount = countRow?.count ?? 0;
    } catch (error) {
      const message = "Unknown error in listing contacts";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.ListContacts,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getContactsByCompany(params: Schemas.GetContactsByCompanyDALRequest) {
    const response: Schemas.GetContactsApiResponse = { isSuccess: false };

    try {
      const contactsResponse = await this.db
        .select({
          id: contacts.id,
          name: contacts.name,
          designation: contacts.designation,
          email: contacts.email,
          linkedinUrl: contacts.linkedinUrl,
          linkedinConnected: contacts.linkedinConnected,
          companyId: contacts.companyId,
          sequencePosition: contacts.sequencePosition,
          lastTouchAt: contacts.lastTouchAt,
          nextTouchDueAt: contacts.nextTouchDueAt,
          deadAt: contacts.deadAt,
          reEngageAt: contacts.reEngageAt,
          abVariable: contacts.abVariable,
          abVariant: contacts.abVariant,
          abReplied: contacts.abReplied,
          status: contacts.status,
          statusLabel: contactStatusLabelExpr,
          draftBody: contacts.draftBody,
          draftSubject: contacts.draftSubject,
          personalizationNotes: contacts.personalizationNotes,
          manualPersonalizationNotes: contacts.manualPersonalizationNotes,
          reengagementRecommendation: contacts.reengagementRecommendation,
          source: contacts.source,
          notes: contacts.notes,
          failedAt: contacts.failedAt,
          retryCount: contacts.retryCount,
          createdBy: contacts.createdBy,
          companyName: companies.name,
          companyFitBand: companies.fitBand,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt,
        })
        .from(contacts)
        .leftJoin(companies, eq(contacts.companyId, companies.id))
        .where(
          and(eq(contacts.createdBy, params.createdBy), eq(contacts.companyId, params.companyId)),
        )
        .orderBy(desc(contacts.createdAt))
        // TODO: paginate — capped at 20 until the company-context UI supports pagination.
        .limit(20);

      response.isSuccess = true;
      response.message = "Contacts fetched successfully";
      response.contacts = contactsResponse;
    } catch (error) {
      const message = "Unknown error in listing contacts by company";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.ListContacts,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async updateContact(params: Schemas.UpdateContactDALRequest) {
    const response: Schemas.UpdateContactApiResponse = { isSuccess: false };

    try {
      const updated = await this.db
        .update(contacts)
        .set({
          name: params.name ?? undefined,
          designation: params.designation,
          email: params.email,
          linkedinUrl: params.linkedinUrl,
          linkedinConnected: params.linkedinConnected,
          companyId: params.companyId ?? undefined,
          sequencePosition: params.sequencePosition,
          lastTouchAt: params.lastTouchAt,
          nextTouchDueAt: params.nextTouchDueAt,
          deadAt: params.deadAt,
          reEngageAt: params.reEngageAt,
          abVariable: params.abVariable,
          abVariant: params.abVariant,
          abReplied: params.abReplied,
          status: params.status ?? undefined,
          draftBody: params.draftBody,
          draftSubject: params.draftSubject,
          personalizationNotes: params.personalizationNotes,
          manualPersonalizationNotes: params.manualPersonalizationNotes,
          reengagementRecommendation: params.reengagementRecommendation,
          source: params.source,
          notes: params.notes,
          failedAt: params.failedAt,
          retryCount: params.retryCount,
          updatedAt: Utility.getCurrentISOTimestamp(),
        })
        .where(and(eq(contacts.id, params.id), eq(contacts.createdBy, params.createdBy)))
        .returning({ id: contacts.id })
        .get();

      if (!updated) {
        const message = "Contact not found";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.UpdateContact,
          message,
          metadata: params,
        });
        response.message = message;
        return response;
      }

      const detailResponse = await this.getContactDetails({
        id: updated.id,
        createdBy: params.createdBy,
      });

      response.isSuccess = true;
      response.message = "Contact updated successfully";
      response.contact = detailResponse.contact;
    } catch (error) {
      const message = "Unknown error in updating contact";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.UpdateContact,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async bulkDeleteContacts(params: Schemas.BulkDeleteContactsDALRequest) {
    const response: Schemas.BulkDeleteContactsApiResponse = { isSuccess: false };

    try {
      AppLogger.info({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.BulkDeleteContacts,
        message: "Bulk deleting contacts",
        metadata: params,
      });

      await this.db
        .delete(contacts)
        .where(and(inArray(contacts.id, params.ids), eq(contacts.createdBy, params.createdBy)));

      response.isSuccess = true;
      response.message = "Contacts deleted successfully";
      response.deletedCount = params.ids.length;
    } catch (error) {
      const message = "Unknown error in bulk deleting contacts";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.BulkDeleteContacts,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async bulkUpdateContacts(params: Schemas.BulkUpdateContactsDALRequest) {
    const response: Schemas.BulkUpdateContactsApiResponse = { isSuccess: false };

    try {
      AppLogger.info({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.BulkUpdateContacts,
        message: "Bulk updating contacts",
        metadata: { count: params.ids.length, createdBy: params.createdBy },
      });

      const result = await this.db
        .update(contacts)
        .set({ ...params.updates, updatedAt: Utility.getCurrentISOTimestamp() })
        .where(and(eq(contacts.createdBy, params.createdBy), inArray(contacts.id, params.ids)))
        .returning({ id: contacts.id });

      response.isSuccess = true;
      response.message = `${result.length} contact(s) updated`;
      response.updatedCount = result.length;
    } catch (error) {
      const message = "Unknown error in bulk updating contacts";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.BulkUpdateContacts,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async deleteContact(params: Schemas.FindContactDALRequest) {
    const response: Schemas.ApiResponse = { isSuccess: false };

    try {
      await this.db
        .delete(contacts)
        .where(and(eq(contacts.id, params.id), eq(contacts.createdBy, params.createdBy)));

      response.isSuccess = true;
      response.message = "Contact deleted successfully";
    } catch (error) {
      const message = "Unknown error in deleting contact";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.DeleteContact,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async getContactHistory(params: Schemas.GetContactHistoryDALRequest) {
    const response: Schemas.GetContactHistoryApiResponse = { isSuccess: false };

    try {
      const history = await this.db
        .select()
        .from(contactHistory)
        .where(
          and(
            eq(contactHistory.contactId, params.contactId),
            eq(contactHistory.createdBy, params.createdBy),
          ),
        )
        .orderBy(contactHistory.sentAt);

      response.isSuccess = true;
      response.message = "Contact history fetched successfully";
      response.history = history;
    } catch (error) {
      const message = "Unknown error in fetching contact history";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetContactHistory,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  /** Returns the sentAt of the most recent outbound message for the contact, or null if none remain. */
  async getLastSentHistory(params: Schemas.GetLastSentHistoryDALRequest) {
    const response: Schemas.GetLastSentHistoryApiResponse = { isSuccess: false };

    try {
      const [latest] = await this.db
        .select({ sentAt: contactHistory.sentAt })
        .from(contactHistory)
        .where(
          and(
            eq(contactHistory.contactId, params.contactId),
            eq(contactHistory.createdBy, params.createdBy),
            inArray(contactHistory.type, Schemas.CONTACT_HISTORY_SENT_TYPES),
          ),
        )
        .orderBy(desc(contactHistory.sentAt))
        .limit(1);

      response.isSuccess = true;
      response.message = "Last sent history fetched successfully";
      response.lastSentAt = latest?.sentAt ?? null;
    } catch (error) {
      const message = "Unknown error in fetching last sent history";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetLastSentHistory,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  /** Count of outbound (_sent) history rows for the contact — doubles as "latest Touch N". */
  async getSentMessageCount(params: Schemas.GetSentMessageCountDALRequest) {
    const response: Schemas.GetSentMessageCountApiResponse = { isSuccess: false };

    try {
      const [row] = await this.db
        .select({ count: count() })
        .from(contactHistory)
        .where(
          and(
            eq(contactHistory.contactId, params.contactId),
            eq(contactHistory.createdBy, params.createdBy),
            inArray(contactHistory.type, Schemas.CONTACT_HISTORY_SENT_TYPES),
          ),
        );

      response.isSuccess = true;
      response.message = "Sent message count fetched successfully";
      response.count = row?.count ?? 0;
    } catch (error) {
      const message = "Unknown error in fetching sent message count";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.GetSentMessageCount,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async createContactHistory(params: Schemas.CreateContactHistoryDALRequest) {
    const response: Schemas.CreateContactHistoryApiResponse = { isSuccess: false };

    try {
      const isSent = params.type.endsWith(Schemas.CONTACT_HISTORY_SENT_SUFFIX);
      let nextSequencePosition: number | null = null;

      if (isSent) {
        const existing = await this.db
          .select({ sequencePosition: contactHistory.sequencePosition })
          .from(contactHistory)
          .where(
            and(
              eq(contactHistory.contactId, params.contactId),
              eq(contactHistory.createdBy, params.createdBy),
            ),
          );

        const maxPos = existing.reduce((max, row) => {
          const pos = row.sequencePosition ?? 0;
          return pos > max ? pos : max;
        }, 0);
        nextSequencePosition = maxPos + 1;
      }

      const created = await this.db
        .insert(contactHistory)
        .values({
          createdBy: params.createdBy,
          contactId: params.contactId,
          type: params.type,
          channel: params.channel,
          subject: params.subject ?? null,
          body: params.body,
          sequencePosition: nextSequencePosition,
          abVariable: params.abVariable ?? null,
          abVariant: params.abVariant ?? null,
          sentAt: params.sentAt,
          createdAt: Utility.getCurrentISOTimestamp(),
        })
        .returning()
        .get();

      response.isSuccess = true;
      response.message = "Contact history entry created successfully";
      response.history = created;
    } catch (error) {
      const message = "Unknown error in creating contact history entry";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.CreateContactHistory,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async updateContactHistory(params: Schemas.UpdateContactHistoryDALRequest) {
    const response: Schemas.UpdateContactHistoryApiResponse = { isSuccess: false };

    try {
      const updated = await this.db
        .update(contactHistory)
        .set({
          body: params.body ?? undefined,
          sentAt: params.sentAt ?? undefined,
          subject: params.subject,
        })
        .where(
          and(eq(contactHistory.id, params.id), eq(contactHistory.createdBy, params.createdBy)),
        )
        .returning()
        .get();

      if (!updated) {
        const message = "History entry not found";
        AppLogger.error({
          category: Schemas.LogCategory.DAL,
          action: Schemas.LogAction.UpdateContactHistory,
          message,
          metadata: params,
        });
        response.message = message;
        return response;
      }

      response.isSuccess = true;
      response.message = "History entry updated successfully";
      response.history = updated;
    } catch (error) {
      const message = "Unknown error in updating contact history entry";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.UpdateContactHistory,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async updateNextTouchDueAt(params: Schemas.UpdateNextTouchDueAtDALRequest) {
    const response: Schemas.ApiResponse = { isSuccess: false };

    try {
      await this.db
        .update(contacts)
        .set({ nextTouchDueAt: params.nextTouchDueAt, updatedAt: Utility.getCurrentISOTimestamp() })
        .where(and(eq(contacts.id, params.id), eq(contacts.createdBy, params.createdBy)));

      response.isSuccess = true;
      response.message = "Next touch due date updated successfully";
    } catch (error) {
      const message = "Unknown error in updating next touch due date";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.UpdateNextTouchDueAt,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async updateContactStatus(params: Schemas.UpdateContactStatusDALRequest) {
    const response: Schemas.ApiResponse = { isSuccess: false };

    try {
      await this.db
        .update(contacts)
        .set({ status: params.status, updatedAt: Utility.getCurrentISOTimestamp() })
        .where(and(eq(contacts.id, params.id), eq(contacts.createdBy, params.createdBy)));

      response.isSuccess = true;
      response.message = "Contact status updated successfully";
    } catch (error) {
      const message = "Unknown error in updating contact status";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.UpdateContactStatus,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }

  async deleteContactHistory(params: Schemas.DeleteContactHistoryDALRequest) {
    const response: Schemas.DeleteContactHistoryApiResponse = { isSuccess: false };

    try {
      // Scoped to contactId so a mismatched URL contact can neither delete another contact's row nor resync the wrong contact.
      const result = await this.db
        .delete(contactHistory)
        .where(
          and(
            eq(contactHistory.id, params.id),
            eq(contactHistory.contactId, params.contactId),
            eq(contactHistory.createdBy, params.createdBy),
          ),
        )
        .run();

      if ((result.meta.changes ?? 0) === 0) {
        response.message = "History entry not found";
        return response;
      }

      response.isSuccess = true;
      response.message = "History entry deleted successfully";
    } catch (error) {
      const message = "Unknown error in deleting contact history entry";
      AppLogger.error({
        category: Schemas.LogCategory.DAL,
        action: Schemas.LogAction.DeleteContactHistory,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }
}
