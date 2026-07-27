import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { MagnifyingGlassIcon, CheckSquareIcon, SquareIcon } from "@phosphor-icons/react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type * as Schemas from "@app/schemas";
import { Button } from "@/shadcn/ui/button";
import { ContactsQueries } from "./-data";

interface Props {
  excludeIds: Set<number>;
  /** How many more contacts can still be added before hitting the batch cap. */
  remainingCapacity: number;
  onAdd: (contacts: Schemas.Contact[]) => void;
}

export function BulkLogContactSearch({ excludeIds, remainingCapacity, onAdd }: Props) {
  const { getToken } = useAuth();
  const [query, setQuery] = useState("");
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isPending } = useQuery({
    ...ContactsQueries.list(
      { search: debouncedQuery || undefined, pageNo: 1, pageSize: 20 },
      getToken,
    ),
    enabled: debouncedQuery.trim().length > 0,
  });

  const results = (data?.contacts ?? []).filter((c) => !excludeIds.has(c.id));
  const showDropdown = debouncedQuery.trim().length > 0;
  const checkedContacts = results.filter((c) => checkedIds.has(c.id));
  const allChecked = results.length > 0 && results.every((c) => checkedIds.has(c.id));
  const atCapacity = remainingCapacity <= 0;

  function toggleOne(id: number) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setCheckedIds(allChecked ? new Set() : new Set(results.map((c) => c.id)));
  }

  function handleAdd() {
    if (checkedContacts.length === 0) return;
    onAdd(checkedContacts.slice(0, remainingCapacity));
    setQuery("");
    setCheckedIds(new Set());
  }

  return (
    <div className="relative">
      <div className="relative">
        <MagnifyingGlassIcon
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary) pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={atCapacity}
          placeholder={
            atCapacity
              ? `Batch limit reached — remove a contact to add another`
              : "Add another contact to this batch…"
          }
          className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-(--surface-raised) text-[12.5px] text-foreground outline-none focus:border-primary focus:bg-card transition-colors disabled:opacity-60"
        />
      </div>

      {showDropdown && !atCapacity && (
        <div className="mt-1.5 border border-border rounded-lg bg-card overflow-hidden">
          {results.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left border-b border-border hover:bg-(--surface-raised) transition-colors"
            >
              {allChecked ? (
                <CheckSquareIcon size={15} weight="fill" className="text-primary shrink-0" />
              ) : (
                <SquareIcon size={15} className="text-(--text-secondary) shrink-0" />
              )}
              <span className="text-[12px] font-medium text-foreground">
                Select all ({results.length})
              </span>
            </button>
          )}

          <div className="max-h-56 overflow-y-auto">
            {isPending && (
              <div className="px-3 py-2.5 text-[12px] text-(--text-secondary)">Searching…</div>
            )}
            {!isPending && results.length === 0 && (
              <div className="px-3 py-2.5 text-[12px] text-(--text-secondary)">
                No matching contacts.
              </div>
            )}
            {!isPending &&
              results.map((contact) => {
                const checked = checkedIds.has(contact.id);
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggleOne(contact.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left border-b border-border last:border-b-0 hover:bg-(--surface-raised) transition-colors"
                  >
                    {checked ? (
                      <CheckSquareIcon size={15} weight="fill" className="text-primary shrink-0" />
                    ) : (
                      <SquareIcon size={15} className="text-(--text-secondary) shrink-0" />
                    )}
                    <span className="text-[12.5px] font-semibold text-foreground truncate">
                      {contact.name}
                    </span>
                    <span className="ml-auto text-[11.5px] text-(--text-secondary) truncate">
                      {[contact.designation, contact.companyName].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                );
              })}
          </div>

          {checkedContacts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-(--surface-raised)">
              <span className="text-[11.5px] text-(--text-secondary)">
                {checkedContacts.length} selected
                {checkedContacts.length > remainingCapacity &&
                  ` — only ${remainingCapacity} will fit in this batch`}
              </span>
              <Button type="button" size="sm" className="ml-auto" onClick={handleAdd}>
                Add {Math.min(checkedContacts.length, remainingCapacity)}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
