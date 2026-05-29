import { AppTable, AppTablePagination } from "@/components/app-table";
import type { AppTableColumn, AppTablePaginationProps } from "@/components/app-table";
import type * as Schemas from "@app/schemas";
import { JobStatusBadge, JobTypeBadge } from "./-JobStatusBadge";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

interface JobsTableProps {
  jobs: Schemas.Job[];
  isLoading: boolean;
  isError: boolean;
  selectedId: number | null;
  onRowClick: (job: Schemas.Job) => void;
  pagination: AppTablePaginationProps;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const COLUMNS: AppTableColumn<Schemas.Job>[] = [
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
    cell: (row) => <span className="text-[13px] text-(--text-secondary)">{row.salary ?? "—"}</span>,
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
    cell: (row) => <span className="text-[13px] text-(--text-secondary)">{row.source ?? "—"}</span>,
  },
  {
    key: "type",
    header: "Type",
    defaultHidden: true,
    cell: (row) => <JobTypeBadge type={row.type} />,
  },
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
}: JobsTableProps) {
  const searchInput = (
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
          toolbarLeft={searchInput}
        />
      </div>

      <AppTablePagination {...pagination} />
    </div>
  );
}
