import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useState } from "react";
import { z } from "zod";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { CompaniesQueries } from "./-data";
import DesktopCompanyRow from "./-DesktopCompanyRow";
import DesktopPanel from "./-DesktopPanel";
import AddCompanyModal from "./-AddCompanyModal";
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

  const { data, isPending, isError } = useQuery(CompaniesQueries.list(getToken));
  const companies = data?.companies ?? [];
  const selectedCompany = panel ? (companies.find((c) => c.id === panel) ?? null) : null;
  const desktopFiltered = applyFilters(companies, statusFilter, fitFilter);

  function openPanel(id: number) {
    navigate({ search: (prev) => ({ ...prev, panel: id }) });
  }

  function closePanel() {
    navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
  }

  if (isPending) return <div className="p-6 text-(--text-secondary) text-sm">Loading...</div>;
  if (isError)
    return <div className="p-6 text-(--text-secondary) text-sm">Failed to load companies.</div>;

  return (
    <>
      {showAddModal && <AddCompanyModal onClose={() => setShowAddModal(false)} />}

      <MobileCompaniesList companies={companies} onAddClick={() => setShowAddModal(true)} />

      <div className="hidden md:flex h-full overflow-hidden">
        <div className="flex flex-col overflow-hidden border-r border-border flex-1">
          <header className="h-13 px-6 flex items-center border-b border-border bg-sidebar shrink-0">
            <span className="text-base font-semibold text-foreground tracking-tight">
              Companies
            </span>
            <div className="ml-auto flex gap-2 items-center">
              <button
                type="button"
                className="h-7.75 w-7.75 flex items-center justify-center rounded-lg text-(--text-secondary) hover:bg-(--surface-raised) border border-transparent transition-colors"
              >
                <MagnifyingGlassIcon size={14} />
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="h-7.75 px-3 flex items-center gap-1.5 rounded-lg text-[13px] font-medium border border-border text-foreground hover:bg-(--surface-raised) transition-colors"
              >
                <PlusIcon size={13} />
                Add company
              </button>
            </div>
          </header>

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

          <div className="flex-1 overflow-auto bg-background">
            {desktopFiltered.length === 0 ? (
              <div className="px-6 py-8 text-(--text-secondary) text-sm">
                {companies.length === 0 ? "No companies yet." : "No companies match this filter."}
              </div>
            ) : (
              <>
                <div
                  className="grid items-center px-6 border-b border-border bg-sidebar h-10.5 text-[11px] font-semibold uppercase tracking-wider text-(--text-secondary) sticky top-0"
                  style={{ gridTemplateColumns: "2fr 1.4fr 100px 110px 110px 90px" }}
                >
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
                    onClick={() =>
                      selectedCompany?.id === co.id ? closePanel() : openPanel(co.id)
                    }
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {selectedCompany && (
          <div className="w-100 shrink-0">
            <DesktopPanel company={selectedCompany} onClose={closePanel} />
          </div>
        )}
      </div>
    </>
  );
}
