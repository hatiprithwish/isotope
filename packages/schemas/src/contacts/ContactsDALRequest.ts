import type { NullableDALFields } from "../common";
import type { Contact, ContactBase, ContactHistory, ContactHistoryBase } from "./ContactsCommon";

export type CreateContactDALRequest = ContactBase & Pick<Contact, "createdBy">;

export type FindContactDALRequest = Pick<Contact, "id" | "createdBy">;

export type GetContactsDALRequest = Pick<Contact, "createdBy">;

export type UpdateContactDALRequest = FindContactDALRequest &
  NullableDALFields<Omit<Contact, "id" | "createdBy" | "createdAt" | "statusLabel">>;

export type CreateContactHistoryDALRequest = ContactHistoryBase & Pick<ContactHistory, "createdBy">;

export type GetContactHistoryDALRequest = { contactId: number; createdBy: string };
