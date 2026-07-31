import { useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shadcn/ui/collapsible";
import type * as Schemas from "@app/schemas";
import { MobileTaskRow } from "./-MobileTaskRow";

interface MobileTaskSectionProps {
  title: string;
  dateLabel?: string;
  tasks: Schemas.TaskWithMeta[];
  isLoading: boolean;
  isError: boolean;
  emptyLabel: string;
  onToggleTask: (task: Schemas.TaskWithMeta) => void;
  updatingTaskId: number | null;
  /** Collapsible with a caret trigger when true; a plain always-open section when false. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

function SectionHeader({
  title,
  dateLabel,
  isLoading,
  count,
}: {
  title: string;
  dateLabel?: string;
  isLoading: boolean;
  count: number;
}) {
  return (
    <span className="flex items-center gap-2 min-w-0">
      <span className="text-[13px] font-semibold text-foreground">{title}</span>
      {dateLabel && (
        <span className="text-[12px] text-(--text-secondary) truncate">{dateLabel}</span>
      )}
      <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[11px] font-semibold bg-(--surface-raised) text-(--text-secondary)">
        {isLoading ? "…" : count}
      </span>
    </span>
  );
}

function SectionBody({
  tasks,
  isLoading,
  isError,
  emptyLabel,
  onToggleTask,
  updatingTaskId,
  showDate,
}: Pick<
  MobileTaskSectionProps,
  "tasks" | "isLoading" | "isError" | "emptyLabel" | "onToggleTask" | "updatingTaskId"
> & { showDate: boolean }) {
  if (isError) {
    return <p className="px-4 py-3 text-[13px] text-(--danger-text)">Failed to load.</p>;
  }

  if (isLoading) {
    return (
      <div className="px-4 py-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-(--surface-raised)" />
        <div className="h-4 w-1/2 rounded bg-(--surface-raised)" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return <p className="px-4 py-3 text-[13px] text-(--text-secondary)">{emptyLabel}</p>;
  }

  return (
    <>
      {tasks.map((task) => (
        <MobileTaskRow
          key={task.id}
          task={task}
          onToggle={onToggleTask}
          isUpdating={updatingTaskId === task.id}
          showDate={showDate}
        />
      ))}
    </>
  );
}

export function MobileTaskSection({
  title,
  dateLabel,
  tasks,
  isLoading,
  isError,
  emptyLabel,
  onToggleTask,
  updatingTaskId,
  collapsible = true,
  defaultOpen = true,
}: MobileTaskSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const body = (
    <SectionBody
      tasks={tasks}
      isLoading={isLoading}
      isError={isError}
      emptyLabel={emptyLabel}
      onToggleTask={onToggleTask}
      updatingTaskId={updatingTaskId}
      showDate={!dateLabel}
    />
  );

  if (!collapsible) {
    return (
      <div className="bg-card">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-t border-border">
          <SectionHeader
            title={title}
            dateLabel={dateLabel}
            isLoading={isLoading}
            count={tasks.length}
          />
        </div>
        {body}
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="bg-card">
      <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 px-4 py-2.5 border-b border-t border-border text-left">
        <SectionHeader
          title={title}
          dateLabel={dateLabel}
          isLoading={isLoading}
          count={tasks.length}
        />
        <CaretDownIcon
          size={14}
          className={[
            "text-(--text-secondary) transition-transform shrink-0",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>{body}</CollapsibleContent>
    </Collapsible>
  );
}
