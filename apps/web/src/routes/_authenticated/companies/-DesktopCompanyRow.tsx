import { WarningIcon } from "@phosphor-icons/react";
import { StatusBadge } from "./-StatusBadge";
import type * as Schemas from "@app/schemas";

function DesktopCompanyRow({
  company,
  active,
  onClick,
}: {
  company: Schemas.Company;
  active: boolean;
  onClick: () => void;
}) {
  const score = company.weightedScore ?? 0;
  const max = 135;
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const hasEthicsFlag = company.isEthicsCompliant === false;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={[
        "grid items-center px-6 border-b border-border h-12.5 cursor-pointer transition-colors duration-100",
        active ? "bg-sidebar" : "bg-sidebar hover:bg-(--surface-raised)",
      ].join(" ")}
      style={{ gridTemplateColumns: "2fr 1.4fr 100px 110px 110px 90px" }}
    >
      {/* Name */}
      <div>
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
          {company.name}
          {hasEthicsFlag && <WarningIcon size={13} className="text-(--warning)" />}
        </div>
        <div className="text-[11px] text-(--text-secondary) mt-0.5">{company.website}</div>
      </div>
      {/* Industry */}
      <div>
        <div className="text-[12px] text-(--text-secondary)">{company.industry}</div>
        <div className="text-[11px] text-(--text-secondary) mt-0.5 opacity-70">{company.size}</div>
      </div>
      {/* Fit */}
      <div>{company.fitBand && <StatusBadge fit={company.fitBand} sm />}</div>
      {/* Score */}
      <div>
        <div className="text-[13px] font-semibold text-primary">
          {score}
          <span className="text-(--text-secondary) font-normal">/{max}</span>
        </div>
        <div className="text-[11px] text-(--text-secondary) mt-0.5">{pct}%</div>
      </div>
      {/* Status */}
      <div>{company.status && <StatusBadge status={company.status} sm />}</div>
      {/* Updated */}
      <div className="text-[11px] text-(--text-secondary)">
        {company.updatedAt
          ? new Date(company.updatedAt).toLocaleDateString()
          : company.createdAt
            ? new Date(company.createdAt).toLocaleDateString()
            : "—"}
      </div>
    </div>
  );
}
export default DesktopCompanyRow;
