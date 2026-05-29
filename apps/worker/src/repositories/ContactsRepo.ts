import ContactsDAL from "@/data-access-layer/ContactsDAL";
import type * as Schemas from "@app/schemas"; // `import type` required: repos only consume TS interfaces (erased at compile time). Routes use `import *` because Zod Z* schemas are runtime values. This is needed for eslint rules.

export default class ContactsRepo {
  private dal: ContactsDAL;

  constructor(env: Env) {
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

  async getContacts(params: { userId: string }) {
    return await this.dal.getContacts({ createdBy: params.userId });
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
      jobId: params.contact.jobId ?? null,
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

  async getContactHistory(params: { userId: string; contactId: number }) {
    return await this.dal.getContactHistory({
      createdBy: params.userId,
      contactId: params.contactId,
    });
  }

  async createContactHistory(
    params: Schemas.CreateContactHistoryApiRequest & { userId: string; contactId: number },
  ) {
    return await this.dal.createContactHistory({
      createdBy: params.userId,
      contactId: params.contactId,
      ...params.history,
    });
  }
}
