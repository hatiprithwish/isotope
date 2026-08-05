import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChatsCircleIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import type * as Schemas from "@app/schemas";
import { STATUS_OPTIONS } from "./-AddOrEditContactModal";
import MobileContactRow from "./-MobileContactRow";

interface Props {
  contacts: Schemas.Contact[];
  isLoading: boolean;
  isError: boolean;
  searchQuery: string;
  /** Shared status filter + saved filter controls — identical to the desktop table's. */
  filterBar: React.ReactNode;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  onBulkDelete: (ids: number[]) => Promise<unknown>;
  onBulkUpdate: (
    ids: number[],
    updates: Schemas.BulkUpdateContactsApiRequest["updates"],
    statusNote: string | null,
  ) => Promise<unknown>;
  isBulkPending: boolean;
}

export function MobileContactsList({
  contacts,
  isLoading,
  isError,
  searchQuery,
  filterBar,
  onSearchChange,
  onAddClick,
  onBulkDelete,
  onBulkUpdate,
  isBulkPending,
}: Props) {
  const [mobileSearch, setMobileSearch] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkNote, setBulkNote] = useState<string>("");

  function toggleSearch() {
    setMobileSearch((s) => {
      if (s) onSearchChange("");
      return !s;
    });
  }

  const someSelected = selectedIds.size > 0;

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setBulkStatus("");
    setBulkNote("");
    setSelectMode(false);
  }

  async function handleBulkDelete() {
    try {
      await onBulkDelete(Array.from(selectedIds));
      clearSelection();
    } catch {
      // error toast already shown by the mutation's onError — keep selection so the user can retry
    }
  }

  async function handleBulkStatusApply() {
    if (!bulkStatus) return;
    try {
      await onBulkUpdate(
        Array.from(selectedIds),
        { status: Number(bulkStatus) },
        bulkNote.trim() ? bulkNote.trim() : null,
      );
      clearSelection();
    } catch {
      // error toast already shown by the mutation's onError — keep selection so the user can retry
    }
  }

  return (
    <div className="flex flex-col h-full md:hidden overflow-hidden">
      <header className="px-4 pt-4 pb-0 bg-background shrink-0">
        <div className="flex items-center gap-2 h-9">
          <span className="flex-1 text-[17px] font-semibold text-foreground tracking-tight">
            Contacts
          </span>
          {selectMode ? (
            <button
              type="button"
              onClick={clearSelection}
              className="text-[13px] text-primary font-medium"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelectMode(true)}
                className="text-[13px] text-primary font-medium"
              >
                Select
              </button>
              <Button type="button" variant="ghost" size="icon" onClick={toggleSearch}>
                <MagnifyingGlassIcon size={18} />
              </Button>
              <Button type="button" variant="ghost" size="icon" asChild>
                <Link to="/contacts/bulk-log">
                  <ChatsCircleIcon size={18} />
                </Link>
              </Button>
            </>
          )}
        </div>

        {mobileSearch && (
          <div className="relative mt-3">
            <MagnifyingGlassIcon
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              autoFocus
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search contacts…"
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        )}
      </header>

      {!selectMode && (
        <button
          type="button"
          onClick={onAddClick}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
          aria-label="Add contact"
        >
          <PlusIcon size={22} />
        </button>
      )}

      <div className="flex items-center gap-2 flex-wrap px-4 py-3 border-b border-border bg-background shrink-0">
        {filterBar}
      </div>

      <div className="flex-1 overflow-y-auto bg-sidebar pb-6">
        {isLoading && (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">Loading…</div>
        )}
        {!isLoading && isError && (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
            Failed to load contacts.
          </div>
        )}
        {!isLoading && !isError && contacts.length === 0 && (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
            {searchQuery.trim()
              ? "No contacts match your search."
              : "No contacts match this filter."}
          </div>
        )}
        {!isLoading &&
          !isError &&
          contacts.map((co) => (
            <MobileContactRow
              key={co.id}
              contact={co}
              selectMode={selectMode}
              selected={selectedIds.has(co.id)}
              onToggleSelect={toggleOne}
            />
          ))}
      </div>

      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-4 py-3 flex flex-col gap-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-foreground">
              {someSelected ? `${selectedIds.size} selected` : "Select contacts"}
            </span>
          </div>
          {someSelected && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="flex-1 h-8 px-2 rounded-md border border-border bg-background text-[12px] text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Set status…</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  disabled={!bulkStatus || isBulkPending}
                  onClick={() => void handleBulkStatusApply()}
                >
                  Apply
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  disabled={isBulkPending}
                  onClick={() => void handleBulkDelete()}
                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                >
                  <TrashIcon size={12} />
                  Delete
                </Button>
              </div>
              {bulkStatus && (
                <textarea
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                  placeholder="Note (optional) — applied to all selected contacts…"
                  rows={2}
                  className="w-full bg-background border border-border rounded-md px-2.5 py-2 text-[12px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
