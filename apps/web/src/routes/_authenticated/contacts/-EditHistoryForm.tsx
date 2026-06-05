import { useState } from "react";
import type * as Schemas from "@app/schemas";
import { useUpdateContactHistory } from "./-data";

export function EditHistoryForm({
  contactId,
  entry,
  onDone,
}: {
  contactId: number;
  entry: Schemas.ContactHistory;
  onDone: () => void;
}) {
  const updateHistory = useUpdateContactHistory();
  const [body, setBody] = useState(entry.body);
  const [sentAt, setSentAt] = useState(entry.sentAt.slice(0, 10));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateHistory.mutate(
      { contactId, historyId: entry.id, body: { body, sentAt } },
      { onSuccess: onDone },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <input
        type="date"
        value={sentAt}
        onChange={(e) => setSentAt(e.target.value)}
        className="h-7 px-2 rounded-lg border border-border bg-background text-[12px] text-foreground outline-none focus:border-primary transition-colors self-start scheme-light dark:scheme-dark"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground leading-[1.65] resize-none outline-none focus:border-primary transition-colors"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="h-7 px-3 rounded-lg text-[12px] font-medium border border-border text-foreground hover:bg-(--surface-raised) transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!body.trim() || updateHistory.isPending}
          className="h-7 px-3 rounded-lg text-[12px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {updateHistory.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
