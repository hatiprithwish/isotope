import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import type * as Schemas from "@app/schemas";
import { ContactsQueries, useDeleteContactHistory } from "./-data";
import { ComposeForm } from "./-ComposeForm";
import { EditHistoryForm } from "./-EditHistoryForm";

export function HistoryTab({
  contact,
  getToken,
}: {
  contact: Schemas.Contact;
  getToken: () => Promise<string | null>;
}) {
  const { data, isPending } = useQuery(ContactsQueries.history(contact.id, getToken));
  const deleteHistory = useDeleteContactHistory();
  const [editingId, setEditingId] = useState<number | null>(null);
  const history = data?.history ?? [];

  const replyCount = history.filter(
    (h) => h.type === "email_received" || h.type === "linkedin_received",
  ).length;

  if (isPending)
    return <div className="px-5 py-6 text-(--text-secondary) text-sm">Loading history…</div>;

  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      {history.length > 0 && (
        <div className="flex items-center gap-2 text-[12px] text-(--text-secondary) border-b border-border pb-3">
          <span className="font-medium">{history.length} messages</span>
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

      {history.map((h) => {
        const isSent = h.type === "email_sent" || h.type === "linkedin_sent";
        const channelLabel = h.channel.charAt(0).toUpperCase() + h.channel.slice(1);
        const touchLabel =
          isSent && h.sequencePosition != null ? `Touch ${h.sequencePosition}` : null;

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
                  <button
                    type="button"
                    onClick={() => setEditingId(h.id)}
                    className="w-5 h-5 flex items-center justify-center rounded text-(--text-secondary) hover:text-foreground hover:bg-(--surface-raised) transition-colors"
                  >
                    <PencilSimpleIcon size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteHistory.mutate({ contactId: contact.id, historyId: h.id })}
                    disabled={deleteHistory.isPending}
                    className="w-5 h-5 flex items-center justify-center rounded text-(--text-secondary) hover:text-destructive hover:bg-(--danger-bg) transition-colors disabled:opacity-40"
                  >
                    <TrashIcon size={11} />
                  </button>
                </div>
              )}
            </div>

            {editingId === h.id ? (
              <div className="w-full">
                <EditHistoryForm
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

      <ComposeForm contactId={contact.id} onSaved={() => {}} />
    </div>
  );
}
