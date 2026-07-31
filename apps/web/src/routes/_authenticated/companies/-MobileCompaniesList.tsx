import { useState } from "react";
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import type * as Schemas from "@app/schemas";
import MobileCompanyRow from "./-MobileCompanyRow";

type MobileFilter =
  | "all"
  | "needs_review"
  | "strong_fit"
  | "accepted"
  | "contacts_added"
  | "disqualified";

function applyMobileFilter(companies: Schemas.Company[], filter: MobileFilter): Schemas.Company[] {
  switch (filter) {
    case "needs_review":
      return companies.filter((c) => c.status === 1);
    case "strong_fit":
      return companies.filter((c) => c.fitBand === 1);
    case "accepted":
      return companies.filter((c) => c.status === 2);
    case "contacts_added":
      return companies.filter((c) => c.status === 3);
    case "disqualified":
      return companies.filter((c) => c.fitBand === 4);
    default:
      return companies;
  }
}

interface Props {
  companies: Schemas.Company[];
  isLoading: boolean;
  isError: boolean;
  onAddClick: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onBulkDelete: (ids: number[]) => Promise<unknown>;
  isBulkPending: boolean;
}

export function MobileCompaniesList({
  companies,
  isLoading,
  isError,
  onAddClick,
  searchQuery,
  onSearchChange,
  onBulkDelete,
  isBulkPending,
}: Props) {
  const [mobileSearch, setMobileSearch] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  function toggleSearch() {
    setMobileSearch((s) => {
      if (s) onSearchChange("");
      return !s;
    });
  }

  const chips: { label: string; filter: MobileFilter }[] = [
    { label: "All", filter: "all" },
    { label: "Needs review", filter: "needs_review" },
    { label: "Strong fit", filter: "strong_fit" },
    { label: "Accepted", filter: "accepted" },
    { label: "Contacts added", filter: "contacts_added" },
    { label: "Disqualified", filter: "disqualified" },
  ];

  const [mobileFilter, setMobileFilter] = useState<MobileFilter>("all");

  const filtered = applyMobileFilter(companies, mobileFilter);
  const needsReview = filtered.filter((c) => c.status === 1);
  const inProgress = filtered.filter((c) => c.status !== 1);
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

  return (
    <div className="flex flex-col h-full md:hidden overflow-hidden">
      <header className="px-4 pt-4 pb-0 bg-background shrink-0">
        <div className="flex items-center gap-2 h-9">
          <span className="flex-1 text-[17px] font-semibold text-foreground tracking-tight">
            Companies
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
              placeholder="Search companies…"
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
          aria-label="Add company"
        >
          <PlusIcon size={22} />
        </button>
      )}

      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border bg-background shrink-0 no-scrollbar">
        {chips.map(({ label, filter }) => {
          const count =
            filter === "all" ? companies.length : applyMobileFilter(companies, filter).length;
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

      <div className="flex-1 overflow-y-auto bg-sidebar">
        {isLoading && (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">Loading…</div>
        )}
        {!isLoading && isError && (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
            Failed to load companies.
          </div>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
            {searchQuery.trim()
              ? "No companies match your search."
              : "No companies match this filter."}
          </div>
        )}
        {!isLoading && !isError && filtered.length > 0 && (
          <>
            {needsReview.length > 0 && (
              <>
                <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                    Needs review{" "}
                    <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[10px] font-semibold ml-1">
                      {needsReview.length}
                    </span>
                  </span>
                  <span className="text-[11px] font-medium text-(--text-secondary)">
                    Sort: Updated
                  </span>
                </div>
                {needsReview.map((co) => (
                  <MobileCompanyRow
                    key={co.id}
                    company={co}
                    selectMode={selectMode}
                    selected={selectedIds.has(co.id)}
                    onToggleSelect={toggleOne}
                  />
                ))}
              </>
            )}
            {inProgress.length > 0 && (
              <>
                <div className="px-4 pt-5 pb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                    In progress{" "}
                    <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[10px] font-semibold ml-1">
                      {inProgress.length}
                    </span>
                  </span>
                </div>
                {inProgress.map((co) => (
                  <MobileCompanyRow
                    key={co.id}
                    company={co}
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
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-4 py-3 flex items-center justify-between gap-2.5 shadow-lg">
          <span className="text-[13px] font-semibold text-foreground">
            {someSelected ? `${selectedIds.size} selected` : "Select companies"}
          </span>
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={!someSelected || isBulkPending}
            onClick={() => void handleBulkDelete()}
            className="text-destructive border-destructive/40 hover:bg-destructive/10"
          >
            <TrashIcon size={12} />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
