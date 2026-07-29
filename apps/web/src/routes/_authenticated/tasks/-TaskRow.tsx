import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { Checkbox } from "@/shadcn/ui/checkbox";
import * as Schemas from "@app/schemas"; // runtime `import *`: consumes CONTACT_HISTORY_CHANNEL_LABEL_MAP alongside types.
import { formatRowDate } from "./-utils";

interface TaskRowProps {
  task: Schemas.TaskWithMeta;
  onToggle: (task: Schemas.TaskWithMeta) => void;
  isUpdating: boolean;
  /** Shown when the row sits in a mixed-date list (search results, Past tasks) with no single section date to rely on. */
  showDate?: boolean;
}

export function TaskRow({ task, onToggle, isUpdating, showDate = false }: TaskRowProps) {
  const isCompleted = task.status === Schemas.TaskStatusIntEnum.Completed;
  const isPaused = task.status === Schemas.TaskStatusIntEnum.Paused;
  const isOverdue = task.overdueByDays > 0 && !isCompleted && !isPaused;
  const metaLine = [task.companyName, task.designation].filter(Boolean).join(" · ");

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-(--surface-raised)">
      <Checkbox
        checked={isCompleted}
        disabled={isUpdating}
        onCheckedChange={() => onToggle(task)}
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
      </div>
      {showDate && (
        <span className="shrink-0 inline-flex items-center gap-1 h-5 px-1.75 rounded-md text-[11px] font-semibold bg-(--surface-raised) text-(--text-secondary)">
          {formatRowDate(task.dueAt)}
        </span>
      )}
      <span className="shrink-0 inline-flex items-center gap-1 h-5 px-1.75 rounded-md text-[11px] font-semibold bg-(--surface-raised) text-(--text-secondary)">
        {Schemas.CONTACT_HISTORY_CHANNEL_LABEL_MAP[task.channel]}
      </span>
      {task.stepNumber != null && (
        <span className="shrink-0 inline-flex items-center gap-1 h-5 px-1.75 rounded-md text-[11px] font-semibold bg-(--surface-raised) text-(--text-secondary)">
          Follow-up {task.stepNumber}
        </span>
      )}
      {isPaused && (
        <span className="shrink-0 inline-flex items-center gap-1 h-5 px-1.75 rounded-md text-[11px] font-semibold bg-(--surface-raised) text-(--text-secondary)">
          Paused
        </span>
      )}
      {isOverdue && (
        <span className="shrink-0 inline-flex items-center gap-1 h-5 px-1.75 rounded-md text-[11px] font-semibold bg-(--danger-bg) text-(--danger-text)">
          Overdue {task.overdueByDays}d
        </span>
      )}
      {task.contactId != null && (
        <Link
          to="/contacts/$contactId"
          params={{ contactId: String(task.contactId) }}
          search={{ tab: "history" }}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
        >
          View conversation
          <ArrowUpRightIcon size={13} />
        </Link>
      )}
    </div>
  );
}
