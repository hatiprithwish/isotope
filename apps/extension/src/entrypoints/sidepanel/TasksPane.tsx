import { useEffect, useState } from "react";
import * as Schemas from "@app/schemas";
import { useLogMessages, useMessageTemplates, useTasksForToday } from "./data";

const WEB_ORIGIN = import.meta.env.WXT_WEB_ORIGIN;

const BADGE_CLASS =
  "inline-flex h-5 shrink-0 items-center rounded-md bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground";
const ACTION_CLASS =
  "rounded-md border border-input px-2.5 py-1.5 text-[12px] font-medium text-foreground disabled:opacity-50";
const LINK_CLASS = "text-[12px] font-medium text-primary underline underline-offset-2";

/** How long the Copy button reads "Copied" before it goes back to "Copy". */
const COPIED_RESET_MS = 1500;

/**
 * The message to send for a task: the single body saved for its follow-up step, with the contact's
 * first name and company filled in. Null when it can't be built — no step on the task, no contact
 * to address, or no template saved for that step.
 */
function renderFollowUpMessage(
  task: Schemas.TaskWithMeta,
  templates: Schemas.MessageTemplate[],
): string | null {
  if (task.stepNumber == null || !task.contactName) return null;
  const template = templates.find(
    (candidate) => candidate.step === task.stepNumber && candidate.variantLabel === null,
  );
  if (!template) return null;
  return Schemas.renderTemplate(template.body, {
    name: task.contactName.trim().split(/\s+/)[0] ?? task.contactName,
    company: task.companyName ?? null,
  });
}

