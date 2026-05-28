import { Link } from "@tanstack/react-router";
import { WarningIcon } from "@phosphor-icons/react";
import { StatusBadge } from "./-StatusBadge";
import Avatar from "./-Avatar";
import type * as Schemas from "@app/schemas";

function MobileCompanyRow({ company }: { company: Schemas.Company }) {
  const score = company.weightedScore ?? 0;
  const max = 135;
  const hasEthicsFlag = company.isEthicsCompliant === false;

  return (
    <Link
      to="/companies/$companyId"
      params={{ companyId: String(company.id) }}
      className="flex items-center gap-3 py-3.5 px-4 bg-sidebar border-b border-border cursor-pointer active:bg-(--surface-raised)"
    >
      <Avatar name={company.name} />
      <div className="flex flex-col min-w-0 grow">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground truncate">{company.name}</span>
          {hasEthicsFlag && <WarningIcon size={13} className="text-(--warning) shrink-0" />}
        </div>
        <span className="text-xs text-(--text-secondary) mt-0.5 truncate">
          {[company.industry, company.size].filter(Boolean).join(" · ")}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {company.fitBand && <StatusBadge fit={company.fitBand} sm />}
        <span className="text-xs text-(--text-secondary)">
          {score}/{max}
        </span>
      </div>
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-(--text-secondary) shrink-0"
      >
        <path d="M9 6l6 6l-6 6" />
      </svg>
    </Link>
  );
}
export default MobileCompanyRow;
