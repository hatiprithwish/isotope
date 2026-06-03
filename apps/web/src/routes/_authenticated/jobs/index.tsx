import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useState, useDeferredValue, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { JobsQueries, useJobs, useJobsCount, useDiscoverJobs } from "./-data";
import { FrameworkQueries } from "../../_without_nav/onboarding/job-search-framework/-data";
import { ApiError } from "@/providers/apiClient";
import { JobsTable } from "./-JobsTable";
import { JobDetailPanel } from "./-JobDetailDrawer";
import { JobFormModal } from "./-JobFormModal";
import { MobileJobsList } from "./-MobileJobsList";
import { SparkleIcon, PlusIcon } from "@phosphor-icons/react";
import type * as Schemas from "@app/schemas";

const PAGE_SIZE = 20;

const searchSchema = z.object({
  panel: z.number().optional(),
  framework_saved: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/jobs/")({
  validateSearch: searchSchema,
  component: JobsPage,
});

function JobsPage() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { panel, framework_saved } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const frameworkQuery = useQuery(FrameworkQueries.latest(getToken));
  const hasFramework = Boolean(frameworkQuery.data?.framework?.isCustomized);
  const discoverMutation = useDiscoverJobs();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [formMode, setFormMode] = useState<null | "create" | Schemas.Job>(null);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [mobileStatusFilter, setMobileStatusFilter] = useState("all");

  const searchParams: Schemas.GetJobsApiRequest = { searchText: deferredQuery || undefined };
  const { data, isPending, isError } = useJobs(searchParams);
  const { data: countData } = useJobsCount(searchParams);

  const allJobs: Schemas.Job[] = data?.jobs ?? [];
  const totalRecords = countData?.count ?? allJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageJobs = allJobs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (framework_saved === "1") {
      toast.success("Job search criteria saved. You're ready to find jobs.", { duration: 4000 });
      void navigate({ search: (prev) => ({ ...prev, framework_saved: undefined }), replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDiscoverClick() {
    if (!hasFramework) {
      void navigate({ to: "/onboarding/job-search-framework" as string });
      return;
    }
    try {
      await discoverMutation.mutateAsync();
      toast.success("Searching for jobs — new listings will appear shortly.", { duration: 5000 });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        void navigate({ to: "/onboarding/job-search-framework" as string });
      }
    }
  }

  async function handleRefresh() {
    await queryClient.invalidateQueries({ queryKey: JobsQueries.keys.all() });
  }

  function handleFormSuccess() {
    setFormMode(null);
    void handleRefresh();
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
      {formMode !== null && (
        <JobFormModal
          editJob={formMode !== "create" ? formMode : undefined}
          onSuccess={handleFormSuccess}
          onClose={() => setFormMode(null)}
        />
      )}

      <MobileJobsList
        allJobs={allJobs}
        isPending={isPending}
        isError={isError}
        searchQuery={searchQuery}
        deferredQuery={deferredQuery}
        mobileSearch={mobileSearch}
        mobileStatusFilter={mobileStatusFilter}
        discoverPending={discoverMutation.isPending}
        onSearchToggle={() => setMobileSearch((s) => !s)}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        onStatusFilterChange={setMobileStatusFilter}
        onDiscoverClick={() => void handleDiscoverClick()}
        onRowClick={(job) => navigate({ to: "/jobs/$jobId", params: { jobId: String(job.id) } })}
        onAddClick={() => setFormMode("create")}
      />

      <div className="hidden md:flex h-full overflow-hidden relative">
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="h-13 px-6 flex items-center justify-between border-b border-border bg-sidebar shrink-0">
            <span className="text-base font-semibold text-foreground tracking-tight">Jobs</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleDiscoverClick()}
                disabled={discoverMutation.isPending}
                className="h-7.75 px-3 rounded-lg text-[13px] font-medium bg-(--ai-bg) border border-(--ai-border) text-(--ai-text) hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparkleIcon size={13} className="text-(--ai)" weight="fill" />
                {discoverMutation.isPending ? "Searching…" : "Discover"}
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
            onRowClick={(job) => {
              if (panel === job.id) navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
              else navigate({ search: (prev) => ({ ...prev, panel: job.id }) });
            }}
            pagination={pagination}
            searchQuery={searchQuery}
            onSearchChange={(v) => {
              setSearchQuery(v);
              setCurrentPage(1);
            }}
          />
        </div>

        <JobDetailPanel
          jobId={panel ?? null}
          onClose={() => navigate({ search: (prev) => ({ ...prev, panel: undefined }) })}
          onEdit={(job) => setFormMode(job)}
        />
      </div>
    </>
  );
}
