import { useState } from "react";
import * as Schemas from "@app/schemas";
import type { ExtractedMessage, ExtractedThread } from "@/lib/extractThread";
import { buildMessageFingerprint, useLoggedFingerprints, useLogMessages } from "./data";

const WEB_ORIGIN = import.meta.env.WXT_WEB_ORIGIN;

const LABEL_CLASS =
  "mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground";
const FIELD_CLASS =
  "w-full rounded-md border border-input bg-card px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring";

/** "4 Sep, 3:24 pm" — short enough for a 320px panel, unambiguous about the date. */
function formatSentAt(sentAt: string | null): string {
  if (!sentAt) return "no date";
  return new Date(sentAt).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessageRow({
  message,
  isChecked,
  isAlreadyLogged,
  onToggle,
}: {
  message: ExtractedMessage;
  isChecked: boolean;
  isAlreadyLogged: boolean;
  onToggle: (next: boolean) => void;
}) {
  // `sentAt` is required by the log API and there is no sane value to invent: a message rendered
  // above the thread's first date separator has no date anywhere on screen.
  const isUndatable = !message.sentAt;

  return (
    <li className="flex gap-2 border-b border-border py-2 last:border-b-0">
      <input
        type="checkbox"
        className="mt-0.5 shrink-0"
        checked={isChecked}
        disabled={isUndatable}
        onChange={(event) => onToggle(event.target.checked)}
        aria-label={`Log message from ${message.sender}`}
      />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-1.5 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">
            {message.direction === "me" ? "You" : message.sender}
          </span>
          <span>{formatSentAt(message.sentAt)}</span>
          {isAlreadyLogged && <span className="text-primary">already logged</span>}
        </p>
        <p className="mt-0.5 line-clamp-4 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
          {message.body}
        </p>
        {isUndatable && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Scroll up in the conversation until a date appears, then rescan.
          </p>
        )}
      </div>
    </li>
  );
}

