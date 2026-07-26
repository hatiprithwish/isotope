import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useState } from "react";
import { ArrowLeftIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { JobsQueries } from "./-data";
import { JobDetailBody } from "./-JobDetailBody";
import AddOrEditJobModal from "./-AddOrEditJobModal";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  head: () => ({ meta: [{ title: "Job details · Isotope" }] }),
  component: JobDetailPage,
});

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const id = Number(jobId);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data, isPending, isError } = useQuery(JobsQueries.detail(id, getToken));
  const job = data?.job;

  return (
    <>
      {showEditModal && job && (
        <AddOrEditJobModal
          mode="edit"
          job={job}
          onSuccess={() => setShowEditModal(false)}
          onClose={() => setShowEditModal(false)}
        />
      )}
      <div className="flex flex-col h-full overflow-hidden bg-background">
        <header className="h-13 px-4 flex items-center gap-3 border-b border-border bg-sidebar shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate({ to: "/jobs" })}
          >
            <ArrowLeftIcon size={14} />
          </Button>
          <span className="text-base font-semibold text-foreground tracking-tight truncate flex-1">
            {isPending ? "Loading…" : (job?.title ?? "Job Detail")}
          </span>
          {job && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowEditModal(true)}
              title="Edit job"
            >
              <PencilSimpleIcon size={14} />
            </Button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          {isPending && (
            <div className="p-6 flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3 rounded bg-(--surface-raised) animate-pulse"
                  style={{ width: `${60 + (i % 3) * 15}%` }}
                />
              ))}
            </div>
          )}

          {isError && (
            <div className="m-6 px-4 py-3 rounded-lg bg-(--danger-bg) border border-destructive text-[13px] text-(--danger-text)">
              Failed to load job details.
            </div>
          )}

          {job && !isPending && <JobDetailBody job={job} />}
        </div>
      </div>
    </>
  );
}
