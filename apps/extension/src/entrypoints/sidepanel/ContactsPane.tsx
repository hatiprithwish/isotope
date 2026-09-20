import { useEffect, useState } from "react";
import ContactCard from "./ContactCard";
import { CONTACT_SEARCH_MIN_LENGTH, useContacts } from "./data";

/** Quiet period after the last keystroke before the search runs. */
const SEARCH_DEBOUNCE_MS = 350;

export default function ContactsPane() {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setTerm(input.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const contacts = useContacts(term);
  const isSearching = term.length >= CONTACT_SEARCH_MIN_LENGTH;

  return (
    <>
      <div className="px-4 pt-3">
        <input
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Search your contacts by name"
          aria-label="Search contacts"
          className="w-full rounded-md border border-input bg-card px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
        />
      </div>

      {contacts.isPending && <p className="p-4 text-[13px] text-muted-foreground">Loading…</p>}

      {contacts.isError && (
        <div className="flex flex-col gap-3 p-4">
          <p className="text-[13px] leading-relaxed text-destructive" role="alert">
            {contacts.error.message}
          </p>
          <button
            type="button"
            onClick={() => void contacts.refetch()}
            className="self-start rounded-md border border-input px-3 py-2 text-[13px] font-medium text-foreground"
          >
            Retry
          </button>
        </div>
      )}

      {contacts.isSuccess && contacts.data.contacts.length === 0 && (
        <p className="p-4 text-[13px] leading-relaxed text-muted-foreground">
          {isSearching
            ? `No contact matches “${term}”.`
            : "No contacts yet. Capture one from a LinkedIn profile."}
        </p>
      )}

      {contacts.isSuccess && contacts.data.contacts.length > 0 && (
        <>
          <p className="px-4 pt-3 text-[11px] text-muted-foreground">
            {isSearching
              ? `${contacts.data.totalCount} ${contacts.data.totalCount === 1 ? "match" : "matches"}`
              : `Recently added · ${contacts.data.contacts.length} of ${contacts.data.totalCount}`}
          </p>
          <div className="mt-2 border-t border-border">
            {contacts.data.contacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
          {contacts.hasNextPage && (
            <div className="px-4 py-3">
              <button
                type="button"
                onClick={() => void contacts.fetchNextPage()}
                disabled={contacts.isFetchingNextPage}
                className="rounded-md border border-input px-3 py-2 text-[13px] font-medium text-foreground disabled:opacity-50"
              >
                {contacts.isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
