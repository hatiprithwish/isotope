import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { ArrowLeftIcon, DotsThreeIcon, WarningIcon } from "@phosphor-icons/react";
import { CompaniesQueries, useUpdateCompany } from "../-data";
import { StatusBadge } from "../-StatusBadge";
import ScoreBar from "../-ScoreBar";
import Utilities from "@/utils";
import { MAX_SCORE } from "../-criteria";
import { ScoredCriteriaCard } from "./-ScoredCriteriaCard";
import { PreFiltersCard } from "./-PreFiltersCard";

export const Route = createFileRoute("/_authenticated/companies/$companyId/")({
  component: CompanyDetailPage,
});

function CompanyDetailPage() {
  const { companyId } = Route.useParams();
  const { getToken } = useAuth();
  const router = useRouter();
  const updateCompany = useUpdateCompany();

  const { data, isPending, isError } = useQuery(
    CompaniesQueries.detail(Number(companyId), getToken),
  );
  const company = data?.company;

  if (isPending) return <div className="p-6 text-(--text-secondary) text-sm">Loading...</div>;
  if (isError || !company)
    return <div className="p-6 text-(--text-secondary) text-sm">Company not found.</div>;

  const hasEthicsFlag = company.isEthicsCompliant === false;
  const isWaitingHuman = company.status === 1;
  const displayScore = company.weightedScore ?? 0;

  function handleAccept() {
    updateCompany.mutate({ id: company!.id, body: { company: { status: 2 } } });
  }

  function handleReject() {
    updateCompany.mutate({ id: company!.id, body: { company: { status: 4 } } });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <header className="h-13 px-4 flex items-center gap-2 border-b border-border bg-background shrink-0">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-(--text-secondary) hover:bg-(--surface-raised) -ml-2"
        >
          <ArrowLeftIcon size={20} />
        </button>
        <div className="flex flex-col grow min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[17px] font-semibold text-foreground truncate">
              {company.name}
            </span>
            {hasEthicsFlag && <WarningIcon size={15} className="text-(--warning) shrink-0" />}
          </div>
          <span className="text-xs text-(--text-secondary) leading-none mt-0.5">
            {[company.industry, company.size].filter(Boolean).join(" · ")}
          </span>
        </div>
        <button
          type="button"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-(--text-secondary) hover:bg-(--surface-raised)"
        >
          <DotsThreeIcon size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="bg-sidebar border border-border rounded-[10px] flex items-center gap-3.5 p-4">
            <span className="w-14 h-14 rounded-full inline-flex items-center justify-center text-lg font-semibold bg-(--surface-raised) text-(--text-secondary) shrink-0">
              {Utilities.getInitials(company.name)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {company.fitBand && <StatusBadge fit={company.fitBand} />}
                {company.status && <StatusBadge status={company.status} sm />}
              </div>
              <div className="text-xs text-(--text-secondary) mt-2">
                {company.website && <span className="text-primary">{company.website}</span>}
                {company.website && company.location && " · "}
                {company.location}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="bg-sidebar border border-border rounded-[10px] p-4">
            <ScoreBar score={displayScore} max={MAX_SCORE} showLabels scoreSize="lg" />
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="bg-sidebar border border-border rounded-[10px] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2">
              Your context for AI
            </div>
            <textarea
              className="w-full bg-background border border-border rounded-lg px-3.5 py-3 text-sm text-foreground leading-[1.6] resize-none outline-none focus:border-primary transition-colors"
              defaultValue={company.userContext ?? ""}
              placeholder="Anything you know about this company (injected into AI scoring)."
              rows={3}
            />
          </div>
        </div>

        {hasEthicsFlag && (
          <div className="px-4 pb-4">
            <div className="bg-(--danger-bg) border-l-[3px] border-(--danger) rounded-r-[10px] px-3.5 py-3 text-[13px] leading-[1.55] text-(--text-secondary)">
              <strong className="text-(--danger-text)">Ethics flag.</strong>{" "}
              {company.ethicsNotes ?? "Ethics concerns noted. Confirm before accepting."}
            </div>
          </div>
        )}

        <PreFiltersCard company={company} />

        {company.aiSummary && (
          <div className="px-4 pb-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5 flex items-center gap-1.5">
              <span className="text-(--warning) text-[13px]">✦</span>
              AI research summary
            </div>
            <div className="bg-(--ai-bg) border border-border border-l-[3px] border-l-(--ai-border) rounded-r-[10px] px-3.5 py-3 text-[13px] leading-[1.7] text-(--text-secondary)">
              {company.aiSummary}
            </div>
          </div>
        )}

        <ScoredCriteriaCard companyId={company.id} isWaitingHuman={isWaitingHuman} />

        {company.notes && (
          <div className="px-4 pb-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
              Notes
            </div>
            <div className="bg-sidebar border border-border rounded-[10px] px-4 py-3 text-[13px] text-(--text-secondary) leading-[1.6]">
              {company.notes}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>

      <div className="flex gap-2 px-4 py-3 bg-sidebar border-t border-border shrink-0">
        <button
          type="button"
          onClick={handleReject}
          disabled={updateCompany.isPending}
          className="h-11 px-4 rounded-[10px] text-sm font-medium text-(--danger) border border-transparent hover:bg-(--danger-bg) transition-colors disabled:opacity-50"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={handleAccept}
          disabled={updateCompany.isPending}
          className="flex-1 h-11 px-4 rounded-[10px] text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Accept · find contacts
        </button>
      </div>
    </div>
  );
}
