import { Link } from "@tanstack/react-router";
import { WarningIcon } from "@phosphor-icons/react";
import { StatusBadge } from "./-StatusBadge";
import Avatar from "./-Avatar";
import {
  MOBILE_LIST_ROW_CLASS,
  MobileListRowCheckbox,
  MobileListRowChevron,
  MobileListRowShell,
} from "../-MobileListRow";
import type * as Schemas from "@app/schemas";

interface MobileCompanyRowProps {
  company: Schemas.Company;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
}

function MobileCompanyRow({
  company,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: MobileCompanyRowProps) {
  const score = company.weightedScore ?? 0;
  const max = 135;
  const hasEthicsFlag = company.isEthicsCompliant === false;

  const content = (
    <>
      {selectMode && (
        <MobileListRowCheckbox selected={selected} onToggle={() => onToggleSelect?.(company.id)} />
      )}
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
      {!selectMode && <MobileListRowChevron />}
    </>
  );

  if (selectMode) {
    return (
      <MobileListRowShell role="button" onActivate={() => onToggleSelect?.(company.id)}>
        {content}
      </MobileListRowShell>
    );
  }

  return (
    <Link
      to="/companies/$companyId"
      params={{ companyId: String(company.id) }}
      className={MOBILE_LIST_ROW_CLASS}
    >
      {content}
    </Link>
  );
}
export default MobileCompanyRow;
