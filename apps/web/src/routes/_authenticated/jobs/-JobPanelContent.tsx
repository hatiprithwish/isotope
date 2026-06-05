import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useNavigate } from "@tanstack/react-router";
import { ArrowsOutSimpleIcon, XIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { JobsQueries } from "./-data";
import { JobStatusBadge, JobTypeBadge } from "./-JobStatusBadge";
import { JobPanelDetails } from "./-JobPanelDetails";
import type * as Schemas from "@app/schemas";

interface Props {
  jobId: number;
  onClose: () => void;
  onEdit?: (job: Schemas.Job) => void;
}

export function JobPanelContent({ jobId, onClose, onEdit }: Props) {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { data, isPending, isError } = useQuery(JobsQueries.detail(jobId, getToken));
  const job = data?.job;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card">
      <div className="px-5 pt-4 pb-3.5 border-b border-border shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {isPending ? (
              <div className="h-4 w-48 rounded bg-(--surface-raised) animate-pulse" />
            ) : (
              <div className="text-base font-semibold text-foreground leading-snug truncate">
                {job?.title ?? "—"}
              </div>
            )}
            <div className="text-[13px] text-(--text-secondary) mt-0.5">
              {job?.location ?? "—"}
              {job?.salary ? ` · ${job.salary}` : ""}
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
            {onEdit && job && (
              <button
                type="button"
                onClick={() => onEdit(job)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-(--text-secondary) hover:bg-(--surface-raised) hover:text-foreground transition-colors"
                title="Edit job"
              >
                <PencilSimpleIcon size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate({ to: "/jobs/$jobId", params: { jobId: String(jobId) } })}
              className="w-7 h-7 rounded-md flex items-center justify-center text-(--text-secondary) hover:bg-(--surface-raised) hover:text-foreground transition-colors"
              title="Open full page"
            >
              <ArrowsOutSimpleIcon size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-(--text-secondary) hover:bg-(--surface-raised) hover:text-foreground transition-colors"
              title="Close panel"
            >
              <XIcon size={14} />
            </button>
          </div>
        </div>
        <div className="flex gap-2 items-center mt-3 flex-wrap">
          {job?.status != null && <JobStatusBadge status={job.status} />}
          {job?.type != null && <JobTypeBadge type={job.type} />}
          {job?.source && (
            <span className="inline-flex items-center h-5 px-1.75 rounded-md text-[11px] font-semibold bg-(--surface-raised) text-(--text-secondary)">
              {job.source}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isPending && (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-3 rounded bg-(--surface-raised) animate-pulse"
                style={{ width: `${70 + (i % 3) * 10}%` }}
              />
            ))}
          </div>
        )}
        {isError && (
          <div className="mx-5 mt-5 px-4 py-3 rounded-lg bg-(--danger-bg) border border-destructive text-[13px] text-(--danger-text)">
            Failed to load job details.
          </div>
        )}
        {job && !isPending && <JobPanelDetails job={job} />}
      </div>
    </div>
  );
}
