import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useDeferredValue } from "react";
import { z } from "zod";
import { JobsQueries, useJobs, useJobsCount } from "./-data";
import { JobsTable } from "./-JobsTable";
import { JobDetailPanel, JobDetailMobileDrawer } from "./-JobDetailDrawer";
import type * as Schemas from "@app/schemas";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

const PAGE_SIZE = 20;

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

  async function handleRefresh() {
    await queryClient.invalidateQueries({ queryKey: JobsQueries.keys.all() });
    await queryClient.invalidateQueries({ queryKey: ["jobs", "count"] });
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

  return (
    <>
      {/* ── MOBILE ──────────────────────────────────────────────── */}
      <div className="flex flex-col h-full md:hidden overflow-hidden">
        <header className="px-4 pt-3 pb-2 bg-background border-b border-border shrink-0 flex flex-col gap-2">
          <span className="text-[17px] font-semibold text-foreground tracking-tight">Jobs</span>
          <div className="relative">
            <MagnifyingGlassIcon
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search jobs…"
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-sidebar">
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
          {pageJobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => handleRowClick(job)}
              className="w-full text-left px-4 py-3 border-b border-border bg-card hover:bg-(--surface-raised) transition-colors"
            >
              <div className="text-[14px] font-medium text-foreground truncate">{job.title}</div>
              <div className="text-[12px] text-(--text-secondary) mt-0.5">
                {job.location ?? "—"}
              </div>
            </button>
          ))}
        </div>

        <JobDetailMobileDrawer jobId={panel ?? null} onClose={closePanel} />
      </div>

      {/* ── DESKTOP ─────────────────────────────────────────────── */}
      <div className="hidden md:flex h-full overflow-hidden relative">
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="h-13 px-6 flex items-center border-b border-border bg-sidebar shrink-0">
            <span className="text-base font-semibold text-foreground tracking-tight">Jobs</span>
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

        {panel != null && (
          <div className="absolute inset-0 z-10" onClick={closePanel} aria-hidden />
        )}
        <JobDetailPanel jobId={panel ?? null} onClose={closePanel} />
      </div>
    </>
  );
}
