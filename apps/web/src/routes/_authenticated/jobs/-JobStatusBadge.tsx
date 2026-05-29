import type { JobStatusIntEnum, JobTypeIntEnum } from "@app/schemas";

const STATUS_META: Record<JobStatusIntEnum, { label: string; cls: string }> = {
  1: { label: "Not started", cls: "neutral" },
  2: { label: "Needs review", cls: "warning" },
  3: { label: "Accepted", cls: "success" },
  4: { label: "Applied", cls: "pipeline" },
  5: { label: "Company added", cls: "pipeline" },
  6: { label: "Interviewing", cls: "pipeline" },
  7: { label: "Offer", cls: "success" },
  8: { label: "Rejected", cls: "neutral" },
};

const CLS_MAP: Record<string, string> = {
  success: "bg-(--success-bg) text-(--success-text)",
  warning: "bg-(--warning-bg) text-(--warning-text)",
  pipeline: "bg-(--pipeline-bg) text-(--pipeline-text)",
  danger: "bg-(--danger-bg) text-(--danger-text)",
  neutral: "bg-(--surface-raised) text-(--text-secondary)",
};

interface JobStatusBadgeProps {
  status: JobStatusIntEnum;
  sm?: boolean;
}

export function JobStatusBadge({ status, sm }: JobStatusBadgeProps) {
  const meta = STATUS_META[status];
  if (!meta) return null;

  const colorCls = CLS_MAP[meta.cls] ?? CLS_MAP.neutral;
  const sizeCls = sm
    ? "h-4.5 px-1.5 text-[10px] rounded-[5px]"
    : "h-5 px-[7px] text-[11px] rounded-md";

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

interface JobTypeBadgeProps {
  type: JobTypeIntEnum;
  sm?: boolean;
}

export function JobTypeBadge({ type, sm }: JobTypeBadgeProps) {
  const sizeCls = sm
    ? "h-4.5 px-1.5 text-[10px] rounded-[5px]"
    : "h-5 px-[7px] text-[11px] rounded-md";

  if (type === 2) {
    return (
      <span
        className={[
          "inline-flex items-center gap-1 font-semibold whitespace-nowrap bg-(--ai-bg) text-(--ai-text)",
          sizeCls,
        ].join(" ")}
      >
        <span className="text-(--ai) text-[10px]">✦</span>
        LLM
      </span>
    );
  }

  return (
    <span
      className={[
        "inline-flex items-center font-semibold whitespace-nowrap bg-(--surface-raised) text-(--text-secondary)",
        sizeCls,
      ].join(" ")}
    >
      Manual
    </span>
  );
}
