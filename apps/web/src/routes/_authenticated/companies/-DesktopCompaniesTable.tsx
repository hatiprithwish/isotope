import { useState } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  CheckSquareIcon,
  SquareIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { AppTable } from "@/components/app-table";
import type { AppTableColumn } from "@/components/app-table";
import type * as Schemas from "@app/schemas";
import { StatusBadge } from "./-StatusBadge";
import { CompanyDetailPanel } from "./-DesktopPanel";
import { CompaniesFilterBar, applyFilters } from "./-CompaniesFilterBar";
import type { StatusFilter, FitFilter } from "./-CompaniesFilterBar";

interface Props {
  companies: Schemas.Company[];
  isLoading: boolean;
  isError: boolean;
  selectedCompany: Schemas.Company | null;
  onOpenPanel: (id: number) => void;
  onClosePanel: () => void;
  onAddClick: () => void;
  onBulkDelete: (ids: number[]) => void;
  isBulkPending: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function DesktopCompaniesTable({
  companies,
  isLoading,
  isError,
  selectedCompany,
  onOpenPanel,
  onClosePanel,
  onAddClick,
  onBulkDelete,
  isBulkPending,
  searchQuery,
  onSearchChange,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fitFilter, setFitFilter] = useState<FitFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());

  const filtered = applyFilters(companies, statusFilter, fitFilter);
  const allPageIds = filtered.map((c) => c.id);
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
  }

  function handleBulkDelete() {
    onBulkDelete(Array.from(selectedIds));
    clearSelection();
  }

  const COLUMNS: AppTableColumn<Schemas.Company>[] = [
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
      key: "name",
      header: "Name",
      cell: (row) => (
        <div>
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
            {row.name}
            {row.isEthicsCompliant === false && (
              <WarningIcon size={13} className="text-(--warning)" />
            )}
          </div>
          <div className="text-[11px] text-(--text-secondary) mt-0.5">{row.website}</div>
        </div>
      ),
    },
    {
      key: "industry",
      header: "Industry",
      cell: (row) => (
        <div>
          <div className="text-[12px] text-(--text-secondary)">{row.industry}</div>
          <div className="text-[11px] text-(--text-secondary) mt-0.5 opacity-70">{row.size}</div>
        </div>
      ),
    },
    {
      key: "fitBand",
      header: "Fit",
      cell: (row) => (row.fitBand ? <StatusBadge fit={row.fitBand} sm /> : null),
    },
    {
      key: "weightedScore",
      header: "Score",
      cell: (row) => {
        const score = row.weightedScore ?? 0;
        const max = 135;
        const pct = max > 0 ? Math.round((score / max) * 100) : 0;
        return (
          <div>
            <div className="text-[13px] font-semibold text-primary">
              {score}
              <span className="text-(--text-secondary) font-normal">/{max}</span>
            </div>
            <div className="text-[11px] text-(--text-secondary) mt-0.5">{pct}%</div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (row.status ? <StatusBadge status={row.status} sm /> : null),
    },
    {
      key: "updatedAt",
      header: "Updated",
      cell: (row) => (
        <span className="text-[11px] text-(--text-secondary)">
          {row.updatedAt
            ? new Date(row.updatedAt).toLocaleDateString()
            : row.createdAt
              ? new Date(row.createdAt).toLocaleDateString()
              : "—"}
        </span>
      ),
    },
  ];

  const toolbarLeft = someSelected ? (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[12px] font-medium text-foreground">{selectedIds.size} selected</span>
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
        {allSelected ? (
          <CheckSquareIcon size={16} weight="fill" className="text-primary" />
        ) : (
          <SquareIcon size={16} />
        )}
      </button>
      <CompaniesFilterBar
        companies={companies}
        statusFilter={statusFilter}
        fitFilter={fitFilter}
        filteredCount={filtered.length}
        onStatusChange={setStatusFilter}
        onFitChange={setFitFilter}
        onClear={() => {
          setStatusFilter("all");
          setFitFilter("all");
        }}
        inline
      />
      <div className="relative w-56">
        <MagnifyingGlassIcon
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search companies…"
          className="w-full h-6.5 pl-8 pr-3 rounded-md bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );

  return (
    <div className="hidden md:flex h-full overflow-hidden relative">
      <div className="flex flex-col overflow-hidden border-r border-border flex-1">
        <header className="h-13 px-6 flex items-center border-b border-border bg-sidebar shrink-0">
          <span className="text-base font-semibold text-foreground tracking-tight">Companies</span>
          <div className="ml-auto flex gap-2 items-center">
            <Button type="button" variant="default" size="lg" onClick={onAddClick}>
              <PlusIcon size={13} />
              Add
            </Button>
          </div>
        </header>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <AppTable<Schemas.Company>
            columns={COLUMNS}
            data={filtered}
            keyExtractor={(row) => String(row.id)}
            isLoading={isLoading}
            skeletonRows={5}
            errorMsg={isError ? "Failed to load companies. Please refresh." : undefined}
            onRowClick={(row) =>
              selectedCompany?.id === row.id ? onClosePanel() : onOpenPanel(row.id)
            }
            getRowClassName={(row) =>
              row.id === selectedCompany?.id ? "bg-sidebar" : "hover:bg-(--surface-raised)"
            }
            emptyState={
              companies.length === 0 ? "No companies yet." : "No companies match this filter."
            }
            stickyHeader
            flush
            toolbarLeft={toolbarLeft}
          />
        </div>
      </div>

      <CompanyDetailPanel
        companyId={selectedCompany?.id ?? null}
        company={selectedCompany}
        onClose={onClosePanel}
      />
    </div>
  );
}
