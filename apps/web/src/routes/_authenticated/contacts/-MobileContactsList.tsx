import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChatsCircleIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import type * as Schemas from "@app/schemas";
import { ContactStatusIntEnum } from "@app/schemas";
import { STATUS_OPTIONS } from "./-AddOrEditContactModal";
import MobileContactRow from "./-MobileContactRow";

type MobileFilter =
  | "all"
  | "draft_ready"
  | "in_pipeline"
  | "needs_input"
  | "replied"
  | "re_engage"
  | "dead";

function needsInput(c: Schemas.Contact): boolean {
  return (
    c.status === ContactStatusIntEnum.NotStarted &&
    !c.personalizationNotes &&
    !c.manualPersonalizationNotes
  );
}

function applyMobileFilter(contacts: Schemas.Contact[], filter: MobileFilter): Schemas.Contact[] {
  switch (filter) {
    case "draft_ready":
      return contacts.filter((c) => c.status === ContactStatusIntEnum.DraftReady);
    case "in_pipeline":
      return contacts.filter((c) => c.status === ContactStatusIntEnum.InPipeline);
    case "needs_input":
      return contacts.filter(needsInput);
    case "replied":
      return contacts.filter((c) => c.status === ContactStatusIntEnum.Replied);
    case "re_engage":
      return contacts.filter((c) => c.status === ContactStatusIntEnum.ReEngage);
    case "dead":
      return contacts.filter((c) => c.status === ContactStatusIntEnum.Dead);
    default:
      return contacts;
  }
}

interface Props {
  contacts: Schemas.Contact[];
  isLoading: boolean;
  isError: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  onBulkDelete: (ids: number[]) => Promise<unknown>;
  onBulkUpdate: (
    ids: number[],
    updates: Schemas.BulkUpdateContactsApiRequest["updates"],
  ) => Promise<unknown>;
  isBulkPending: boolean;
}

export function MobileContactsList({
  contacts,
  isLoading,
  isError,
  searchQuery,
  onSearchChange,
  onAddClick,
  onBulkDelete,
  onBulkUpdate,
  isBulkPending,
}: Props) {
  const [mobileSearch, setMobileSearch] = useState(false);
  const [mobileFilter, setMobileFilter] = useState<MobileFilter>("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");

  function toggleSearch() {
    setMobileSearch((s) => {
      if (s) onSearchChange("");
      return !s;
    });
  }

  const chips: { label: string; filter: MobileFilter }[] = [
    { label: "All", filter: "all" },
    { label: "Draft ready", filter: "draft_ready" },
    { label: "In pipeline", filter: "in_pipeline" },
    { label: "Needs input", filter: "needs_input" },
    { label: "Replied", filter: "replied" },
    { label: "Re-engage", filter: "re_engage" },
    { label: "Dead", filter: "dead" },
  ];

  const filtered = applyMobileFilter(contacts, mobileFilter);
  const draftReady = filtered.filter((c) => c.status === ContactStatusIntEnum.DraftReady);
  const inPipeline = filtered.filter((c) => c.status === ContactStatusIntEnum.InPipeline);
  const other = filtered.filter(
    (c) =>
      c.status !== ContactStatusIntEnum.DraftReady && c.status !== ContactStatusIntEnum.InPipeline,
  );
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
      await onBulkUpdate(Array.from(selectedIds), { status: Number(bulkStatus) });
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

      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border bg-background shrink-0 no-scrollbar">
        {chips.map(({ label, filter }) => {
          const count =
            filter === "all" ? contacts.length : applyMobileFilter(contacts, filter).length;
          const active = mobileFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setMobileFilter(filter)}
              className={[
                "inline-flex items-center gap-1 h-8 px-3 rounded-full border text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors",
                active
                  ? "bg-primary/10 border-primary text-primary font-semibold"
                  : "bg-sidebar border-border text-(--text-secondary)",
              ].join(" ")}
            >
              {label}
              {count > 0 && (
                <span
                  className={[
                    "inline-flex items-center justify-center min-w-4.5 h-4 px-1 rounded text-[10px] font-semibold",
                    active
                      ? "text-primary opacity-70"
                      : "bg-(--surface-raised) text-(--text-secondary)",
                  ].join(" ")}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
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
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
            {searchQuery.trim()
              ? "No contacts match your search."
              : "No contacts match this filter."}
          </div>
        )}
        {!isLoading && !isError && filtered.length > 0 && (
          <>
            {draftReady.length > 0 && (
              <>
                <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                    Drafts ready · ready to send{" "}
                    <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[10px] font-semibold ml-1">
                      {draftReady.length}
                    </span>
                  </span>
                </div>
                {draftReady.map((co) => (
                  <MobileContactRow
                    key={co.id}
                    contact={co}
                    selectMode={selectMode}
                    selected={selectedIds.has(co.id)}
                    onToggleSelect={toggleOne}
                  />
                ))}
              </>
            )}
            {inPipeline.length > 0 && (
              <>
                <div className="px-4 pt-5 pb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                    In pipeline{" "}
                    <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[10px] font-semibold ml-1">
                      {inPipeline.length}
                    </span>
                  </span>
                </div>
                {inPipeline.map((co) => (
                  <MobileContactRow
                    key={co.id}
                    contact={co}
                    selectMode={selectMode}
                    selected={selectedIds.has(co.id)}
                    onToggleSelect={toggleOne}
                  />
                ))}
              </>
            )}
            {other.length > 0 && (
              <>
                <div className="px-4 pt-5 pb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                    Other{" "}
                    <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[10px] font-semibold ml-1">
                      {other.length}
                    </span>
                  </span>
                </div>
                {other.map((co) => (
                  <MobileContactRow
                    key={co.id}
                    contact={co}
                    selectMode={selectMode}
                    selected={selectedIds.has(co.id)}
                    onToggleSelect={toggleOne}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-4 py-3 flex flex-col gap-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-foreground">
              {someSelected ? `${selectedIds.size} selected` : "Select contacts"}
            </span>
          </div>
          {someSelected && (
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
          )}
        </div>
      )}
    </div>
  );
}
