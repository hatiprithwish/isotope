import type { ContactStatusIntEnum, ContactSourceIntEnum } from "@app/schemas";

const STATUS_META: Record<ContactStatusIntEnum, { label: string; cls: string }> = {
  1: { label: "Not started", cls: "neutral" },
  2: { label: "Draft ready", cls: "accent" },
  3: { label: "In pipeline", cls: "pipeline" },
  4: { label: "Replied", cls: "success" },
  5: { label: "Closed", cls: "success" },
  6: { label: "Dead", cls: "neutral" },
  7: { label: "Re-engage", cls: "warning" },
  8: { label: "Failed", cls: "danger" },
};

const SOURCE_META: Record<ContactSourceIntEnum, { label: string; cls: string }> = {
  1: { label: "Apollo", cls: "neutral" },
  2: { label: "Manual", cls: "neutral" },
};

const CLS_MAP: Record<string, string> = {
  accent: "bg-(--accent-bg) text-(--accent-text)",
  success: "bg-(--success-bg) text-(--success-text)",
  warning: "bg-(--warning-bg) text-(--warning-text)",
  pipeline: "bg-(--pipeline-bg) text-(--pipeline-text)",
  danger: "bg-(--danger-bg) text-(--danger-text)",
  neutral: "bg-(--surface-raised) text-(--text-secondary)",
};

interface StatusBadgeProps {
  status?: ContactStatusIntEnum | null;
  source?: ContactSourceIntEnum | null;
  sm?: boolean;
}

export function StatusBadge({ status, source, sm }: StatusBadgeProps) {
  const meta = status != null ? STATUS_META[status] : source != null ? SOURCE_META[source] : null;
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
