import type { StatusChangeNote, StatusChangeNoteBase } from "./StatusChangeNotesCommon";

export type CreateStatusChangeNoteDALRequest = StatusChangeNoteBase &
  Pick<StatusChangeNote, "createdBy">;

export type BulkCreateStatusChangeNotesDALRequest = {
  createdBy: string;
  entityType: StatusChangeNote["entityType"];
  entityIds: number[];
  toStatus: number;
  note?: string | null;
};

export type GetStatusChangeNotesDALRequest = {
  createdBy: string;
  entityType: StatusChangeNote["entityType"];
  entityId: number;
};
