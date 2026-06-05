import { useState } from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
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
  onAddClick: () => void;
}

export function MobileCompaniesList({ companies, onAddClick }: Props) {
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

  return (
    <div className="flex flex-col h-full md:hidden overflow-hidden">
      <header className="h-13 px-4 flex items-center gap-2 bg-background border-b border-border shrink-0">
        <span className="flex-1 text-[17px] font-semibold text-foreground tracking-tight">
          Companies
        </span>
        <button
          type="button"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-(--text-secondary) hover:bg-(--surface-raised)"
        >
          <MagnifyingGlassIcon size={18} />
        </button>
      </header>

      <button
        type="button"
        onClick={onAddClick}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
        aria-label="Add company"
      >
        <PlusIcon size={22} />
      </button>

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
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
            No companies match this filter.
          </div>
        ) : (
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
                  <MobileCompanyRow key={co.id} company={co} />
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
                  <MobileCompanyRow key={co.id} company={co} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