export default function ThreadPanel({
  thread,
  matches,
}: {
  thread: ExtractedThread;
  matches: Schemas.Contact[];
}) {
  // One unambiguous match is the common case and clicking through it every time is the friction
  // this whole extension exists to remove. Anything else, the user picks.
  const [contactId, setContactId] = useState<number | null>(
    matches.length === 1 ? matches[0].id : null,
  );
  // What the user has explicitly ticked or unticked, keyed by message fingerprint rather than list
  // position. The panel re-reads the conversation every few seconds, so messages arrive and the
  // list grows underneath the user; an index-keyed selection would shift onto the wrong rows.
  // Anything not overridden falls back to the default below.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const logged = useLoggedFingerprints(contactId);
  const logMessages = useLogMessages();

  const fingerprints = thread.messages.map((message) =>
    buildMessageFingerprint(message.sentAt, message.body),
  );
  const loggedSet = logged.data;

  // Nothing server-side rejects a duplicate history entry, so re-opening a thread already logged
  // would silently double it. Default to unchecked for what the contact already has; the rows stay
  // visible and re-checkable, because a body that merely looks identical is not proof it is the
  // same message. A message with no date is never selectable — `sentAt` is required and there is
  // no honest value to invent.
  const isSelected = (index: number): boolean => {
    if (!thread.messages[index].sentAt) return false;
    return overrides[fingerprints[index]] ?? !loggedSet?.has(fingerprints[index]);
  };

  const selectedIndexes = thread.messages.map((_message, index) => index).filter(isSelected);

  // The bulk endpoint rejects the whole batch past this, so the cap is enforced here rather than
  // letting a long thread fail after the user has already picked everything.
  const isOverCap = selectedIndexes.length > Schemas.BULK_LOG_CONTACT_HISTORY_MAX_ENTRIES;

  // Until the contact's history has loaded the duplicate check cannot run, and logging in that
  // window is exactly how a re-scan of an already-logged thread would double it.
  const isCheckingHistory = contactId !== null && logged.isLoading;

  const setAll = (value: boolean) => {
    setOverrides(Object.fromEntries(fingerprints.map((fingerprint) => [fingerprint, value])));
  };

  const handleLog = () => {
    if (contactId === null || !selectedIndexes.length || isOverCap) return;

    const entries: Schemas.BulkLogContactHistoryEntry[] = selectedIndexes.map((index) => {
      const message = thread.messages[index];
      return {
        contactId,
        direction:
          message.direction === "me"
            ? Schemas.ContactHistoryDirectionEnum.Me
            : Schemas.ContactHistoryDirectionEnum.Contact,
        channel: Schemas.ContactHistoryChannelEnum.LinkedIn,
        body: message.body,
        // Filtered above — every selected index has a date.
        sentAt: message.sentAt ?? "",
      };
    });

    logMessages.mutate({ entries });
  };

  if (logMessages.isSuccess) {
    const results = logMessages.data.results ?? [];
    const failed = results.filter((result) => !result.isSuccess);
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[13px] font-semibold text-foreground">
          Logged {results.length - failed.length} of {results.length} messages
        </p>
        {failed.length > 0 && (
          <p className="text-[13px] leading-relaxed text-destructive" role="alert">
            {failed.length} failed: {failed[0].message ?? "unknown error"}
          </p>
        )}
        <div className="flex items-center gap-4">
          <a
            className="text-[13px] font-medium text-primary underline underline-offset-2"
            href={`${WEB_ORIGIN}/contacts?panel=${contactId}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in Isotope
          </a>
          {/* Messages keep arriving while the panel is open, so "done" is not the end of the road. */}
          <button
            type="button"
            className="text-[13px] font-medium text-primary underline underline-offset-2"
            onClick={() => logMessages.reset()}
          >
            Back to messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <label className={LABEL_CLASS} htmlFor="thread-contact">
          Log to
        </label>
        {matches.length > 0 ? (
          <select
            id="thread-contact"
            className={FIELD_CLASS}
            value={contactId ?? ""}
            onChange={(event) =>
              setContactId(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">Select a contact…</option>
            {matches.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
                {contact.companyName ? ` · ${contact.companyName}` : ""}
              </option>
            ))}
          </select>
        ) : (
          // Messaging links participants by opaque member URN, and the thread shows no company,
          // so there is nothing here to capture a contact *from* — the profile page has both.
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {thread.otherName || "This person"} isn&apos;t in Isotope yet. Open their profile from
            this conversation and capture them there, then come back to log the messages.
          </p>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <p className="text-[11px] text-muted-foreground">
          {selectedIndexes.length} of {thread.messages.length} selected
          {logged.isFetching ? " · checking history…" : ""}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-[11px] font-medium text-primary underline underline-offset-2"
            onClick={() => setAll(true)}
          >
            All
          </button>
          <button
            type="button"
            className="text-[11px] font-medium text-primary underline underline-offset-2"
            onClick={() => setAll(false)}
          >
            None
          </button>
        </div>
      </div>

      {logged.isError && (
        <p className="text-[11px] leading-relaxed text-destructive" role="alert">
          Couldn&apos;t check what&apos;s already logged ({logged.error.message}). Anything you log
          now may duplicate an existing entry.
        </p>
      )}

      <ul className="max-h-[60vh] overflow-y-auto">
        {thread.messages.map((message, index) => (
          <MessageRow
            key={`${index}-${fingerprints[index]}`}
            message={message}
            isChecked={isSelected(index)}
            isAlreadyLogged={Boolean(loggedSet?.has(fingerprints[index]))}
            onToggle={(next) =>
              setOverrides((current) => ({ ...current, [fingerprints[index]]: next }))
            }
          />
        ))}
      </ul>

      {isOverCap && (
        <p className="text-[13px] leading-relaxed text-destructive" role="alert">
          Select at most {Schemas.BULK_LOG_CONTACT_HISTORY_MAX_ENTRIES} messages at a time.
        </p>
      )}

      {logMessages.isError && (
        <p className="text-[13px] leading-relaxed text-destructive" role="alert">
          {logMessages.error.message}
        </p>
      )}

      <button
        type="button"
        onClick={handleLog}
        disabled={
          contactId === null ||
          !selectedIndexes.length ||
          isOverCap ||
          isCheckingHistory ||
          logMessages.isPending
        }
        className="rounded-md bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground disabled:opacity-50"
      >
        {logMessages.isPending ? "Logging…" : `Log ${selectedIndexes.length} to Isotope`}
      </button>
    </div>
  );
}
