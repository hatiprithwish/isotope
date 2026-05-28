import type { SQL } from "drizzle-orm";
import { and, eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import getDbClient from "@/db/dbClient";
import { contacts, contactHistory, companies } from "@/db/tables";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/logger";
import Utility from "@/utils";

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
          jobId: params.jobId ?? null,
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
          jobId: contacts.jobId,
          sequencePosition: contacts.sequencePosition,
          lastTouchAt: contacts.lastTouchAt,
          nextTouchDueAt: contacts.nextTouchDueAt,
          deadAt: contacts.deadAt,
          reEngageAt: contacts.reEngageAt,
          abVariable: contacts.abVariable,
          abVariant: contacts.abVariant,
          abReplied: contacts.abReplied,
          status: contacts.status,
          statusLabel: sql<Schemas.ContactStatusLabelEnum>`CASE
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.NotStarted} THEN ${Schemas.ContactStatusLabelEnum.NotStarted}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.DraftReady} THEN ${Schemas.ContactStatusLabelEnum.DraftReady}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.InPipeline} THEN ${Schemas.ContactStatusLabelEnum.InPipeline}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.Replied} THEN ${Schemas.ContactStatusLabelEnum.Replied}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.Closed} THEN ${Schemas.ContactStatusLabelEnum.Closed}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.Dead} THEN ${Schemas.ContactStatusLabelEnum.Dead}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.ReEngage} THEN ${Schemas.ContactStatusLabelEnum.ReEngage}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.Failed} THEN ${Schemas.ContactStatusLabelEnum.Failed}
            ELSE ${Schemas.ContactStatusLabelEnum.NotStarted}
          END`,
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
      const contactsResponse = await this.db
        .select({
          id: contacts.id,
          name: contacts.name,
          designation: contacts.designation,
          email: contacts.email,
          linkedinUrl: contacts.linkedinUrl,
          linkedinConnected: contacts.linkedinConnected,
          companyId: contacts.companyId,
          jobId: contacts.jobId,
          sequencePosition: contacts.sequencePosition,
          lastTouchAt: contacts.lastTouchAt,
          nextTouchDueAt: contacts.nextTouchDueAt,
          deadAt: contacts.deadAt,
          reEngageAt: contacts.reEngageAt,
          abVariable: contacts.abVariable,
          abVariant: contacts.abVariant,
          abReplied: contacts.abReplied,
          status: contacts.status,
          statusLabel: sql<Schemas.ContactStatusLabelEnum>`CASE
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.NotStarted} THEN ${Schemas.ContactStatusLabelEnum.NotStarted}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.DraftReady} THEN ${Schemas.ContactStatusLabelEnum.DraftReady}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.InPipeline} THEN ${Schemas.ContactStatusLabelEnum.InPipeline}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.Replied} THEN ${Schemas.ContactStatusLabelEnum.Replied}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.Closed} THEN ${Schemas.ContactStatusLabelEnum.Closed}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.Dead} THEN ${Schemas.ContactStatusLabelEnum.Dead}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.ReEngage} THEN ${Schemas.ContactStatusLabelEnum.ReEngage}
            WHEN ${contacts.status} = ${Schemas.ContactStatusIntEnum.Failed} THEN ${Schemas.ContactStatusLabelEnum.Failed}
            ELSE ${Schemas.ContactStatusLabelEnum.NotStarted}
          END`,
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
        .where(eq(contacts.createdBy, params.createdBy));

      response.isSuccess = true;
      response.message = "Contacts fetched successfully";
      response.contacts = contactsResponse;
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
          jobId: params.jobId,
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
        );

      response.isSuccess = true;
      response.message = "Contact history fetched successfully";
      response.history = history;
    } catch (error) {
      const message = "Unknown error in fetching contact history";
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

  async createContactHistory(params: Schemas.CreateContactHistoryDALRequest) {
    const response: Schemas.CreateContactHistoryApiResponse = { isSuccess: false };

    try {
      const created = await this.db
        .insert(contactHistory)
        .values({
          createdBy: params.createdBy,
          contactId: params.contactId,
          type: params.type,
          channel: params.channel,
          subject: params.subject ?? null,
          body: params.body,
          sequencePosition: params.sequencePosition ?? null,
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
        action: Schemas.LogAction.CreateContact,
        message,
        error,
        metadata: params,
      });
      response.message = message;
    }

    return response;
  }
}
