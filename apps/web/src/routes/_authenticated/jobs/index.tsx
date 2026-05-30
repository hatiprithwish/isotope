import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useDeferredValue } from "react";
import { z } from "zod";
import { JobsQueries, useJobs, useJobsCount } from "./-data";
import { JobsTable } from "./-JobsTable";
import { JobDetailPanel } from "./-JobDetailDrawer";
import JobEntryForm from "./-JobEntryForm";
import { JobStatusBadge } from "./-JobStatusBadge";
import type * as Schemas from "@app/schemas";
import type { JobStatusIntEnum } from "@app/schemas";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BriefcaseIcon,
  CaretRightIcon,
  PlusIcon,
  XIcon,
  SparkleIcon,
} from "@phosphor-icons/react";

const PAGE_SIZE = 20;

const STATUS_TABS: { key: string; label: string; statuses: JobStatusIntEnum[] | null }[] = [
  { key: "all", label: "All", statuses: null },
  { key: "review", label: "Needs review", statuses: [2] },
  { key: "accepted", label: "Accepted", statuses: [3] },
  { key: "applied", label: "Applied", statuses: [4] },
  { key: "interviewing", label: "Interviewing", statuses: [6] },
  { key: "offer", label: "Offer", statuses: [7] },
  { key: "rejected", label: "Rejected", statuses: [8] },
];

const MOBILE_GROUPS: { label: string; statuses: JobStatusIntEnum[] }[] = [
  { label: "Needs review", statuses: [2] },
  { label: "In progress", statuses: [3, 4, 5, 6, 7] },
  { label: "Not started", statuses: [1] },
  { label: "Rejected", statuses: [8] },
];

const searchSchema = z.object({
  panel: z.number().optional(),
});

export const Route = createFileRoute("/_authenticated/jobs/")({
  validateSearch: searchSchema,
  component: JobsPage,
});

