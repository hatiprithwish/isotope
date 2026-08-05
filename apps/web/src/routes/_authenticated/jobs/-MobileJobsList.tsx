import { useState } from "react";
import { SparkleIcon, TrashIcon, CheckSquareIcon, SquareIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import type * as Schemas from "@app/schemas";
import type { JobStatusIntEnum } from "@app/schemas";
import { JobStatusLabelEnum } from "@app/schemas";
import { JobStatusBadge } from "./-JobStatusBadge";
import { CaretRightIcon, BriefcaseIcon } from "@phosphor-icons/react";
import { MobileJobsHeader } from "./-MobileJobsHeader";

const STATUS_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: JobStatusLabelEnum.NotStarted },
  { value: 2, label: JobStatusLabelEnum.WaitingForHuman },
  { value: 3, label: JobStatusLabelEnum.Accepted },
  { value: 4, label: JobStatusLabelEnum.Applied },
  { value: 5, label: JobStatusLabelEnum.CompanyAdded },
  { value: 6, label: JobStatusLabelEnum.Interviewing },
  { value: 7, label: JobStatusLabelEnum.Offer },
  { value: 8, label: JobStatusLabelEnum.Rejected },
];

interface Props {
  allJobs: Schemas.Job[];
  isPending: boolean;
  isError: boolean;
  searchQuery: string;
  deferredQuery: string;
  mobileSearch: boolean;
  /** Shared status filter + saved filter controls — identical to the desktop table's. */
  filterBar: React.ReactNode;
  discoverPending: boolean;
  isBulkPending: boolean;
  onSearchToggle: () => void;
  onSearchChange: (v: string) => void;
  onDiscoverClick: () => void;
  onRowClick: (job: Schemas.Job) => void;
  onAddClick: () => void;
  onBulkDelete: (ids: number[]) => void;
  onBulkStatusUpdate: (
    ids: number[],
    status: JobStatusIntEnum,
    note: string | null,
  ) => Promise<unknown>;
}

export function MobileJobsList({
  allJobs,
  isPending,
  isError,
  searchQuery,
  deferredQuery,
  mobileSearch,
  filterBar,
  discoverPending,
  isBulkPending,
  onSearchToggle,
  onSearchChange,
  onDiscoverClick,
  onRowClick,
  onAddClick,
  onBulkDelete,
  onBulkStatusUpdate,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkNote, setBulkNote] = useState<string>("");
  const [selectMode, setSelectMode] = useState(false);

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

  function handleBulkDelete() {
    onBulkDelete(Array.from(selectedIds));
    clearSelection();
  }

  async function handleBulkStatusApply() {
    if (!bulkStatus) return;
    try {
      await onBulkStatusUpdate(
        Array.from(selectedIds),
        Number(bulkStatus) as JobStatusIntEnum,
        bulkNote.trim() ? bulkNote.trim() : null,
      );
      clearSelection();
    } catch {
      // error toast already shown by the mutation's onError — keep selection so the user can retry
    }
  }

  return (
    <div className="flex flex-col h-full md:hidden overflow-hidden">
      <MobileJobsHeader
        searchQuery={searchQuery}
        mobileSearch={mobileSearch}
        filterBar={filterBar}
        onSearchToggle={onSearchToggle}
        onSearchChange={onSearchChange}
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

      {!selectMode && !isPending && !isError && allJobs.length > 0 && (
        <div className="px-4 pb-2 flex items-center justify-between">
          <span className="text-[11px] text-(--text-secondary)">
            {allJobs.length} job{allJobs.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => setSelectMode(true)}
            className="text-[12px] text-primary font-medium"
          >
            Select
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-background pb-20">
        {isPending && (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">Loading…</div>
        )}
        {isError && (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
            Failed to load jobs.
          </div>
        )}
        {!isPending && !isError && allJobs.length === 0 && (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
            {deferredQuery.trim() ? "No jobs match your search." : "No jobs yet."}
          </div>
        )}
        {!isPending &&
          !isError &&
          allJobs.map((job) => (
            <div
              key={job.id}
              className="w-full text-left px-4 py-3 border-b border-border bg-card flex items-center gap-3"
            >
              {selectMode && (
                <button
                  type="button"
                  onClick={() => toggleOne(job.id)}
                  className="shrink-0 flex items-center justify-center"
                  aria-label={selectedIds.has(job.id) ? "Deselect" : "Select"}
                >
                  {selectedIds.has(job.id) ? (
                    <CheckSquareIcon size={18} weight="fill" className="text-primary" />
                  ) : (
                    <SquareIcon size={18} className="text-muted-foreground" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (selectMode) toggleOne(job.id);
                  else onRowClick(job);
                }}
                className="flex-1 flex items-center gap-3 text-left hover:bg-(--surface-raised) transition-colors rounded-sm"
              >
                <div className="w-9 h-9 rounded-lg bg-(--surface-raised) flex items-center justify-center shrink-0">
                  <BriefcaseIcon size={16} className="text-(--text-secondary)" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-foreground truncate leading-snug">
                    {job.title}
                  </div>
                  <div className="text-[12px] text-(--text-secondary) mt-0.5 truncate">
                    {[job.companyName, job.companyLocation].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {job.status != null && (
                    <JobStatusBadge status={job.status as JobStatusIntEnum} sm />
                  )}
                  {!selectMode && <CaretRightIcon size={12} className="text-(--text-secondary)" />}
                </div>
              </button>
            </div>
          ))}
      </div>

      {/* Bulk action bar */}
      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-4 py-3 flex flex-col gap-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-foreground">
              {someSelected ? `${selectedIds.size} selected` : "Select jobs"}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[12px] text-primary font-medium"
            >
              Done
            </button>
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
                  onClick={handleBulkDelete}
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
                  placeholder="Note (optional) — applied to all selected jobs…"
                  rows={2}
                  className="w-full bg-background border border-border rounded-md px-2.5 py-2 text-[12px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none"
                />
              )}
            </div>
          )}
        </div>
      )}

      {!selectMode && (
        <button
          type="button"
          onClick={onAddClick}
          className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <span className="text-2xl leading-none">+</span>
        </button>
      )}
    </div>
  );
}
