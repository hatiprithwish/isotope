import { MagnifyingGlassIcon, FunnelIcon } from "@phosphor-icons/react";
import type { JobStatusIntEnum } from "@app/schemas";
import type * as Schemas from "@app/schemas";

const STATUS_TABS: { key: string; label: string; statuses: JobStatusIntEnum[] | null }[] = [
  { key: "all", label: "All", statuses: null },
  { key: "review", label: "Needs review", statuses: [2] },
  { key: "accepted", label: "Accepted", statuses: [3] },
  { key: "applied", label: "Applied", statuses: [4] },
  { key: "interviewing", label: "Interviewing", statuses: [6] },
  { key: "offer", label: "Offer", statuses: [7] },
  { key: "rejected", label: "Rejected", statuses: [8] },
];

interface Props {
  allJobs: Schemas.Job[];
  searchQuery: string;
  mobileSearch: boolean;
  mobileStatusFilter: string;
  onSearchToggle: () => void;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
}

export function MobileJobsHeader({
  allJobs,
  searchQuery,
  mobileSearch,
  mobileStatusFilter,
  onSearchToggle,
  onSearchChange,
  onStatusFilterChange,
}: Props) {
  return (
    <header className="px-4 pt-4 pb-0 bg-background shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[22px] font-semibold text-foreground tracking-tight">Jobs</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSearchToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-(--text-secondary) hover:bg-(--surface-raised) transition-colors"
          >
            <MagnifyingGlassIcon size={18} />
          </button>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-(--text-secondary) hover:bg-(--surface-raised) transition-colors"
          >
            <FunnelIcon size={18} />
          </button>
        </div>
      </div>

      {mobileSearch && (
        <div className="relative mb-3">
          <MagnifyingGlassIcon
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            autoFocus
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search jobs…"
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.statuses === null
              ? allJobs.length
              : allJobs.filter((j) => tab.statuses!.includes(j.status as JobStatusIntEnum)).length;
          const isActive = mobileStatusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onStatusFilterChange(tab.key)}
              className={[
                "shrink-0 h-7 px-3 rounded-full text-[12px] font-medium transition-colors flex items-center gap-1.5",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border text-(--text-secondary) hover:bg-(--surface-raised)",
              ].join(" ")}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={[
                    "text-[11px] font-semibold",
                    isActive ? "opacity-80" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}

export { STATUS_TABS };
export type { JobStatusIntEnum };
