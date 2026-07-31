import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
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

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 active:bg-(--surface-raised)">
      <Checkbox
        checked={isCompleted}
        disabled={isUpdating}
        onCheckedChange={() => onToggle(task)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
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
          <Link
            to="/contacts/$contactId"
            params={{ contactId: String(task.contactId) }}
            search={{ tab: "history" }}
            className="inline-flex items-center gap-1 mt-1 text-[12px] font-medium text-primary"
          >
            View conversation
            <ArrowUpRightIcon size={12} />
          </Link>
        )}
      </div>
      {isOverdue && (
        <span className="shrink-0 inline-flex items-center h-5 px-1.75 rounded-md text-[11px] font-semibold bg-(--danger-bg) text-(--danger-text)">
          {task.overdueByDays}d
        </span>
      )}
    </div>
  );
}
