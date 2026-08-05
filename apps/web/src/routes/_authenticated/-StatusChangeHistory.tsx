import { useQuery } from "@tanstack/react-query";
import { StatusChangeNotesQueries } from "./-status-change-notes-data";
import type * as Schemas from "@app/schemas";

interface StatusChangeHistoryProps {
  entityType: Schemas.StatusChangeEntityTypeEnum;
  entityId: number;
  getToken: () => Promise<string | null>;
  /** Maps a status int to its display label for this entity type. */
  statusLabel: (status: number) => string;
}

export function StatusChangeHistory({
  entityType,
  entityId,
  getToken,
  statusLabel,
}: StatusChangeHistoryProps) {
  const { data, isPending, isError } = useQuery(
    StatusChangeNotesQueries.list(entityType, entityId, getToken),
  );
  const notes = data?.statusChangeNotes ?? [];

  if (isPending) {
    return (
      <div className="px-5 py-4.5 border-b border-border">
        <div className="h-3 w-32 rounded bg-(--surface-raised) animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-5 py-4.5 border-b border-border text-[13px] text-(--text-secondary)">
        Failed to load status history.
      </div>
    );
  }

  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="px-5 py-4.5 border-b border-border">
      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
        Status history
      </div>
      <div className="flex flex-col gap-3">
        {notes
          .slice()
          .reverse()
          .map((entry) => (
            <div key={entry.id} className="text-[13px] leading-normal">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                {entry.fromStatus != null && (
                  <>
                    <span className="text-(--text-secondary)">{statusLabel(entry.fromStatus)}</span>
                    <span className="text-(--text-secondary)">→</span>
                  </>
                )}
                <span>{statusLabel(entry.toStatus)}</span>
              </div>
              {entry.note && <div className="text-(--text-secondary) mt-0.5">{entry.note}</div>}
              <div className="text-[11px] text-(--text-secondary) mt-0.5">{entry.createdAt}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
