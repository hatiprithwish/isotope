import type { NullableDALFields } from "../common";
import type {
  Contact,
  ContactBase,
  ContactHistory,
  ContactHistoryBase,
  ContactStatusIntEnum,
} from "./ContactsCommon";

export type CreateContactDALRequest = ContactBase & Pick<Contact, "createdBy">;

export type FindContactDALRequest = Pick<Contact, "id" | "createdBy">;

export type GetContactsDALRequest = Pick<Contact, "createdBy"> & {
  search: string | null;
  pageNo: number;
  pageSize: number;
};

export type GetContactsByCompanyDALRequest = Pick<Contact, "createdBy"> & { companyId: number };

export type FindDuplicateContactDALRequest = Pick<Contact, "createdBy"> & {
  normalizedEmail: string | null;
  linkedinSlug: string | null;
  excludeId?: number;
};

export interface FindDuplicateContactCandidatesDALResponse {
  isSuccess: boolean;
  message?: string;
  candidates?: Contact[];
}

export type UpdateContactDALRequest = FindContactDALRequest &
  NullableDALFields<Omit<Contact, "id" | "createdBy" | "createdAt" | "statusLabel">>;

export type CreateContactHistoryDALRequest = ContactHistoryBase & Pick<ContactHistory, "createdBy">;

export type GetContactHistoryDALRequest = { contactId: number; createdBy: string };

export type FindContactHistoryDALRequest = { id: number; createdBy: string };

export type DeleteContactHistoryDALRequest = FindContactHistoryDALRequest & { contactId: number };

export type UpdateContactHistoryDALRequest = FindContactHistoryDALRequest & {
  body?: string;
  sentAt?: string;
  subject?: string | null;
};

export type UpdateNextTouchDueAtDALRequest = {
  id: number;
  createdBy: string;
  nextTouchDueAt: string | null;
};

export type UpdateContactStatusDALRequest = {
  id: number;
  createdBy: string;
  status: ContactStatusIntEnum;
};

export type GetLastSentHistoryDALRequest = { contactId: number; createdBy: string };

export type GetSentMessageCountDALRequest = { contactId: number; createdBy: string };

export type BulkDeleteContactsDALRequest = { ids: number[]; createdBy: string };

export type BulkUpdateContactsDALRequest = {
  ids: number[];
  createdBy: string;
  updates: Partial<Omit<ContactBase, "name">>;
};
