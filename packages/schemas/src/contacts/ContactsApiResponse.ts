import type {
  Contact,
  ContactHistory,
  ContactHistoryChannelEnum,
  ContactStatusIntEnum,
} from "./ContactsCommon";
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

export interface ParsedProfileFields {
  name: string | null;
  designation: string | null;
  companyName: string | null;
}

export interface ParseProfileApiResponse extends ApiResponse {
  /** Absent when the model declined or returned unusable output — the caller keeps its own values. */
  parsed?: ParsedProfileFields;
  /** True when the caller was rate-limited rather than the parse failing. */
  isRateLimited?: boolean;
}

export interface CaptureContactApiResponse extends ApiResponse {
  contact?: Contact;
  /** True when the profile was already in the pipeline — `contact` is the pre-existing row and nothing was created. */
  isDuplicate?: boolean;
  /** True when the contact's company had to be created as part of this capture. */
  isNewCompany?: boolean;
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

export interface DeleteContactHistoryApiResponse extends ApiResponse {
  channel?: ContactHistoryChannelEnum;
}

/** Same shape as soft-delete's response — reused by restore and the hard-delete sweep. */
export type RestoreContactHistoryApiResponse = DeleteContactHistoryApiResponse;
export type HardDeleteContactHistoryApiResponse = DeleteContactHistoryApiResponse;

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
  updatedIds?: number[];
  /** Each updated contact's status immediately before this update — lets the caller tell an actual status transition from a no-op re-save. */
  previousStatusById?: Record<number, ContactStatusIntEnum>;
}

export interface BulkLogContactHistoryResult {
  contactId: number;
  isSuccess: boolean;
  message?: string;
}

export interface BulkLogContactHistoryApiResponse extends ApiResponse {
  results?: BulkLogContactHistoryResult[];
}

export interface BulkCreateContactsResult {
  tempId: string;
  isSuccess: boolean;
  message?: string;
  contact?: Contact;
}

export interface BulkCreateContactsApiResponse extends ApiResponse {
  results?: BulkCreateContactsResult[];
}
