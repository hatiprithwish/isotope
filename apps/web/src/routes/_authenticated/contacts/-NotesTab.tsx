import { useState } from "react";
import type * as Schemas from "@app/schemas";
import { useUpdateContact } from "./-data";

interface NotesTabProps {
  contact: Schemas.Contact;
}

/** Saves on blur. The mount site keys this by contact id so the draft never leaks across contacts. */
export function NotesTab({ contact }: NotesTabProps) {
  const savedNotes = contact.notes ?? "";
  const [value, setValue] = useState(savedNotes);
  const updateContact = useUpdateContact();

  const saveNotes = () => {
    const trimmed = value.trim();
    if (trimmed === savedNotes.trim()) return;
    updateContact.mutate(
      { id: contact.id, body: { contact: { notes: trimmed || null } } },
      { onSuccess: () => setValue(trimmed) },
    );
  };

  return (
    <div className="px-5 py-4.5">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
          Notes
        </div>
        {updateContact.isPending && (
          <span className="text-[11px] text-(--text-secondary)">Saving…</span>
        )}
      </div>
      <textarea
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground leading-[1.65] resize-none outline-none focus:border-primary transition-colors min-h-18"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={saveNotes}
        placeholder="Add a note…"
        rows={3}
      />
    </div>
  );
}
