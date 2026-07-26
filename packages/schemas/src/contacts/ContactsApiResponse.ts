import type { Contact, ContactHistory } from "./ContactsCommon";
import type { ApiResponse } from "../common";

export interface CreateContactApiResponse extends ApiResponse {
  contact?: Contact;
}

export interface GetContactApiResponse extends ApiResponse {
  contact?: Contact;
}

export interface GetContactsApiResponse extends ApiResponse {
  contacts?: Contact[];
  totalCount?: number;
}

export interface CheckDuplicateContactApiResponse extends ApiResponse {
  match?: Contact | null;
}

export interface UpdateContactApiResponse extends ApiResponse {
  contact?: Contact;
}

export interface GetContactHistoryApiResponse extends ApiResponse {
  history?: ContactHistory[];
}

export interface CreateContactHistoryApiResponse extends ApiResponse {
  history?: ContactHistory;
}

export interface UpdateContactHistoryApiResponse extends ApiResponse {
  history?: ContactHistory;
}

export interface DeleteContactHistoryApiResponse extends ApiResponse {}

export interface GetLastSentHistoryApiResponse extends ApiResponse {
  lastSentAt?: string | null;
}

export interface GetSentMessageCountApiResponse extends ApiResponse {
  count?: number;
}

export interface BulkDeleteContactsApiResponse extends ApiResponse {
  deletedCount?: number;
}

export interface BulkUpdateContactsApiResponse extends ApiResponse {
  updatedCount?: number;
}
