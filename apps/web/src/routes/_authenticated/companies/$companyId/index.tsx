import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import {
  ArrowLeftIcon,
  DotsThreeIcon,
  WarningIcon,
  CheckCircleIcon,
  MinusIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { CompaniesQueries, useUpdateCompany } from "../-data";
import { StatusBadge } from "../-StatusBadge";
import Utilities from "@/utils";
import { DEFAULT_CRITERIA, MAX_SCORE, computeWeightedScore, deriveFitBand } from "../-criteria";

export const Route = createFileRoute("/_authenticated/companies/$companyId/")({
  component: CompanyDetailPage,
});

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const barColor =
    pct >= 80 ? "bg-(--success)" : pct >= 60 ? "bg-(--warning)" : "bg-(--text-secondary)";
  const pctColor =
    pct >= 80 ? "text-(--success)" : pct >= 60 ? "text-(--warning)" : "text-(--text-secondary)";

  return (
    <div>
      <div className="flex items-baseline gap-2.5">
        <span className="text-[32px] font-semibold leading-none tracking-tight text-foreground">
          {score}
        </span>
        <span className="text-sm text-(--text-secondary)">/ {max}</span>
        <span className={["ml-auto text-sm font-semibold", pctColor].join(" ")}>{pct}%</span>
      </div>
      <div className="mt-2.5 h-1.5 rounded-full bg-(--surface-raised) relative overflow-visible">
        <div
          className={["absolute inset-0 rounded-full overflow-hidden", barColor].join(" ")}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute -top-0.75 -bottom-0.75 w-px bg-border" style={{ left: "60%" }} />
        <div className="absolute -top-0.75 -bottom-0.75 w-px bg-border" style={{ left: "80%" }} />
      </div>
      <div className="flex justify-between text-[11px] font-medium text-(--text-secondary) mt-2">
        <span>Weak</span>
        <span>Conditional 60%</span>
        <span>Strong 80%</span>
      </div>
    </div>
  );
}

function CompanyDetailPage() {
  const { companyId } = Route.useParams();
  const { getToken } = useAuth();
  const router = useRouter();
  const updateCompany = useUpdateCompany();

  const { data, isPending, isError } = useQuery(
    CompaniesQueries.detail(Number(companyId), getToken),
  );
  const company = data?.company;

  const initialScores = Object.fromEntries(DEFAULT_CRITERIA.map((c) => [c.name, c.defaultScore]));
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>(initialScores);

  if (isPending) return <div className="p-6 text-(--text-secondary) text-sm">Loading...</div>;
  if (isError || !company)
    return <div className="p-6 text-(--text-secondary) text-sm">Company not found.</div>;

  const hasEthicsFlag = company.isEthicsCompliant === false;
  const isWaitingHuman = company.status === 1;
  const localWeighted = computeWeightedScore(criteriaScores);
  const displayScore = isWaitingHuman ? localWeighted : (company.weightedScore ?? 0);

  function adjustScore(name: string, delta: number) {
    setCriteriaScores((prev) => ({
      ...prev,
      [name]: Math.max(1, Math.min(5, (prev[name] ?? 3) + delta)),
    }));
  }

  function handleSaveScores() {
    const weighted = computeWeightedScore(criteriaScores);
    const fit = deriveFitBand(weighted);
    updateCompany.mutate({
      id: company!.id,
      body: { company: { weightedScore: weighted, fitBand: fit } },
    });
  }

  function handleAccept() {
    updateCompany.mutate({ id: company!.id, body: { company: { status: 2 } } });
  }

  function handleReject() {
    updateCompany.mutate({ id: company!.id, body: { company: { status: 4 } } });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
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

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Header card */}
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

        {/* Score card */}
        <div className="px-4 pb-4">
          <div className="bg-sidebar border border-border rounded-[10px] p-4">
            <ScoreBar score={displayScore} max={MAX_SCORE} />
          </div>
        </div>

        {/* User context */}
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

        {/* Ethics callout */}
        {hasEthicsFlag && (
          <div className="px-4 pb-4">
            <div className="bg-(--danger-bg) border-l-[3px] border-(--danger) rounded-r-[10px] px-3.5 py-3 text-[13px] leading-[1.55] text-(--text-secondary)">
              <strong className="text-(--danger-text)">Ethics flag.</strong>{" "}
              {company.ethicsNotes ?? "Ethics concerns noted. Confirm before accepting."}
            </div>
          </div>
        )}

        {/* Stage 1 pre-filters */}
        <div className="px-4 pb-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
            Stage 1 · Pre-filters
          </div>
          <div className="bg-sidebar border border-border rounded-[10px] overflow-hidden">
            {(
              [
                { label: "Salary band", pass: company.isSalaryMatch },
                { label: "Location", pass: company.isLocationMatch },
              ] as const
            ).map(({ label, pass }, i, arr) => (
              <div
                key={label}
                className={[
                  "flex items-center gap-2.5 px-4 py-3.5",
                  i < arr.length - 1 ? "border-b border-border" : "",
                ].join(" ")}
              >
                <CheckCircleIcon
                  size={16}
                  className={pass === true ? "text-(--success)" : "text-(--text-secondary)"}
                />
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-foreground leading-snug">
                    {label}
                  </div>
                </div>
                {pass !== null && pass !== undefined && (
                  <span
                    className={[
                      "inline-flex items-center h-4.5 px-1.5 rounded-[5px] text-[10px] font-semibold",
                      pass
                        ? "bg-(--success-bg) text-(--success-text)"
                        : "bg-(--danger-bg) text-(--danger-text)",
                    ].join(" ")}
                  >
                    {pass ? "Pass" : "Fail"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI summary */}
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

        {/* Stage 3 Scored criteria */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
              Stage 3 · Scored criteria
            </div>
            {isWaitingHuman && (
              <span className="text-[11px] font-medium text-(--text-secondary)">Tap to edit</span>
            )}
          </div>
          <div className="bg-sidebar border border-border rounded-[10px] overflow-hidden">
            {DEFAULT_CRITERIA.map((c, i) => {
              const s = criteriaScores[c.name] ?? c.defaultScore;
              return (
                <div
                  key={c.name}
                  className={[
                    "flex items-center gap-3 px-4 py-3.5",
                    i < DEFAULT_CRITERIA.length - 1 ? "border-b border-border" : "",
                  ].join(" ")}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground leading-snug">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-(--text-secondary) mt-0.5">
                      Weight {c.weight}
                    </div>
                  </div>
                  {isWaitingHuman ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => adjustScore(c.name, -1)}
                        disabled={s <= 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-(--surface-raised) text-(--text-secondary) hover:bg-border hover:text-foreground transition-colors disabled:opacity-30"
                      >
                        <MinusIcon size={14} />
                      </button>
                      <span className="w-6 text-center text-[14px] font-semibold text-foreground">
                        {s}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustScore(c.name, 1)}
                        disabled={s >= 5}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-(--surface-raised) text-(--text-secondary) hover:bg-border hover:text-foreground transition-colors disabled:opacity-30"
                      >
                        <PlusIcon size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[13px] font-semibold text-foreground shrink-0">
                      {s * c.weight}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {isWaitingHuman && (
            <button
              type="button"
              onClick={handleSaveScores}
              disabled={updateCompany.isPending}
              className="mt-3 w-full h-11 rounded-[10px] text-sm font-medium border border-border text-foreground hover:bg-(--surface-raised) transition-colors disabled:opacity-50"
            >
              Save scores
            </button>
          )}
        </div>

        {/* Notes */}
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

      {/* Action bar */}
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
