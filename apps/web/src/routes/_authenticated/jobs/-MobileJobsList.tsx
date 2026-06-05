import { SparkleIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import type * as Schemas from "@app/schemas";
import type { JobStatusIntEnum } from "@app/schemas";
import { JobStatusBadge } from "./-JobStatusBadge";
import { CaretRightIcon, BriefcaseIcon } from "@phosphor-icons/react";
import { MobileJobsHeader, STATUS_TABS } from "./-MobileJobsHeader";

const MOBILE_GROUPS: { label: string; statuses: JobStatusIntEnum[] }[] = [
  { label: "Needs review", statuses: [2] },
  { label: "In progress", statuses: [3, 4, 5, 6, 7] },
  { label: "Not started", statuses: [1] },
  { label: "Rejected", statuses: [8] },
];

interface Props {
  allJobs: Schemas.Job[];
  isPending: boolean;
  isError: boolean;
  searchQuery: string;
  deferredQuery: string;
  mobileSearch: boolean;
  mobileStatusFilter: string;
  discoverPending: boolean;
  onSearchToggle: () => void;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onDiscoverClick: () => void;
  onRowClick: (job: Schemas.Job) => void;
  onAddClick: () => void;
}

export function MobileJobsList({
  allJobs,
  isPending,
  isError,
  searchQuery,
  deferredQuery,
  mobileSearch,
  mobileStatusFilter,
  discoverPending,
  onSearchToggle,
  onSearchChange,
  onStatusFilterChange,
  onDiscoverClick,
  onRowClick,
  onAddClick,
}: Props) {
  const filteredJobs =
    mobileStatusFilter === "all"
      ? allJobs
      : allJobs.filter((j) => {
          const tab = STATUS_TABS.find((t) => t.key === mobileStatusFilter);
          return tab?.statuses?.includes(j.status as JobStatusIntEnum) ?? false;
        });

  const grouped = MOBILE_GROUPS.map(({ label, statuses }) => ({
    groupLabel: label,
    jobs: filteredJobs.filter((j) => statuses.includes(j.status as JobStatusIntEnum)),
  })).filter((g) => g.jobs.length > 0);

  return (
    <div className="flex flex-col h-full md:hidden overflow-hidden">
      <MobileJobsHeader
        allJobs={allJobs}
        searchQuery={searchQuery}
        mobileSearch={mobileSearch}
        mobileStatusFilter={mobileStatusFilter}
        onSearchToggle={onSearchToggle}
        onSearchChange={onSearchChange}
        onStatusFilterChange={onStatusFilterChange}
      />

      <div className="mx-4 mb-3 px-3.5 py-2.5 rounded-lg bg-(--ai-bg) border border-(--ai-border) flex items-center gap-2.5">
        <SparkleIcon size={14} className="text-(--ai) shrink-0" weight="fill" />
        <span className="flex-1 text-[12px] font-medium text-(--ai-text)">
          Find new jobs matching your framework
        </span>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={onDiscoverClick}
          disabled={discoverPending}
          className="shrink-0"
        >
          {discoverPending ? "Searching…" : "Discover"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto bg-background">
        {isPending && (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">Loading…</div>
        )}
        {isError && (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
            Failed to load jobs.
          </div>
        )}
        {!isPending && !isError && filteredJobs.length === 0 && (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
            {deferredQuery.trim() ? "No jobs match your search." : "No jobs yet."}
          </div>
        )}
        {!isPending &&
          !isError &&
          grouped.map(({ groupLabel, jobs: groupJobs }) => (
            <div key={groupLabel}>
              <div className="px-4 pt-4 pb-1.5 flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                  {groupLabel}
                </span>
                <span className="text-[11px] font-semibold text-(--text-secondary) opacity-60">
                  {groupJobs.length}
                </span>
              </div>
              {groupJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => onRowClick(job)}
                  className="w-full text-left px-4 py-3 border-b border-border bg-card hover:bg-(--surface-raised) transition-colors flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-(--surface-raised) flex items-center justify-center shrink-0">
                    <BriefcaseIcon size={16} className="text-(--text-secondary)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-foreground truncate leading-snug">
                      {job.title}
                    </div>
                    <div className="text-[12px] text-(--text-secondary) mt-0.5 truncate">
                      {[job.companyName, job.location].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {job.status != null && (
                      <JobStatusBadge status={job.status as JobStatusIntEnum} sm />
                    )}
                    <CaretRightIcon size={12} className="text-(--text-secondary)" />
                  </div>
                </button>
              ))}
            </div>
          ))}
      </div>

      <button
        type="button"
        onClick={onAddClick}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        <span className="text-2xl leading-none">+</span>
      </button>
    </div>
  );
}
