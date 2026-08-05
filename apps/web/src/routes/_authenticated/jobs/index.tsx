import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useState, useDeferredValue, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  JobsQueries,
  useJobs,
  useJobsCount,
  useDiscoverJobs,
  useBulkDeleteJobs,
  useBulkUpdateJobs,
} from "./-data";
import { useBulkCreateStatusChangeNotes } from "../-status-change-notes-data";
import { StatusChangeEntityTypeEnum } from "@app/schemas";
import { FrameworkQueries } from "../../_without_nav/onboarding/job-search-framework/-data";
import { ApiError } from "@/providers/apiClient";
import { JobsTable } from "./-JobsTable";
import { JobDetailPanel } from "./-JobDetailDrawer";
import AddOrEditJobModal from "./-AddOrEditJobModal";
import { MobileJobsList } from "./-MobileJobsList";
import { useAddShortcut } from "@/hooks/useAddShortcut";
import { SparkleIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import type * as Schemas from "@app/schemas";
import { JobStatusIntEnum, JobStatusLabelEnum, SavedFilterEntityTypeIntEnum } from "@app/schemas";
import { SavedFilterBar } from "../-SavedFilterBar";
import { parseFilterParam, serializeFilterParam, type FilterOption } from "../-table-filters";

const PAGE_SIZE = 20;

const searchSchema = z.object({
  panel: z.number().optional(),
  framework_saved: z.string().optional(),
  statuses: z.string().optional(),
  savedFilter: z.number().optional(),
});

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: JobStatusIntEnum.NotStarted, label: JobStatusLabelEnum.NotStarted },
  { value: JobStatusIntEnum.WaitingForHuman, label: JobStatusLabelEnum.WaitingForHuman },
  { value: JobStatusIntEnum.Accepted, label: JobStatusLabelEnum.Accepted },
  { value: JobStatusIntEnum.Applied, label: JobStatusLabelEnum.Applied },
  { value: JobStatusIntEnum.CompanyAdded, label: JobStatusLabelEnum.CompanyAdded },
  { value: JobStatusIntEnum.Interviewing, label: JobStatusLabelEnum.Interviewing },
  { value: JobStatusIntEnum.Offer, label: JobStatusLabelEnum.Offer },
  { value: JobStatusIntEnum.Rejected, label: JobStatusLabelEnum.Rejected },
];

export const Route = createFileRoute("/_authenticated/jobs/")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Jobs · Isotope" }] }),
  component: JobsPage,
});

