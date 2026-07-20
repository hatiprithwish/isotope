import { CaretRightIcon, LinkIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { JobStatusBadge, JobTypeBadge } from "./-JobStatusBadge";
import type * as Schemas from "@app/schemas";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
      {children}
    </div>
  );
}

interface Props {
  job: Schemas.Job;
}

export function JobDetailBody({ job }: Props) {
  return (
    <div className="max-w-2xl px-6 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground leading-snug">{job.title}</h1>
        <p className="text-[14px] text-(--text-secondary) mt-1">
          {job.companyLocation ?? "—"}
          {job.salary ? ` · ${job.salary}` : ""}
        </p>
        <div className="flex gap-2 items-center mt-3 flex-wrap">
          {job.status != null && <JobStatusBadge status={job.status} />}
          {job.type != null && <JobTypeBadge type={job.type} />}
          {job.source && (
            <span className="inline-flex items-center h-5 px-1.75 rounded-md text-[11px] font-semibold bg-(--surface-raised) text-(--text-secondary)">
              {job.source}
            </span>
          )}
        </div>
      </div>

      {job.companyId != null && (
        <div>
          <SectionLabel>Linked company</SectionLabel>
          <a
            href={`/companies?panel=${job.companyId}`}
            className="flex items-center gap-3 px-3 py-3 bg-card rounded-lg border border-border hover:bg-(--surface-raised) transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-(--surface-raised) flex items-center justify-center shrink-0 text-[13px] font-semibold text-(--text-secondary)">
              {(job.companyName ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-foreground truncate">
                {job.companyName ?? `Company #${job.companyId}`}
              </div>
              {(job.companyIndustry || job.companyStatusLabel) && (
                <div className="text-[11px] text-(--text-secondary) mt-0.5 truncate">
                  {[job.companyIndustry, job.companyStatusLabel].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
            {job.companyFitBandLabel && (
              <span
                className={[
                  "shrink-0 inline-flex items-center h-5 px-1.75 rounded-md text-[11px] font-semibold",
                  job.companyFitBand === 1
                    ? "bg-(--success-bg) text-(--success-text)"
                    : job.companyFitBand === 2
                      ? "bg-(--warning-bg) text-(--warning-text)"
                      : job.companyFitBand === 4
                        ? "bg-(--danger-bg) text-(--danger-text)"
                        : "bg-(--surface-raised) text-(--text-secondary)",
                ].join(" ")}
              >
                {job.companyFitBandLabel}
              </span>
            )}
            <CaretRightIcon size={12} className="text-(--text-secondary) shrink-0" />
          </a>
        </div>
      )}

      {job.url && (
        <div>
          <SectionLabel>Source URL</SectionLabel>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 bg-card rounded-lg border border-border hover:bg-(--surface-raised) transition-colors"
          >
            <LinkIcon size={14} className="text-(--text-secondary) shrink-0" />
            <span className="text-[13px] text-primary flex-1 min-w-0 truncate">{job.url}</span>
          </a>
        </div>
      )}

      {job.skills && job.skills.length > 0 && (
        <div>
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

      <div>
        <SectionLabel>Details</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
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
            ["Location", job.companyLocation ?? "—"],
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

      <div>
        <SectionLabel>Job description</SectionLabel>
        {job.description ? (
          <div className="bg-card border border-border rounded-lg px-3.5 py-3 overflow-y-auto">
            <pre className="text-[12px] leading-[1.75] text-foreground whitespace-pre-wrap wrap-break-word m-0 font-sans">
              {job.description}
            </pre>
          </div>
        ) : (
          <div className="flex items-start gap-2 px-3 py-3 rounded-lg bg-(--warning-bg) border border-(--warning)">
            <WarningCircleIcon size={14} className="text-(--warning-text) shrink-0 mt-0.5" />
            <p className="text-[12px] text-(--warning-text)">
              No description was extracted. Edit this job to paste the description manually.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
