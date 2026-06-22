import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useState } from "react";
import { z } from "zod";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  CheckSquareIcon,
  SquareIcon,
} from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { toast } from "sonner";
import { CompaniesQueries, useBulkDeleteCompanies } from "./-data";
import DesktopCompanyRow from "./-DesktopCompanyRow";
import { CompanyDetailPanel } from "./-DesktopPanel";
import AddOrEditCompanyModal from "./-AddOrEditCompanyModal";
import { MobileCompaniesList } from "./-MobileCompaniesList";
import { CompaniesFilterBar, applyFilters } from "./-CompaniesFilterBar";
import type { StatusFilter, FitFilter } from "./-CompaniesFilterBar";

const searchSchema = z.object({
  panel: z.number().optional(),
});

export const Route = createFileRoute("/_authenticated/companies/")({
  validateSearch: searchSchema,
  component: CompaniesPage,
});

function CompaniesPage() {
  const { getToken } = useAuth();
  const { panel } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fitFilter, setFitFilter] = useState<FitFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const bulkDeleteMutation = useBulkDeleteCompanies();

  const { data, isPending, isError } = useQuery(CompaniesQueries.list(getToken));
  const companies = data?.companies ?? [];
  const selectedCompany = panel ? (companies.find((c) => c.id === panel) ?? null) : null;
  const desktopFiltered = applyFilters(companies, statusFilter, fitFilter);

  const allPageIds = desktopFiltered.map((c) => c.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  function openPanel(id: number) {
    navigate({ search: (prev) => ({ ...prev, panel: id }) });
  }

  function closePanel() {
    navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
  }

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

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    const response = await bulkDeleteMutation.mutateAsync(ids);
    toast.success(`${response.deletedCount ?? ids.length} company(s) deleted.`);
    clearSelection();
    if (panel != null && ids.includes(panel)) {
      void navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
    }
  }

  if (isPending) return <div className="p-6 text-(--text-secondary) text-sm">Loading...</div>;
  if (isError)
    return <div className="p-6 text-(--text-secondary) text-sm">Failed to load companies.</div>;

  return (
    <>
      {showAddModal && <AddOrEditCompanyModal mode="add" onClose={() => setShowAddModal(false)} />}

      <MobileCompaniesList companies={companies} onAddClick={() => setShowAddModal(true)} />

      <div className="hidden md:flex h-full overflow-hidden relative">
        <div className="flex flex-col overflow-hidden border-r border-border flex-1">
          <header className="h-13 px-6 flex items-center border-b border-border bg-sidebar shrink-0">
            <span className="text-base font-semibold text-foreground tracking-tight">
              Companies
            </span>
            <div className="ml-auto flex gap-2 items-center">
              <Button type="button" variant="ghost" size="icon">
                <MagnifyingGlassIcon size={14} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setShowAddModal(true)}
              >
                <PlusIcon size={13} />
                Add company
              </Button>
            </div>
          </header>

          {someSelected ? (
            <div className="flex gap-2 items-center px-6 py-3.5 border-b border-border bg-background shrink-0">
              <span className="text-[12px] font-medium text-foreground">
                {selectedIds.size} selected
              </span>
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => void handleBulkDelete()}
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
            <CompaniesFilterBar
              companies={companies}
              statusFilter={statusFilter}
              fitFilter={fitFilter}
              filteredCount={desktopFiltered.length}
              onStatusChange={setStatusFilter}
              onFitChange={setFitFilter}
              onClear={() => {
                setStatusFilter("all");
                setFitFilter("all");
              }}
            />
          )}

          <div className="flex-1 overflow-auto bg-background">
            {desktopFiltered.length === 0 ? (
              <div className="px-6 py-8 text-(--text-secondary) text-sm">
                {companies.length === 0 ? "No companies yet." : "No companies match this filter."}
              </div>
            ) : (
              <>
                <div
                  className="grid items-center px-6 border-b border-border bg-sidebar h-10.5 text-[11px] font-semibold uppercase tracking-wider text-(--text-secondary) sticky top-0"
                  style={{ gridTemplateColumns: "32px 2fr 1.4fr 100px 110px 110px 90px" }}
                >
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="Select all"
                  >
                    {allSelected ? (
                      <CheckSquareIcon size={16} weight="fill" className="text-primary" />
                    ) : (
                      <SquareIcon size={16} />
                    )}
                  </button>
                  <div>Name</div>
                  <div>Industry</div>
                  <div>Fit</div>
                  <div>Score</div>
                  <div>Status</div>
                  <div>Updated</div>
                </div>
                {desktopFiltered.map((co) => (
                  <DesktopCompanyRow
                    key={co.id}
                    company={co}
                    active={selectedCompany?.id === co.id}
                    selected={selectedIds.has(co.id)}
                    onSelect={(e) => {
                      e.stopPropagation();
                      toggleOne(co.id);
                    }}
                    onClick={() =>
                      selectedCompany?.id === co.id ? closePanel() : openPanel(co.id)
                    }
                  />
                ))}
              </>
            )}
          </div>
        </div>

        <CompanyDetailPanel
          companyId={selectedCompany?.id ?? null}
          company={selectedCompany}
          onClose={closePanel}
        />
      </div>
    </>
  );
}