function CopyButton({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  useEffect(() => {
    if (!isCopied && !isFailed) return;
    const timer = setTimeout(() => {
      setIsCopied(false);
      setIsFailed(false);
    }, COPIED_RESET_MS);
    return () => clearTimeout(timer);
  }, [isCopied, isFailed]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(
      () => setIsCopied(true),
      () => setIsFailed(true),
    );
  };

  return (
    <button type="button" onClick={handleCopy} className={ACTION_CLASS}>
      {isFailed ? "Copy failed" : isCopied ? "Copied" : "Copy"}
    </button>
  );
}

function MessageBlock({
  task,
  templates,
}: {
  task: Schemas.TaskWithMeta;
  templates: ReturnType<typeof useMessageTemplates>;
}) {
  const logMessages = useLogMessages();

  if (templates.isPending) {
    return <p className="mt-2 text-[12px] text-muted-foreground">Loading message…</p>;
  }

  if (templates.isError) {
    return (
      <div className="mt-2 flex items-center gap-3">
        <p className="text-[12px] text-destructive" role="alert">
          Couldn&apos;t load messages: {templates.error.message}
        </p>
        <button type="button" onClick={() => void templates.refetch()} className={LINK_CLASS}>
          Retry
        </button>
      </div>
    );
  }

  const message = renderFollowUpMessage(task, templates.data);

  if (!message) {
    return (
      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
        {task.stepNumber == null
          ? "No message for this task."
          : `No message saved for follow-up ${task.stepNumber}. `}
        {task.stepNumber != null && (
          <a
            className={LINK_CLASS}
            href={`${WEB_ORIGIN}/settings`}
            target="_blank"
            rel="noreferrer"
          >
            Add one in Settings
          </a>
        )}
      </p>
    );
  }

  const contactId = task.contactId;
  // The bulk endpoint answers 201 with a per-entry outcome, so a rejected entry arrives as a
  // successful response — the row has to read it, not just the request status.
  const entryFailure = logMessages.data?.results?.find((result) => !result.isSuccess);
  const isLogged = logMessages.isSuccess && !entryFailure;

  const handleLog = () => {
    if (contactId == null) return;
    logMessages.mutate({
      entries: [
        {
          contactId,
          direction: Schemas.ContactHistoryDirectionEnum.Me,
          channel: task.channel,
          body: message,
          sentAt: new Date().toISOString(),
        },
      ],
    });
  };

  return (
    <div className="mt-2">
      <p className="whitespace-pre-wrap rounded-md bg-muted px-2.5 py-2 text-[13px] leading-relaxed text-foreground">
        {message}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <CopyButton text={message} />
        {contactId != null && !isLogged && (
          <button
            type="button"
            onClick={handleLog}
            disabled={logMessages.isPending}
            className={ACTION_CLASS}
          >
            {logMessages.isPending ? "Logging…" : "Log as sent"}
          </button>
        )}
        {isLogged && <span className="text-[12px] font-medium text-primary">Logged ✓</span>}
      </div>
      {(logMessages.isError || entryFailure) && (
        <p className="mt-2 text-[12px] leading-relaxed text-destructive" role="alert">
          {logMessages.error?.message ?? entryFailure?.message ?? "Could not log this message."}
        </p>
      )}
    </div>
  );
}

function TaskRow({
  task,
  templates,
}: {
  task: Schemas.TaskWithMeta;
  templates: ReturnType<typeof useMessageTemplates>;
}) {
  const isPaused = task.status === Schemas.TaskStatusIntEnum.Paused;
  const isOverdue = task.overdueByDays > 0 && !isPaused;
  const metaLine = [task.contactName, task.companyName].filter(Boolean).join(" · ");

  return (
    <li className="border-b border-border px-4 py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-foreground">{task.title}</p>
          {metaLine && (
            <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{metaLine}</p>
          )}
        </div>
        {task.contactId != null && (
          <a
            className={`${LINK_CLASS} shrink-0`}
            href={`${WEB_ORIGIN}/contacts?panel=${task.contactId}`}
            target="_blank"
            rel="noreferrer"
          >
            Open
          </a>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <span className={BADGE_CLASS}>
          {Schemas.CONTACT_HISTORY_CHANNEL_LABEL_MAP[task.channel]}
        </span>
        {task.stepNumber != null && (
          <span className={BADGE_CLASS}>Follow-up {task.stepNumber}</span>
        )}
        {isPaused && <span className={BADGE_CLASS}>Paused</span>}
        {isOverdue && (
          <span className="inline-flex h-5 shrink-0 items-center rounded-md bg-destructive/10 px-1.5 text-[11px] font-semibold text-destructive">
            Overdue {task.overdueByDays}d
          </span>
        )}
        {!isOverdue && !isPaused && <span className={BADGE_CLASS}>Due today</span>}
      </div>
      <MessageBlock task={task} templates={templates} />
    </li>
  );
}

export default function TasksPane() {
  const tasks = useTasksForToday();
  const templates = useMessageTemplates();

  if (tasks.isPending) {
    return <p className="p-4 text-[13px] text-muted-foreground">Loading follow-ups…</p>;
  }

  if (tasks.isError) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[13px] leading-relaxed text-destructive" role="alert">
          {tasks.error.message}
        </p>
        <button
          type="button"
          onClick={() => void tasks.refetch()}
          className="self-start rounded-md border border-input px-3 py-2 text-[13px] font-medium text-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-[11px] text-muted-foreground">
          {tasks.data.length} pending {tasks.data.length === 1 ? "follow-up" : "follow-ups"}
        </p>
        <button
          type="button"
          onClick={() => {
            void tasks.refetch();
            void templates.refetch();
          }}
          disabled={tasks.isFetching}
          className="text-[11px] font-medium text-primary underline underline-offset-2 disabled:opacity-50"
        >
          {tasks.isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {tasks.data.length === 0 ? (
        <p className="p-4 text-[13px] leading-relaxed text-muted-foreground">
          Nothing to follow up on today.
        </p>
      ) : (
        <ul className="mt-2 border-t border-border">
          {tasks.data.map((task) => (
            <TaskRow key={task.id} task={task} templates={templates} />
          ))}
        </ul>
      )}
    </>
  );
}
