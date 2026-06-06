import { useState } from "react";
import { AppTable, AppTablePagination } from "@/components/app-table";
import type { AppTableColumn, AppTablePaginationProps } from "@/components/app-table";
import type * as Schemas from "@app/schemas";
import { JobStatusBadge, JobTypeBadge } from "./-JobStatusBadge";
import { MagnifyingGlassIcon, TrashIcon, CheckSquareIcon, SquareIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { JobStatusIntEnum, JobStatusLabelEnum } from "@app/schemas";

interface JobsTableProps {
  jobs: Schemas.Job[];
  isLoading: boolean;
  isError: boolean;
  selectedId: number | null;
  onRowClick: (job: Schemas.Job) => void;
  pagination: AppTablePaginationProps;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onBulkDelete: (ids: number[]) => void;
  onBulkStatusUpdate: (ids: number[], status: Schemas.JobStatusIntEnum) => void;
  isBulkPending: boolean;
}

const STATUS_OPTIONS: { value: JobStatusIntEnum; label: string }[] = [
  { value: JobStatusIntEnum.NotStarted, label: JobStatusLabelEnum.NotStarted },
  { value: JobStatusIntEnum.WaitingForHuman, label: JobStatusLabelEnum.WaitingForHuman },
  { value: JobStatusIntEnum.Accepted, label: JobStatusLabelEnum.Accepted },
  { value: JobStatusIntEnum.Applied, label: JobStatusLabelEnum.Applied },
  { value: JobStatusIntEnum.CompanyAdded, label: JobStatusLabelEnum.CompanyAdded },
  { value: JobStatusIntEnum.Interviewing, label: JobStatusLabelEnum.Interviewing },
  { value: JobStatusIntEnum.Offer, label: JobStatusLabelEnum.Offer },
  { value: JobStatusIntEnum.Rejected, label: JobStatusLabelEnum.Rejected },
];

export function JobsTable({
  jobs,
  isLoading,
  isError,
  selectedId,
  onRowClick,
  pagination,
  searchQuery,
  onSearchChange,
  onBulkDelete,
  onBulkStatusUpdate,
  isBulkPending,
}: JobsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");

  const allPageIds = jobs.map((j) => j.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allPageIds));
    }
  }

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
  }

  function handleBulkDelete() {
    onBulkDelete(Array.from(selectedIds));
    clearSelection();
  }

  function handleBulkStatusApply() {
    if (!bulkStatus) return;
    onBulkStatusUpdate(Array.from(selectedIds), Number(bulkStatus) as Schemas.JobStatusIntEnum);
    clearSelection();
  }

  const COLUMNS: AppTableColumn<Schemas.Job>[] = [
    {
      key: "_select",
      header: "",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleOne(row.id);
          }}
          className="flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={selectedIds.has(row.id) ? "Deselect row" : "Select row"}
        >
          {selectedIds.has(row.id) ? (
            <CheckSquareIcon size={16} weight="fill" className="text-primary" />
          ) : (
            <SquareIcon size={16} />
          )}
        </button>
      ),
    },
    {
      key: "title",
      header: "Title",
      cell: (row) => (
        <span className="text-[13px] font-medium text-foreground leading-tight">{row.title}</span>
      ),
    },
    {
      key: "companyId",
      header: "Company",
      cell: (row) =>
        row.companyId && row.companyName ? (
          <a
            href={`/companies?panel=${row.companyId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[13px] text-primary hover:underline"
          >
            {row.companyName}
          </a>
        ) : (
          <span className="text-[13px] text-(--text-secondary)">—</span>
        ),
    },
    {
      key: "location",
      header: "Location",
      cell: (row) => (
        <span className="text-[13px] text-(--text-secondary)">{row.location ?? "—"}</span>
      ),
    },
    {
      key: "salary",
      header: "Salary",
      cell: (row) => (
        <span className="text-[13px] text-(--text-secondary)">{row.salary ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <JobStatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      header: "Created On",
      cell: (row) => (
        <span className="text-[11px] text-(--text-secondary)">
          {new Date(row.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      defaultHidden: true,
      cell: (row) => (
        <span className="text-[13px] text-(--text-secondary)">{row.source ?? "—"}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      defaultHidden: true,
      cell: (row) => <JobTypeBadge type={row.type} />,
    },
  ];

  const bulkActionBar = someSelected ? (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[12px] font-medium text-foreground">{selectedIds.size} selected</span>
      <div className="flex items-center gap-1.5">
        <select
          value={bulkStatus}
          onChange={(e) => setBulkStatus(e.target.value)}
          className="h-6.5 px-2 rounded-md border border-border bg-background text-[12px] text-foreground focus:outline-none focus:border-primary"
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
          onClick={handleBulkStatusApply}
        >
          Apply
        </Button>
      </div>
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
      <button
        type="button"
        onClick={clearSelection}
        className="text-[12px] text-(--text-secondary) hover:text-foreground underline-offset-2 hover:underline"
      >
        Clear
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleAll}
        className="flex items-center justify-center text-muted-foreground hover:text-foreground"
        aria-label="Select all"
        title="Select all"
      >
        <SquareIcon size={16} />
      </button>
      <div className="relative w-56">
        <MagnifyingGlassIcon
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search jobs…"
          className="w-full h-6.5 pl-8 pr-3 rounded-md bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <AppTable<Schemas.Job>
          columns={COLUMNS}
          data={jobs}
          keyExtractor={(row) => String(row.id)}
          isLoading={isLoading}
          skeletonRows={5}
          errorMsg={isError ? "Failed to load jobs. Please refresh." : undefined}
          onRowClick={onRowClick}
          getRowClassName={(row) =>
            row.id === selectedId ? "bg-sidebar" : "hover:bg-(--surface-raised)"
          }
          stickyHeader
          flush
          toolbarLeft={bulkActionBar}
        />
      </div>

      <AppTablePagination {...pagination} />
    </div>
  );
}
