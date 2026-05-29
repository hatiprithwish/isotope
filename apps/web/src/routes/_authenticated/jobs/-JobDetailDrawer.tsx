import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useNavigate } from "@tanstack/react-router";
import { ArrowsOutSimpleIcon, XIcon, LinkIcon } from "@phosphor-icons/react";
import { JobsQueries } from "./-data";
import { JobStatusBadge, JobTypeBadge } from "./-JobStatusBadge";
import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal } from "@/shadcn/ui/drawer";

interface JobDetailDrawerProps {
  jobId: number | null;
  onClose: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
      {children}
    </div>
  );
}

function PanelContent({ jobId, onClose }: { jobId: number; onClose: () => void }) {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { data, isPending, isError } = useQuery(JobsQueries.detail(jobId, getToken));
  const job = data?.job;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card">
      {/* ─── Header ───────────────────────────────────────────────────── */}
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

      {/* ─── Body ─────────────────────────────────────────────────────── */}
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

        {job && !isPending && (
          <>
            {/* Linked company */}
            {job.companyId != null && (
              <div className="px-5 py-4 border-b border-border">
                <SectionLabel>Linked company</SectionLabel>
                <a
                  href={`/companies?panel=${job.companyId}`}
                  className="flex items-center gap-3 px-3 py-2.5 bg-background rounded-lg border border-border hover:bg-(--surface-raised) transition-colors"
                >
                  <LinkIcon size={14} className="text-(--text-secondary) shrink-0" />
                  <span className="text-[13px] font-medium text-primary flex-1 min-w-0 truncate">
                    Company #{job.companyId}
                  </span>
                </a>
              </div>
            )}

            {/* Source URL */}
            {job.url && (
              <div className="px-5 py-4 border-b border-border">
                <SectionLabel>Source URL</SectionLabel>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 bg-background rounded-lg border border-border hover:bg-(--surface-raised) transition-colors"
                >
                  <LinkIcon size={14} className="text-(--text-secondary) shrink-0" />
                  <span className="text-[13px] text-primary flex-1 min-w-0 truncate">
                    {job.url}
                  </span>
                </a>
              </div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="px-5 py-4 border-b border-border">
                <SectionLabel>Skills</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center h-5 px-2 rounded-md text-[11px] font-medium bg-(--surface-raised) text-(--text-secondary)"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Meta grid */}
            <div className="px-5 py-4 border-b border-border">
              <SectionLabel>Details</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {[
                  [
                    "Added",
                    new Date(job.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }),
                  ],
                  ["Salary", job.salary ?? "—"],
                  ["Location", job.location ?? "—"],
                  ["Source", job.source ?? "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-0.5">
                      {label}
                    </div>
                    <div className="text-[13px] font-medium text-foreground">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job description */}
            {job.description && (
              <div className="px-5 py-4 border-b border-border">
                <SectionLabel>Job description</SectionLabel>
                <div className="bg-background border border-border rounded-lg px-3.5 py-3 max-h-72 overflow-y-auto">
                  <pre className="text-[12px] leading-[1.75] text-foreground whitespace-pre-wrap wrap-break-word m-0 font-sans">
                    {job.description}
                  </pre>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Desktop: inline sliding panel ──────────────────────────────────────── */
export function JobDetailPanel({ jobId, onClose }: JobDetailDrawerProps) {
  const isOpen = jobId != null;

  return (
    <aside
      className={[
        "hidden md:flex flex-col absolute inset-y-0 right-0 border-l border-border shadow-xl z-20 overflow-hidden",
        "transition-all duration-200 ease-out",
        isOpen ? "w-1/3" : "w-0 border-l-0",
      ].join(" ")}
      aria-hidden={!isOpen}
    >
      {isOpen && <PanelContent jobId={jobId} onClose={onClose} />}
    </aside>
  );
}

/* ─── Mobile: vaul bottom Drawer ─────────────────────────────────────────── */
export function JobDetailMobileDrawer({ jobId, onClose }: JobDetailDrawerProps) {
  const isOpen = jobId != null;

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      direction="bottom"
    >
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent className="h-[90vh] w-full p-0 bg-card border-t border-border rounded-t-xl">
          {isOpen && <PanelContent jobId={jobId} onClose={onClose} />}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
