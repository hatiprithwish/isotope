import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowCounterClockwiseIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import * as Schemas from "@app/schemas"; // runtime `import *`: consumes the history-type helpers alongside types.
import {
  CONTACT_HISTORY_UNDO_WINDOW_MS,
  ContactsQueries,
  useDeleteContactHistory,
  useRestoreContactHistory,
} from "./-data";
import { AddOrEditContactHistoryForm } from "./-AddOrEditContactHistoryForm";
import { Button } from "@/shadcn/ui/button";
import { StatusChangeNotesQueries } from "../-status-change-notes-data";

/**
 * Once a tombstone's undo window has elapsed, the queued HardDeleteContactHistoryHandler has run
 * server-side — it hard-deletes the row AND (deferred from the old immediate-delete behavior)
 * resyncs that channel's follow-up state and may revert the contact's status. Nothing pushes that
 * completion to the client, so this timer is the only signal we get: refetch history, detail, and
 * the resolved message template at the same 15 min mark, or all three caches go stale until some
 * unrelated action happens to refetch them.
 */
function useTombstoneExpiry(deletedRows: Schemas.ContactHistory[], contactId: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (deletedRows.length === 0) return;

    const timers = deletedRows.map((row) => {
      const msRemaining =
        CONTACT_HISTORY_UNDO_WINDOW_MS - (Date.now() - Date.parse(row.deletedAt as string));
      return setTimeout(
        () => {
          void queryClient.invalidateQueries({ queryKey: ContactsQueries.keys.history(contactId) });
          void queryClient.invalidateQueries({ queryKey: ContactsQueries.keys.detail(contactId) });
          void queryClient.invalidateQueries({
            queryKey: ContactsQueries.keys.messageTemplate(contactId),
          });
        },
        Math.max(msRemaining, 0),
      );
    });

    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, [deletedRows, contactId, queryClient]);
}

