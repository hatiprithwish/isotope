import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import * as Schemas from "@app/schemas"; // runtime `import *`: consumes the history-type helpers alongside types.
import { ContactsQueries, useDeleteContactHistory } from "./-data";
import { AddOrEditContactHistoryForm } from "./-AddOrEditContactHistoryForm";
import { Button } from "@/shadcn/ui/button";

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

  const replyCount = history.filter((h) =>
    h.type.endsWith(Schemas.CONTACT_HISTORY_RECEIVED_SUFFIX),
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
        const isSent = Schemas.CONTACT_HISTORY_SENT_TYPES.includes(h.type);
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

      <AddOrEditContactHistoryForm
        mode="add"
        contactId={contact.id}
        getToken={getToken}
        onSaved={() => {}}
      />
    </div>
  );
}
