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
