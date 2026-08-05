import { Link } from "@tanstack/react-router";
import { Checkbox } from "@/shadcn/ui/checkbox";
import * as Schemas from "@app/schemas"; // runtime `import *`: consumes CONTACT_HISTORY_CHANNEL_LABEL_MAP alongside types.
import { formatRowDate } from "./-utils";

interface MobileTaskRowProps {
  task: Schemas.TaskWithMeta;
  onToggle: (task: Schemas.TaskWithMeta) => void;
  isUpdating: boolean;
  /** Shown when the row sits in a mixed-date list (search results, Past tasks) with no single section date to rely on. */
  showDate?: boolean;
}

export function MobileTaskRow({
  task,
  onToggle,
  isUpdating,
  showDate = false,
}: MobileTaskRowProps) {
  const isCompleted = task.status === Schemas.TaskStatusIntEnum.Completed;
  const isPaused = task.status === Schemas.TaskStatusIntEnum.Paused;
  const isOverdue = task.overdueByDays > 0 && !isCompleted && !isPaused;
  const metaLine = [task.companyName, task.designation].filter(Boolean).join(" · ");
  const tagLine = [
    Schemas.CONTACT_HISTORY_CHANNEL_LABEL_MAP[task.channel],
    task.stepNumber != null ? `Follow-up ${task.stepNumber}` : null,
    isPaused ? "Paused" : null,
    showDate ? formatRowDate(task.dueAt) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // The row's meta/title/tag text is duplicated into the Link's aria-label below, so it's
  // hidden from the accessibility tree here to avoid every text node also being announced
  // individually as part of the link's accessible name.
  const rowBody = (
    <div className="flex-1 min-w-0" aria-hidden={task.contactId != null}>
      <p
        className={[
          "text-[13px] font-medium truncate",
          isCompleted ? "text-(--text-secondary) line-through" : "text-foreground",
        ].join(" ")}
      >
        {task.title}
      </p>
      {metaLine && <p className="text-xs text-(--text-secondary) truncate mt-0.5">{metaLine}</p>}
      <p className="text-[11px] text-(--text-secondary) truncate mt-0.5">{tagLine}</p>
      {task.contactId != null && (
        <span className="inline-flex items-center gap-1 mt-1 text-[12px] font-medium text-primary">
          View conversation
        </span>
      )}
    </div>
  );

  const overdueBadge = isOverdue && (
    <span
      aria-hidden={task.contactId != null}
      className="shrink-0 inline-flex items-center h-5 px-1.75 rounded-md text-[11px] font-semibold bg-(--danger-bg) text-(--danger-text)"
    >
      {task.overdueByDays}d
    </span>
  );

  // The checkbox is a real, independently focusable form control — it must be a sibling of
  // the Link below, not a descendant. A control nested inside an <a> would have its own
  // semantics swallowed into the anchor's single accessible name, same defect as the now-
  // hidden text nodes above. `relative z-10` lifts it into its own stacking context so it
  // sits above the absolutely-positioned Link overlay and receives its own clicks/taps.
  // checkbox.tsx expands the tap target via `after:-inset-x-3 after:-inset-y-2`; that
  // pseudo-element is composited as part of the checkbox's own box (same stacking context,
  // same z-10 layer), so it should win over the Link the same way the visible box does — but
  // this hasn't been confirmed on a real touch device. If a tap near the checkbox's edge ever
  // navigates instead of toggling, that's the thing to re-check first.
  const checkbox = (
    <Checkbox
      checked={isCompleted}
      disabled={isUpdating}
      onCheckedChange={() => onToggle(task)}
      aria-label={isCompleted ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
      className="relative z-10 mt-0.5 shrink-0"
    />
  );

  if (task.contactId != null) {
    return (
      <div className="relative flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0">
        <Link
          to="/contacts/$contactId"
          params={{ contactId: String(task.contactId) }}
          search={{ tab: "history" }}
          aria-label={`View conversation with ${task.companyName ?? "contact"}: ${task.title}`}
          className="absolute inset-0 rounded-sm active:bg-(--surface-raised)"
        />
        {checkbox}
        {rowBody}
        {overdueBadge}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 active:bg-(--surface-raised)">
      {checkbox}
      {rowBody}
      {overdueBadge}
    </div>
  );
}
