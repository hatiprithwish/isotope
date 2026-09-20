import { StatusBadge } from "./-StatusBadge";
import Avatar from "./-Avatar";
import { MobileListRowCheckbox, MobileListRowChevron, MobileListRowShell } from "../-MobileListRow";
import type * as Schemas from "@app/schemas";

interface MobileCompanyRowProps {
  company: Schemas.Company;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
  onOpen: (id: number) => void;
}

function MobileCompanyRow({
  company,
  selectMode = false,
  selected = false,
  onToggleSelect,
  onOpen,
}: MobileCompanyRowProps) {
  const content = (
    <>
      {selectMode && (
        <MobileListRowCheckbox selected={selected} onToggle={() => onToggleSelect?.(company.id)} />
      )}
      <Avatar name={company.name} />
      <div className="flex flex-col min-w-0 grow">
        <span className="text-sm font-semibold text-foreground truncate">{company.name}</span>
        <span className="text-xs text-(--text-secondary) mt-0.5 truncate">
          {[company.industry, company.size].filter(Boolean).join(" · ")}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {company.status && <StatusBadge status={company.status} sm />}
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
    <MobileListRowShell role="button" onActivate={() => onOpen(company.id)}>
      {content}
    </MobileListRowShell>
  );
}
export default MobileCompanyRow;
