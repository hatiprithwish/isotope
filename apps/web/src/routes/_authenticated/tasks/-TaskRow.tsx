import { useNavigate } from "@tanstack/react-router";
import { Checkbox } from "@/shadcn/ui/checkbox";
import * as Schemas from "@app/schemas";

interface TaskRowProps {
  task: Schemas.TaskWithMeta;
  onToggle: (task: Schemas.TaskWithMeta) => void;
  isUpdating: boolean;
}

export function TaskRow({ task, onToggle, isUpdating }: TaskRowProps) {
  const navigate = useNavigate();
  const isCompleted = task.status === Schemas.TaskStatusIntEnum.Completed;
  const isOverdue = task.overdueByDays > 0 && !isCompleted;
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
      {isOverdue && (
        <span className="shrink-0 inline-flex items-center gap-1 h-5 px-1.75 rounded-md text-[11px] font-semibold bg-(--danger-bg) text-(--danger-text)">
          Overdue {task.overdueByDays}d
        </span>
      )}
      {task.contactId != null && (
        <button
          type="button"
          onClick={() =>
            navigate({
              to: "/contacts/$contactId",
              params: { contactId: String(task.contactId) },
              search: { tab: "history" },
            })
          }
          className="shrink-0 text-[13px] font-medium text-primary hover:underline"
        >
          View conversation
        </button>
      )}
    </div>
  );
}
