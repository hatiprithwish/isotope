import type { CompanyStatusIntEnum, CompanyFitBandIntEnum } from "@app/schemas";

const STATUS_META: Record<CompanyStatusIntEnum, { label: string; cls: string }> = {
  1: { label: "Needs review", cls: "warning" },
  2: { label: "Accepted", cls: "success" },
  3: { label: "Contacts added", cls: "pipeline" },
  4: { label: "Rejected", cls: "neutral" },
  5: { label: "Interviewed", cls: "pipeline" },
  6: { label: "Offer", cls: "success" },
};

const FIT_META: Record<CompanyFitBandIntEnum, { label: string; cls: string }> = {
  1: { label: "Strong fit", cls: "success" },
  2: { label: "Conditional", cls: "warning" },
  3: { label: "Weak fit", cls: "neutral" },
  4: { label: "Disqualified", cls: "danger" },
};

const CLS_MAP: Record<string, string> = {
  success: "bg-(--success-bg) text-(--success-text)",
  warning: "bg-(--warning-bg) text-(--warning-text)",
  pipeline: "bg-(--pipeline-bg) text-(--pipeline-text)",
  danger: "bg-(--danger-bg) text-(--danger-text)",
  neutral: "bg-(--surface-raised) text-(--text-secondary)",
};

interface StatusBadgeProps {
  status?: CompanyStatusIntEnum | null;
  fit?: CompanyFitBandIntEnum | null;
  sm?: boolean;
}

export function StatusBadge({ status, fit, sm }: StatusBadgeProps) {
  const meta = status != null ? STATUS_META[status] : fit != null ? FIT_META[fit] : null;
  if (!meta) return null;

  const colorCls = CLS_MAP[meta.cls] ?? CLS_MAP.neutral;
  const sizeCls = sm
    ? "h-4.5 px-1.5 text-[10px] rounded-[5px]"
    : "h-5.5 px-2 text-[11px] rounded-md";

  return (
    <span
      className={[
        "inline-flex items-center font-semibold whitespace-nowrap",
        sizeCls,
        colorCls,
      ].join(" ")}
    >
      {meta.label}
    </span>
  );
}
