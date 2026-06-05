import { CheckCircleIcon } from "@phosphor-icons/react";
import { StatusBadge } from "../-StatusBadge";
import type * as Schemas from "@app/schemas";

interface Props {
  company: Schemas.Company;
}

export function PreFiltersCard({ company }: Props) {
  return (
    <div className="px-4 pb-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
        Stage 1 · Pre-filters
      </div>
      <div className="bg-sidebar border border-border rounded-[10px] overflow-hidden">
        {(
          [
            { label: "Salary band", pass: company.isSalaryMatch },
            { label: "Location", pass: company.isLocationMatch },
          ] as const
        ).map(({ label, pass }, i, arr) => (
          <div
            key={label}
            className={[
              "flex items-center gap-2.5 px-4 py-3.5",
              i < arr.length - 1 ? "border-b border-border" : "",
            ].join(" ")}
          >
            <CheckCircleIcon
              size={16}
              className={pass === true ? "text-(--success)" : "text-(--text-secondary)"}
            />
            <div className="flex-1">
              <div className="text-[13px] font-medium text-foreground leading-snug">{label}</div>
            </div>
            {pass !== null && pass !== undefined && (
              <span
                className={[
                  "inline-flex items-center h-4.5 px-1.5 rounded-[5px] text-[10px] font-semibold",
                  pass
                    ? "bg-(--success-bg) text-(--success-text)"
                    : "bg-(--danger-bg) text-(--danger-text)",
                ].join(" ")}
              >
                {pass ? "Pass" : "Fail"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