function JobsPage() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { panel, framework_saved, statuses: statusesParam, savedFilter } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const statuses = parseFilterParam(statusesParam);

  const frameworkQuery = useQuery(FrameworkQueries.latest(getToken));
  const hasFramework = Boolean(frameworkQuery.data?.framework?.isCustomized);
  const discoverMutation = useDiscoverJobs();
  const bulkDeleteMutation = useBulkDeleteJobs();
  const bulkUpdateMutation = useBulkUpdateJobs();
  const bulkCreateStatusChangeNotes = useBulkCreateStatusChangeNotes();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [formMode, setFormMode] = useState<null | "create" | Schemas.Job>(null);
  const [mobileSearch, setMobileSearch] = useState(false);

  const countParams: Schemas.GetJobsApiRequest = {
    searchText: deferredQuery || undefined,
    statuses: statuses.length > 0 ? statuses : undefined,
  };
  const { data: countData } = useJobsCount(countParams);

  const totalRecords = countData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  // Paging is server-side: the API returns exactly the rows for `safePage`.
  const { data, isPending, isError } = useJobs({
    ...countParams,
    pageNo: safePage,
    pageSize: PAGE_SIZE,
  });

  const pageJobs: Schemas.Job[] = data?.jobs ?? [];

  function handleStatusesChange(next: number[]) {
    setCurrentPage(1);
    void navigate({
      search: (prev) => ({ ...prev, statuses: serializeFilterParam(next) }),
    });
  }

  function handleApplySavedFilter(applied: Schemas.SavedFilterWithLabel | null) {
    setCurrentPage(1);
    void navigate({
      search: (prev) => ({
        ...prev,
        statuses: applied ? serializeFilterParam(applied.criteria.statuses ?? []) : undefined,
        savedFilter: applied?.id,
      }),
    });
  }

  const filterBar = (
    <SavedFilterBar
      entityType={SavedFilterEntityTypeIntEnum.Job}
      statusOptions={STATUS_FILTER_OPTIONS}
      statuses={statuses}
      onStatusesChange={handleStatusesChange}
      activeSavedFilterId={savedFilter ?? null}
      onApplySavedFilter={handleApplySavedFilter}
    />
  );

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

  useAddShortcut(() => setFormMode((mode) => mode ?? "create"));

  function handleFormSuccess() {
    setFormMode(null);
    void handleRefresh();
  }

  async function handleBulkDelete(ids: number[]) {
    const response = await bulkDeleteMutation.mutateAsync({ ids });
    toast.success(`${response.deletedCount ?? ids.length} job(s) deleted.`);
    if (panel != null && ids.includes(panel)) {
      void navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
    }
  }

  async function handleBulkStatusUpdate(
    ids: number[],
    status: JobStatusIntEnum,
    note: string | null,
  ) {
    const response = await bulkUpdateMutation.mutateAsync({ ids, status });
    toast.success(`${response.updatedCount ?? ids.length} job(s) updated.`);
    // Only the ids the DAL actually confirmed updated — not the raw request list, which may
    // include ids that matched no row (wrong owner, already deleted, stale client state).
    const updatedIds = response.updatedIds ?? [];
    if (updatedIds.length > 0) {
      await bulkCreateStatusChangeNotes.mutateAsync({
        entityType: StatusChangeEntityTypeEnum.Job,
        entityIds: updatedIds,
        toStatus: status,
        note,
      });
    }
  }

  function handlePanelDelete(_id: number) {
    void navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
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
      {formMode !== null &&
        (formMode === "create" ? (
          <AddOrEditJobModal
            mode="add"
            onSuccess={handleFormSuccess}
            onClose={() => setFormMode(null)}
          />
        ) : (
          <AddOrEditJobModal
            mode="edit"
            job={formMode}
            onSuccess={handleFormSuccess}
            onClose={() => setFormMode(null)}
          />
        ))}

      <MobileJobsList
        allJobs={pageJobs}
        isPending={isPending}
        isError={isError}
        searchQuery={searchQuery}
        deferredQuery={deferredQuery}
        mobileSearch={mobileSearch}
        filterBar={filterBar}
        discoverPending={discoverMutation.isPending}
        isBulkPending={bulkDeleteMutation.isPending || bulkUpdateMutation.isPending}
        onSearchToggle={() => setMobileSearch((s) => !s)}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        onDiscoverClick={() => void handleDiscoverClick()}
        onRowClick={(job) => navigate({ to: "/jobs/$jobId", params: { jobId: String(job.id) } })}
        onAddClick={() => setFormMode("create")}
        onBulkDelete={(ids) => void handleBulkDelete(ids)}
        onBulkStatusUpdate={(ids, status, note) => handleBulkStatusUpdate(ids, status, note)}
      />

      <div className="hidden md:flex h-full overflow-hidden relative">
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="h-13 px-6 flex items-center justify-between border-b border-border bg-sidebar shrink-0">
            <span className="text-base font-semibold text-foreground tracking-tight">Jobs</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => void handleDiscoverClick()}
                disabled={discoverMutation.isPending}
                className="bg-(--ai-bg) border-(--ai-border) text-(--ai-text) hover:bg-(--ai-bg)"
              >
                <SparkleIcon size={13} className="text-(--ai)" weight="fill" />
                {discoverMutation.isPending ? "Searching…" : "Discover"}
              </Button>
              <Button type="button" size="lg" onClick={() => setFormMode("create")}>
                <PlusIcon size={13} />
                Add
              </Button>
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
            filterBar={filterBar}
            onSearchChange={(v) => {
              setSearchQuery(v);
              setCurrentPage(1);
            }}
            onBulkDelete={(ids) => void handleBulkDelete(ids)}
            onBulkStatusUpdate={(ids, status, note) => handleBulkStatusUpdate(ids, status, note)}
            isBulkPending={bulkDeleteMutation.isPending || bulkUpdateMutation.isPending}
          />
        </div>

        <JobDetailPanel
          jobId={panel ?? null}
          onClose={() => navigate({ search: (prev) => ({ ...prev, panel: undefined }) })}
          onEdit={(job) => setFormMode(job)}
          onDelete={handlePanelDelete}
        />
      </div>
    </>
  );
}