function JobsPage() {
  const queryClient = useQueryClient();
  const { panel } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [formMode, setFormMode] = useState<null | "create" | Schemas.Job>(null);

  const searchParams: Schemas.GetJobsApiRequest = { searchText: deferredQuery || undefined };
  const { data, isPending, isError } = useJobs(searchParams);
  const { data: countData } = useJobsCount(searchParams);

  const allJobs: Schemas.Job[] = data?.jobs ?? [];
  const totalRecords = countData?.count ?? allJobs.length;

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageJobs = allJobs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function openPanel(id: number) {
    navigate({ search: (prev) => ({ ...prev, panel: id }) });
  }

  function closePanel() {
    navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
  }

  function handleRowClick(job: Schemas.Job) {
    if (panel === job.id) {
      closePanel();
    } else {
      openPanel(job.id);
    }
  }

  function handleMobileRowClick(job: Schemas.Job) {
    navigate({ to: "/jobs/$jobId", params: { jobId: String(job.id) } });
  }

  async function handleRefresh() {
    await queryClient.invalidateQueries({ queryKey: JobsQueries.keys.all() });
  }

  const pagination = {
    totalRecords,
    currentPage: safePage,
    itemsPerPage: PAGE_SIZE,
    onPrev: () => setCurrentPage((p) => Math.max(1, p - 1)),
    onNext: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    onJumpToPage: (page: number) => setCurrentPage(page),
    isLoading: isPending,
    onRefresh: handleRefresh,
    showJumpButtons: true,
  };

  const [mobileSearch, setMobileSearch] = useState(false);
  const [mobileStatusFilter, setMobileStatusFilter] = useState<string>("all");

  const filteredMobileJobs: Schemas.Job[] =
    mobileStatusFilter === "all"
      ? allJobs
      : allJobs.filter((j) => {
          const tab = STATUS_TABS.find((t) => t.key === mobileStatusFilter);
          return tab?.statuses?.includes(j.status as JobStatusIntEnum) ?? false;
        });

  const mobileGrouped: { groupLabel: string; jobs: Schemas.Job[] }[] = MOBILE_GROUPS.map(
    ({ label, statuses }) => ({
      groupLabel: label,
      jobs: filteredMobileJobs.filter((j) => statuses.includes(j.status as JobStatusIntEnum)),
    }),
  ).filter((g) => g.jobs.length > 0);

  const isFormOpen = formMode !== null;
  const editJob = formMode !== null && formMode !== "create" ? formMode : undefined;

  function handleFormSuccess() {
    setFormMode(null);
    void handleRefresh();
  }

  return (
    <>
      {/* ── FORM MODAL ──────────────────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
            onClick={() => setFormMode(null)}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-[15px] font-semibold text-foreground">
                {editJob ? "Edit job" : "Add job"}
              </span>
              <button
                type="button"
                onClick={() => setFormMode(null)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-(--text-secondary) hover:bg-(--surface-raised) hover:text-foreground transition-colors"
              >
                <XIcon size={14} />
              </button>
            </div>
            <div className="px-5 py-5 max-h-[75vh] overflow-y-auto">
              <JobEntryForm
                initialData={editJob}
                onSuccess={handleFormSuccess}
                onCancel={() => setFormMode(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE ──────────────────────────────────────────────── */}
      <div className="flex flex-col h-full md:hidden overflow-hidden">
        {/* Header */}
        <header className="px-4 pt-4 pb-0 bg-background shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[22px] font-semibold text-foreground tracking-tight">Jobs</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileSearch((s) => !s)}
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

          {/* Search bar (toggle) */}
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
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search jobs…"
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          )}

          {/* Status filter tab bar */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none">
            {STATUS_TABS.map((tab) => {
              const count =
                tab.statuses === null
                  ? allJobs.length
                  : allJobs.filter((j) => tab.statuses!.includes(j.status as JobStatusIntEnum))
                      .length;
              const isActive = mobileStatusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMobileStatusFilter(tab.key)}
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

        {/* AI discovery banner */}
        <div className="mx-4 mb-3 px-3.5 py-2.5 rounded-lg bg-(--ai-bg) border border-(--ai-border) flex items-center gap-2.5">
          <SparkleIcon size={14} className="text-(--ai) shrink-0" weight="fill" />
          <span className="flex-1 text-[12px] font-medium text-(--ai-text)">
            Find new jobs matching your framework
          </span>
          <button
            type="button"
            className="shrink-0 h-6 px-2.5 rounded-md bg-background border border-border text-[11px] font-medium text-foreground"
          >
            Discover
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto bg-background">
          {isPending && (
            <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">Loading…</div>
          )}
          {isError && (
            <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
              Failed to load jobs.
            </div>
          )}
          {!isPending && !isError && filteredMobileJobs.length === 0 && (
            <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
              {deferredQuery.trim() ? "No jobs match your search." : "No jobs yet."}
            </div>
          )}

          {!isPending &&
            !isError &&
            mobileGrouped.map(({ groupLabel, jobs: groupJobs }) => (
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
                    onClick={() => handleMobileRowClick(job)}
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

        {/* FAB */}
        <button
          type="button"
          onClick={() => setFormMode("create")}
          className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <PlusIcon size={22} />
        </button>
      </div>

      {/* ── DESKTOP ─────────────────────────────────────────────── */}
      <div className="hidden md:flex h-full overflow-hidden relative">
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="h-13 px-6 flex items-center justify-between border-b border-border bg-sidebar shrink-0">
            <span className="text-base font-semibold text-foreground tracking-tight">Jobs</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-7.75 px-3 rounded-lg text-[13px] font-medium bg-(--ai-bg) border border-(--ai-border) text-(--ai-text) hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <SparkleIcon size={13} className="text-(--ai)" weight="fill" />
                Discover
              </button>
              <button
                type="button"
                onClick={() => setFormMode("create")}
                className="h-7.75 px-3 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <PlusIcon size={13} />
                Add
              </button>
            </div>
          </header>
          <JobsTable
            jobs={pageJobs}
            isLoading={isPending}
            isError={isError}
            selectedId={panel ?? null}
            onRowClick={handleRowClick}
            pagination={pagination}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
        </div>

        <JobDetailPanel
          jobId={panel ?? null}
          onClose={closePanel}
          onEdit={(job) => setFormMode(job)}
        />
      </div>
    </>
  );
}
