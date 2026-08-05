import type { StatusChangeNote } from "./StatusChangeNotesCommon";
import type { ApiResponse } from "../common";

export interface CreateStatusChangeNoteApiResponse extends ApiResponse {
  statusChangeNote?: StatusChangeNote;
}

export interface GetStatusChangeNotesApiResponse extends ApiResponse {
  statusChangeNotes?: StatusChangeNote[];
}

export interface BulkCreateStatusChangeNotesApiResponse extends ApiResponse {
  statusChangeNotes?: StatusChangeNote[];
  /** entityIds that were owned and actually got a note written — may be fewer than requested. */
  createdIds?: number[];
  /** Requested entityIds that were skipped because they weren't owned by the caller. */
  skippedIds?: number[];
}
