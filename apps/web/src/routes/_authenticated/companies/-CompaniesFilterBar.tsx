import type * as Schemas from "@app/schemas";
import { Button } from "@/shadcn/ui/button";

type StatusFilter = "all" | "waiting_human" | "accepted" | "contacts_added" | "rejected";
type FitFilter = "all" | "strong" | "conditional" | "weak" | "disqualified";

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

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Needs review", value: "waiting_human" },
  { label: "Accepted", value: "accepted" },
  { label: "Contacts added", value: "contacts_added" },
  { label: "Rejected", value: "rejected" },
];

const FIT_OPTIONS: { label: string; value: FitFilter }[] = [
  { label: "All bands", value: "all" },
  { label: "Strong fit", value: "strong" },
  { label: "Conditional", value: "conditional" },
  { label: "Weak fit", value: "weak" },
  { label: "Disqualified", value: "disqualified" },
];

interface Props {
  companies: Schemas.Company[];
  statusFilter: StatusFilter;
  fitFilter: FitFilter;
  filteredCount: number;
  onStatusChange: (v: StatusFilter) => void;
  onFitChange: (v: FitFilter) => void;
  onClear: () => void;
  /** Renders just the filter controls without the standalone bar wrapper — for embedding in another toolbar. */
  inline?: boolean;
}

export function CompaniesFilterBar({
  statusFilter,
  fitFilter,
  filteredCount,
  onStatusChange,
  onFitChange,
  onClear,
  inline,
}: Props) {
  const controls = (
    <>
      <div className="relative">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
          className="appearance-none inline-flex items-center gap-1.5 h-7 pl-2.75 pr-7 rounded-[7px] bg-background border border-border text-[12px] font-medium text-(--text-secondary) hover:border-foreground cursor-pointer outline-none transition-colors"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Status: {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          <ChevronDown />
        </span>
      </div>
      <div className="relative">
        <select
          value={fitFilter}
          onChange={(e) => onFitChange(e.target.value as FitFilter)}
          className="appearance-none inline-flex items-center gap-1.5 h-7 pl-2.75 pr-7 rounded-[7px] bg-background border border-border text-[12px] font-medium text-(--text-secondary) hover:border-foreground cursor-pointer outline-none transition-colors"
        >
          {FIT_OPTIONS.map((o) => (
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
        <Button type="button" variant="ghost" size="xs" onClick={onClear}>
          Clear
        </Button>
      )}
    </>
  );

  if (inline) {
    return <div className="flex gap-2 items-center">{controls}</div>;
  }

  return (
    <div className="flex gap-2 items-center px-6 py-3.5 border-b border-border bg-background shrink-0">
      {controls}
      <div className="flex-1" />
      <span className="text-[12px] font-medium text-(--text-secondary)">
        {filteredCount} {filteredCount === 1 ? "company" : "companies"}
      </span>
    </div>
  );
}

export type { StatusFilter, FitFilter };

export function applyFilters(
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
