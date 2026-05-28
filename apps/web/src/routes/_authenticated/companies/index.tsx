import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useState } from "react";
import { z } from "zod";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { CompaniesQueries } from "./-data";
import MobileCompanyRow from "./-MobileCompanyRow";
import DesktopCompanyRow from "./-DesktopCompanyRow";
import DesktopPanel from "./-DesktopPanel";
import AddCompanyModal from "./-AddCompanyModal";
import type * as Schemas from "@app/schemas";

const searchSchema = z.object({
  panel: z.number().optional(),
});

export const Route = createFileRoute("/_authenticated/companies/")({
  validateSearch: searchSchema,
  component: CompaniesPage,
});

type MobileFilter =
  | "all"
  | "needs_review"
  | "strong_fit"
  | "accepted"
  | "contacts_added"
  | "disqualified";
type StatusFilter = "all" | "waiting_human" | "accepted" | "contacts_added" | "rejected";
type FitFilter = "all" | "strong" | "conditional" | "weak" | "disqualified";

function applyFilters(
  companies: Schemas.Company[],
  statusFilter: StatusFilter,
  fitFilter: FitFilter,
): Schemas.Company[] {
  return companies.filter((c) => {
    const statusOk =
      statusFilter === "all" ||
      (statusFilter === "waiting_human" && c.status === 1) ||
      (statusFilter === "accepted" && c.status === 2) ||
      (statusFilter === "contacts_added" && c.status === 3) ||
      (statusFilter === "rejected" && c.status === 4);

    const fitOk =
      fitFilter === "all" ||
      (fitFilter === "strong" && c.fitBand === 1) ||
      (fitFilter === "conditional" && c.fitBand === 2) ||
      (fitFilter === "weak" && c.fitBand === 3) ||
      (fitFilter === "disqualified" && c.fitBand === 4);

    return statusOk && fitOk;
  });
}

function applyMobileFilter(companies: Schemas.Company[], filter: MobileFilter): Schemas.Company[] {
  switch (filter) {
    case "needs_review":
      return companies.filter((c) => c.status === 1);
    case "strong_fit":
      return companies.filter((c) => c.fitBand === 1);
    case "accepted":
      return companies.filter((c) => c.status === 2);
    case "contacts_added":
      return companies.filter((c) => c.status === 3);
    case "disqualified":
      return companies.filter((c) => c.fitBand === 4);
    default:
      return companies;
  }
}

function ChevronDown() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-70"
    >
      <path d="M6 9l6 6l6 -6" />
    </svg>
  );
}

