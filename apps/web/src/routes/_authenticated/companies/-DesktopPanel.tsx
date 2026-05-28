import { useNavigate } from "@tanstack/react-router";
import { useUpdateCompany } from "./-data";
import type * as Schemas from "@app/schemas";
import Avatar from "./-Avatar";
import { ArrowsOutSimpleIcon, CheckCircleIcon, XIcon } from "@phosphor-icons/react";
import { StatusBadge } from "./-StatusBadge";
import ScoreBar from "./-ScoreBar";

function DesktopPanel({ company, onClose }: { company: Schemas.Company; onClose: () => void }) {
  const navigate = useNavigate();
  const updateCompany = useUpdateCompany();
  const score = company.weightedScore ?? 0;
  const max = 135;
  const hasEthicsFlag = company.isEthicsCompliant === false;

  function handleAccept() {
    updateCompany.mutate({ id: company.id, body: { company: { status: 2 } } });
  }

  function handleReject() {
    updateCompany.mutate({ id: company.id, body: { company: { status: 4 } } });
  }

  return (
    <aside className="bg-sidebar border-l border-border flex flex-col h-full overflow-hidden">
      {/* Head */}
      <div className="px-5 pt-4 pb-3.5 border-b border-border shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={company.name} size="md" />
            <div className="min-w-0">
              <div className="text-base font-semibold text-foreground leading-snug truncate">
                {company.name}
              </div>
              <div className="text-[13px] text-(--text-secondary) mt-0.5">
                {company.website && <span className="text-primary">{company.website}</span>}
                {company.website && company.industry && " · "}
                {company.industry}
              </div>
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                navigate({ to: "/companies/$companyId", params: { companyId: String(company.id) } })
              }
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
          {company.status && <StatusBadge status={company.status} />}
          {company.fitBand && <StatusBadge fit={company.fitBand} />}
          {(company.updatedAt ?? company.createdAt) && (
            <span className="ml-auto text-[11px] text-(--text-secondary)">
              Updated at {company.updatedAt}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {/* User context */}
        <div className="px-5 py-4.5 border-b border-border">
          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
            Your context for AI
          </div>
          <textarea
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground leading-[1.65] resize-none outline-none focus:border-primary transition-colors min-h-18"
            defaultValue={company.userContext ?? ""}
            placeholder="Anything you know about this company (injected into AI scoring)."
            rows={3}
          />
        </div>

        {/* Score */}
        <div className="px-5 py-4.5 border-b border-border">
          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
            Score
          </div>
          <ScoreBar score={score} max={max} />
        </div>

        {/* Stage 1 pre-filters */}
        <div className="px-5 py-4.5 border-b border-border">
          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
            Stage 1 · Pre-filters
          </div>
          <div className="flex gap-3">
            {(
              [
                { label: "Salary band", pass: company.isSalaryMatch },
                { label: "Location", pass: company.isLocationMatch },
              ] as const
            ).map(({ label, pass }) => (
              <div key={label} className="flex-1 flex items-center gap-2">
                <CheckCircleIcon
                  size={14}
                  className={pass === true ? "text-(--success)" : "text-(--text-secondary)"}
                />
                <span className="text-xs font-medium text-foreground flex-1">{label}</span>
                {pass !== null && pass !== undefined && <StatusBadge status={pass ? 2 : 4} sm />}
              </div>
            ))}
          </div>
        </div>

        {/* Ethics callout */}
        {hasEthicsFlag && (
          <div className="px-5 py-4.5 border-b border-border">
            <div className="bg-(--danger-bg) border-l-[3px] border-(--danger) rounded-r-lg px-3.5 py-3 text-[13px] leading-[1.55] text-(--text-secondary)">
              <strong className="text-(--danger-text)">Ethics flag.</strong>{" "}
              {company.ethicsNotes ?? "Ethics concerns noted. Review before accepting."}
            </div>
          </div>
        )}

        {/* AI summary */}
        {company.aiSummary && (
          <div className="px-5 py-4.5 border-b border-border">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5 flex items-center gap-1.5">
              <span className="text-(--warning) text-[13px]">✦</span>
              AI research summary
            </div>
            <div className="bg-(--ai-bg) border border-border border-l-[3px] border-l-(--ai-border) rounded-r-lg px-3.5 py-3 text-[13px] leading-[1.7] text-(--text-secondary)">
              {company.aiSummary}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-border bg-sidebar flex gap-2 shrink-0">
        <button
          type="button"
          onClick={handleReject}
          disabled={updateCompany.isPending}
          className="h-7.75 px-3.5 rounded-lg text-[13px] font-medium text-(--danger) hover:bg-(--danger-bg) border border-transparent transition-colors disabled:opacity-50"
        >
          Reject
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleAccept}
          disabled={updateCompany.isPending}
          className="h-7.75 px-3.5 rounded-lg text-[13px] font-medium border border-border text-foreground hover:bg-(--surface-raised) transition-colors disabled:opacity-50"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => {
            handleAccept();
          }}
          disabled={updateCompany.isPending}
          className="h-7.75 px-3.5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Accept · find contacts
        </button>
      </div>
    </aside>
  );
}

export default DesktopPanel;
