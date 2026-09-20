import { useState } from "react";
import * as Schemas from "@app/schemas";
import { useChangeContactStatus } from "./data";

const LINK_CLASS = "text-[12px] font-medium text-primary underline underline-offset-2";
const ACTION_CLASS =
  "rounded-md border border-input px-2.5 py-1.5 text-[12px] font-medium text-foreground disabled:opacity-50";
const FIELD_CLASS =
  "w-full rounded-md border border-input bg-card px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring";

const STATUS_OPTIONS = Object.entries(Schemas.contactStatusIntToLabel).map(([value, label]) => ({
  value: Number(value) as Schemas.ContactStatusIntEnum,
  label,
}));

/**
 * A contact's status badge plus the inline editor that moves it. Shared by the contact card and the
 * follow-up rows so a status can be changed from wherever the contact turns up.
 */
export default function ContactStatusControl({
  contactId,
  name,
  status,
  statusLabel,
}: {
  contactId: number;
  name: string;
  status: Schemas.ContactStatusIntEnum;
  statusLabel: string;
}) {
  const change = useChangeContactStatus();
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState(status);
  const [note, setNote] = useState("");

  // The mutation's result outranks the props: the list they came from refetches a beat later.
  const current = change.data?.contact
    ? { status: change.data.contact.status, label: change.data.contact.statusLabel }
    : { status, label: statusLabel };
  const isTerminal = Schemas.CONTACT_TERMINAL_STATUSES.includes(selected);

  const handleOpen = () => {
    setSelected(current.status);
    setNote("");
    change.reset();
    setIsEditing(true);
  };

  const handleSave = () => {
    if (selected === current.status) {
      setIsEditing(false);
      return;
    }
    change.mutate(
      { contactId, fromStatus: current.status, toStatus: selected, note },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  if (!isEditing) {
    return (
      <>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex h-5 items-center rounded-md bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
            {current.label}
          </span>
          <button type="button" onClick={handleOpen} className={LINK_CLASS}>
            Change status
          </button>
          {change.isSuccess && !change.data.noteError && (
            <span className="text-[12px] font-medium text-primary">Updated ✓</span>
          )}
        </div>
        {/* The status did change; only its note failed — say so instead of hiding it. */}
        {change.data?.noteError && (
          <p className="mt-2 text-[12px] leading-relaxed text-destructive" role="alert">
            Status updated, but the note was not saved: {change.data.noteError}
          </p>
        )}
      </>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <select
        value={selected}
        onChange={(event) => setSelected(Number(event.target.value))}
        aria-label={`Status for ${name}`}
        className={FIELD_CLASS}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={2}
        placeholder="Note (optional)"
        aria-label="Status change note"
        className={FIELD_CLASS}
      />
      {isTerminal && selected !== current.status && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          This stops outreach and clears this contact&apos;s follow-ups.
        </p>
      )}
      {change.isError && (
        <p className="text-[12px] leading-relaxed text-destructive" role="alert">
          {change.error.message}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={change.isPending}
          className={ACTION_CLASS}
        >
          {change.isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          disabled={change.isPending}
          className={LINK_CLASS}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
