import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { z } from "zod";
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon } from "@phosphor-icons/react";
import { CompaniesQueries } from "./-data";
import MobileCompanyRow from "./-MobileCompanyRow";
import DesktopCompanyRow from "./-DesktopCompanyRow";
import DesktopPanel from "./-DesktopPanel";

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

  const { data, isPending, isError } = useQuery(CompaniesQueries.list(getToken));
  const companies = data?.companies ?? [];

  const selectedCompany = panel ? (companies.find((c) => c.id === panel) ?? null) : null;

  function openPanel(id: number) {
    navigate({ search: (prev) => ({ ...prev, panel: id }) });
  }

  function closePanel() {
    navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
  }

  const needsReview = companies.filter((c) => c.status === 1);
  const inProgress = companies.filter((c) => c.status !== 1);

  if (isPending) return <div className="p-6 text-(--text-secondary) text-sm">Loading...</div>;
  if (isError)
    return <div className="p-6 text-(--text-secondary) text-sm">Failed to load companies.</div>;

  return (
    <>
      {/* ── MOBILE ─────────────────────────────────────────────── */}
      <div className="flex flex-col h-full md:hidden overflow-hidden">
        {/* Header */}
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
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-(--text-secondary) hover:bg-(--surface-raised)"
          >
            <FunnelIcon size={18} />
          </button>
        </header>

        {/* Chips */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border bg-background shrink-0 no-scrollbar">
          {[
            { label: "All", count: companies.length, active: true },
            { label: "Needs review", count: needsReview.length },
            {
              label: "Strong fit",
              count: companies.filter((c) => c.fitBand === 1).length,
            },
            { label: "Accepted" },
            { label: "Contacts added" },
            { label: "Disqualified" },
          ].map(({ label, count, active }) => (
            <button
              key={label}
              type="button"
              className={[
                "inline-flex items-center gap-1 h-8 px-3 rounded-full border text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors",
                active
                  ? "bg-(--accent-bg,var(--primary)/0.1) border-primary text-primary font-semibold"
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
          ))}
        </div>

        {/* List body */}
        <div className="flex-1 overflow-y-auto bg-sidebar">
          {companies.length === 0 ? (
            <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
              No companies yet.
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
        {/* Left: table */}
        <div
          className={[
            "flex flex-col overflow-hidden border-r border-border",
            selectedCompany ? "flex-1" : "flex-1",
          ].join(" ")}
        >
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
                className="h-7.75 px-3 flex items-center gap-1.5 rounded-lg text-[13px] font-medium border border-border text-foreground hover:bg-(--surface-raised) transition-colors"
              >
                <PlusIcon size={13} />
                Add company
              </button>
            </div>
          </header>

          {/* Filter bar */}
          <div className="flex gap-2 items-center px-6 py-3.5 border-b border-border bg-background shrink-0">
            {[
              { lbl: "Status:", val: "All" },
              { lbl: "Fit:", val: "All bands" },
              { lbl: "Updated:", val: "Anytime" },
            ].map(({ lbl, val }) => (
              <button
                key={lbl}
                type="button"
                className="inline-flex items-center gap-1.5 h-7 px-2.75 rounded-[7px] bg-background border border-border text-[12px] font-medium text-(--text-secondary) hover:border-foreground hover:text-foreground transition-colors"
              >
                <span className="text-(--text-secondary) opacity-70">{lbl}</span>
                <span className="text-foreground">{val}</span>
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
              </button>
            ))}
            <div className="flex-1" />
            <span className="text-[12px] font-medium text-(--text-secondary)">
              {companies.length} {companies.length === 1 ? "company" : "companies"}
            </span>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto bg-background">
            {companies.length === 0 ? (
              <div className="px-6 py-8 text-(--text-secondary) text-sm">No companies yet.</div>
            ) : (
              <>
                {/* Thead */}
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
                {companies.map((co) => (
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