function CompaniesPage() {
  const { getToken } = useAuth();
  const { panel } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [showAddModal, setShowAddModal] = useState(false);
  const [mobileFilter, setMobileFilter] = useState<MobileFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fitFilter, setFitFilter] = useState<FitFilter>("all");

  const { data, isPending, isError } = useQuery(CompaniesQueries.list(getToken));
  const companies = data?.companies ?? [];

  const selectedCompany = panel ? (companies.find((c) => c.id === panel) ?? null) : null;

  function openPanel(id: number) {
    navigate({ search: (prev) => ({ ...prev, panel: id }) });
  }

  function closePanel() {
    navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
  }

  const mobileFiltered = applyMobileFilter(companies, mobileFilter);
  const needsReview = mobileFiltered.filter((c) => c.status === 1);
  const inProgress = mobileFiltered.filter((c) => c.status !== 1);

  const desktopFiltered = applyFilters(companies, statusFilter, fitFilter);

  if (isPending) return <div className="p-6 text-(--text-secondary) text-sm">Loading...</div>;
  if (isError)
    return <div className="p-6 text-(--text-secondary) text-sm">Failed to load companies.</div>;

  const mobileChips: { label: string; filter: MobileFilter; count?: number }[] = [
    { label: "All", filter: "all", count: companies.length },
    {
      label: "Needs review",
      filter: "needs_review",
      count: companies.filter((c) => c.status === 1).length,
    },
    {
      label: "Strong fit",
      filter: "strong_fit",
      count: companies.filter((c) => c.fitBand === 1).length,
    },
    {
      label: "Accepted",
      filter: "accepted",
      count: companies.filter((c) => c.status === 2).length,
    },
    {
      label: "Contacts added",
      filter: "contacts_added",
      count: companies.filter((c) => c.status === 3).length,
    },
    {
      label: "Disqualified",
      filter: "disqualified",
      count: companies.filter((c) => c.fitBand === 4).length,
    },
  ];

  const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Needs review", value: "waiting_human" },
    { label: "Accepted", value: "accepted" },
    { label: "Contacts added", value: "contacts_added" },
    { label: "Rejected", value: "rejected" },
  ];

  const fitOptions: { label: string; value: FitFilter }[] = [
    { label: "All bands", value: "all" },
    { label: "Strong fit", value: "strong" },
    { label: "Conditional", value: "conditional" },
    { label: "Weak fit", value: "weak" },
    { label: "Disqualified", value: "disqualified" },
  ];

  return (
    <>
      {showAddModal && <AddCompanyModal onClose={() => setShowAddModal(false)} />}

      {/* ── MOBILE ─────────────────────────────────────────────── */}
      <div className="flex flex-col h-full md:hidden overflow-hidden">
        <header className="h-13 px-4 flex items-center gap-2 bg-background border-b border-border shrink-0">
          <span className="flex-1 text-[17px] font-semibold text-foreground tracking-tight">
            Companies
          </span>
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-(--text-secondary) hover:bg-(--surface-raised)"
          >
            <MagnifyingGlassIcon size={18} />
          </button>
        </header>

        {/* Mobile FAB */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
          aria-label="Add company"
        >
          <PlusIcon size={22} />
        </button>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border bg-background shrink-0 no-scrollbar">
          {mobileChips.map(({ label, filter, count }) => {
            const active = mobileFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setMobileFilter(filter)}
                className={[
                  "inline-flex items-center gap-1 h-8 px-3 rounded-full border text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors",
                  active
                    ? "bg-primary/10 border-primary text-primary font-semibold"
                    : "bg-sidebar border-border text-(--text-secondary)",
                ].join(" ")}
              >
                {label}
                {count !== undefined && count > 0 && (
                  <span
                    className={[
                      "inline-flex items-center justify-center min-w-4.5 h-4 px-1 rounded text-[10px] font-semibold",
                      active
                        ? "text-primary opacity-70"
                        : "bg-(--surface-raised) text-(--text-secondary)",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List body */}
        <div className="flex-1 overflow-y-auto bg-sidebar">
          {mobileFiltered.length === 0 ? (
            <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
              No companies match this filter.
            </div>
          ) : (
            <>
              {needsReview.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                      Needs review{" "}
                      <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[10px] font-semibold ml-1">
                        {needsReview.length}
                      </span>
                    </span>
                    <span className="text-[11px] font-medium text-(--text-secondary)">
                      Sort: Updated
                    </span>
                  </div>
                  {needsReview.map((co) => (
                    <MobileCompanyRow key={co.id} company={co} />
                  ))}
                </>
              )}
              {inProgress.length > 0 && (
                <>
                  <div className="px-4 pt-5 pb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                      In progress{" "}
                      <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[10px] font-semibold ml-1">
                        {inProgress.length}
                      </span>
                    </span>
                  </div>
                  {inProgress.map((co) => (
                    <MobileCompanyRow key={co.id} company={co} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── DESKTOP ────────────────────────────────────────────── */}
      <div className="hidden md:flex h-full overflow-hidden">
        <div className="flex flex-col overflow-hidden border-r border-border flex-1">
          {/* Topbar */}
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

          {/* Filter bar */}
          <div className="flex gap-2 items-center px-6 py-3.5 border-b border-border bg-background shrink-0">
            {/* Status dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="appearance-none inline-flex items-center gap-1.5 h-7 pl-2.75 pr-7 rounded-[7px] bg-background border border-border text-[12px] font-medium text-(--text-secondary) hover:border-foreground cursor-pointer outline-none transition-colors"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    Status: {o.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                <ChevronDown />
              </span>
            </div>
            {/* Fit dropdown */}
            <div className="relative">
              <select
                value={fitFilter}
                onChange={(e) => setFitFilter(e.target.value as FitFilter)}
                className="appearance-none inline-flex items-center gap-1.5 h-7 pl-2.75 pr-7 rounded-[7px] bg-background border border-border text-[12px] font-medium text-(--text-secondary) hover:border-foreground cursor-pointer outline-none transition-colors"
              >
                {fitOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    Fit: {o.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                <ChevronDown />
              </span>
            </div>
            {(statusFilter !== "all" || fitFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setFitFilter("all");
                }}
                className="text-[12px] font-medium text-(--text-secondary) hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
            <div className="flex-1" />
            <span className="text-[12px] font-medium text-(--text-secondary)">
              {desktopFiltered.length} {desktopFiltered.length === 1 ? "company" : "companies"}
            </span>
          </div>

          {/* Table */}
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

        {/* Right: panel */}
        {selectedCompany && (
          <div className="w-100 shrink-0">
            <DesktopPanel company={selectedCompany} onClose={closePanel} />
          </div>
        )}
      </div>
    </>
  );
}