export function HistoryTab({
  contact,
  getToken,
}: {
  contact: Schemas.Contact;
  getToken: () => Promise<string | null>;
}) {
  const { data, isPending } = useQuery(ContactsQueries.history(contact.id, getToken));
  const { data: statusChangeData } = useQuery(
    StatusChangeNotesQueries.list(Schemas.StatusChangeEntityTypeEnum.Contact, contact.id, getToken),
  );
  const deleteHistory = useDeleteContactHistory();
  const restoreHistory = useRestoreContactHistory();
  const [editingId, setEditingId] = useState<number | null>(null);
  const history = data?.history ?? [];
  const statusChangeNotes = statusChangeData?.statusChangeNotes ?? [];
  const isTerminal = Schemas.CONTACT_TERMINAL_STATUSES.includes(contact.status);

  const deletedRows = history.filter((h) => h.deletedAt != null);
  useTombstoneExpiry(deletedRows, contact.id);

  const visibleHistory = history.filter((h) => h.deletedAt == null);
  const replyCount = visibleHistory.filter((h) =>
    h.type.endsWith(Schemas.CONTACT_HISTORY_RECEIVED_SUFFIX),
  ).length;

  type TimelineEvent =
    | { kind: "message"; at: string; entry: Schemas.ContactHistory }
    | { kind: "status"; at: string; entry: Schemas.StatusChangeNote };

  const timeline: TimelineEvent[] = [
    ...history.map((entry): TimelineEvent => ({ kind: "message", at: entry.sentAt, entry })),
    ...statusChangeNotes.map(
      (entry): TimelineEvent => ({ kind: "status", at: entry.createdAt, entry }),
    ),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  if (isPending)
    return <div className="px-5 py-6 text-(--text-secondary) text-sm">Loading history…</div>;

  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      {visibleHistory.length > 0 && (
        <div className="flex items-center gap-2 text-[12px] text-(--text-secondary) border-b border-border pb-3">
          <span className="font-medium">{visibleHistory.length} messages</span>
          <span className="w-1 h-1 rounded-full bg-(--border-strong)" />
          <span className="font-medium">
            {replyCount} repl{replyCount === 1 ? "y" : "ies"}
          </span>
        </div>
      )}

      {history.length === 0 && (
        <div className="py-4 text-center text-(--text-secondary) text-[13px]">
          No messages logged yet.
        </div>
      )}

      {timeline.map((event) => {
        if (event.kind === "status") {
          const s = event.entry;
          return (
            <div key={`status-${s.id}`} className="flex flex-col items-center gap-0.5 py-1">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-(--text-secondary)">
                {s.fromStatus != null && (
                  <>
                    <span>
                      {Schemas.contactStatusIntToLabel[
                        s.fromStatus as Schemas.ContactStatusIntEnum
                      ] ?? s.fromStatus}
                    </span>
                    <span>→</span>
                  </>
                )}
                <span className="text-foreground">
                  {Schemas.contactStatusIntToLabel[s.toStatus as Schemas.ContactStatusIntEnum] ??
                    s.toStatus}
                </span>
                <span>· {new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
              {s.note && (
                <div className="max-w-[82%] text-[12px] text-(--text-secondary) italic text-center">
                  {s.note}
                </div>
              )}
            </div>
          );
        }

        const h = event.entry;
        const isSent = Schemas.CONTACT_HISTORY_SENT_TYPES.includes(h.type);
        const channelLabel = Schemas.CONTACT_HISTORY_CHANNEL_LABEL_MAP[h.channel];
        const touchLabel =
          isSent && h.sequencePosition != null ? `Touch ${h.sequencePosition}` : null;

        if (h.deletedAt != null) {
          // Undo is only ever valid within the same window the server enforces — if a refetch is
          // slow to reflect the queued hard-delete (or that delivery is delayed/lost), the button
          // must still disappear on schedule rather than staying clickable indefinitely.
          const canUndo = Date.now() - Date.parse(h.deletedAt) < CONTACT_HISTORY_UNDO_WINDOW_MS;

          return (
            <div
              key={h.id}
              className={`flex flex-col gap-1 ${isSent ? "items-end" : "items-start"}`}
            >
              <span className="text-[11px] text-(--text-secondary)">
                {channelLabel} · {new Date(h.sentAt).toLocaleDateString()}
              </span>
              <div className="max-w-[82%] px-3.5 py-2.5 text-[13px] leading-[1.7] flex items-center gap-2 text-(--text-secondary) italic border border-dashed border-border rounded-[16px]">
                <span>This message was deleted</span>
                {canUndo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() =>
                      restoreHistory.mutate({ contactId: contact.id, historyId: h.id })
                    }
                    disabled={restoreHistory.isPending}
                    className="not-italic text-primary hover:text-primary"
                  >
                    <ArrowCounterClockwiseIcon size={11} />
                    Undo
                  </Button>
                )}
              </div>
            </div>
          );
        }

        return (
          <div key={h.id} className={`flex flex-col gap-1 ${isSent ? "items-end" : "items-start"}`}>
            <div className="flex items-center gap-1.5">
              {touchLabel && (
                <span className="text-[11px] font-semibold text-primary">{touchLabel} ·</span>
              )}
              <span className="text-[11px] text-(--text-secondary)">
                {channelLabel} · {new Date(h.sentAt).toLocaleDateString()}
              </span>
              {editingId !== h.id && (
                <div className="flex gap-0.5 ml-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingId(h.id)}
                  >
                    <PencilSimpleIcon size={11} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteHistory.mutate({ contactId: contact.id, historyId: h.id })}
                    disabled={deleteHistory.isPending}
                    className="hover:bg-(--danger-bg) hover:text-destructive"
                  >
                    <TrashIcon size={11} />
                  </Button>
                </div>
              )}
            </div>

            {editingId === h.id ? (
              <div className="w-full">
                <AddOrEditContactHistoryForm
                  mode="edit"
                  contactId={contact.id}
                  entry={h}
                  onDone={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div
                className={[
                  "max-w-[82%] px-3.5 py-2.5 text-[13px] leading-[1.7] text-foreground whitespace-pre-wrap wrap-break-word",
                  isSent
                    ? "bg-(--accent-bg) border border-(--accent)/25 rounded-[16px_16px_4px_16px]"
                    : "bg-sidebar border border-border rounded-[16px_16px_16px_4px]",
                ].join(" ")}
              >
                {h.subject && (
                  <div className="font-semibold text-[12px] mb-1 text-(--text-secondary)">
                    {h.subject}
                  </div>
                )}
                {h.body}
              </div>
            )}
          </div>
        );
      })}

      {isTerminal ? (
        <div className="text-center text-(--text-secondary) text-[12px] py-2 border-t border-border">
          {Schemas.contactStatusIntToLabel[contact.status]} contacts don't log new messages here.
        </div>
      ) : (
        <AddOrEditContactHistoryForm
          mode="add"
          contactId={contact.id}
          getToken={getToken}
          lastChannel={
            [...visibleHistory]
              .reverse()
              .find((h) => Schemas.CONTACT_HISTORY_SENT_TYPES.includes(h.type))?.channel ?? null
          }
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
