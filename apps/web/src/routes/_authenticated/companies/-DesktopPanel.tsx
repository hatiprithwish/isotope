import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { CompaniesQueries, useUpdateCompany } from "./-data";
import type * as Schemas from "@app/schemas";
import Avatar from "./-Avatar";
import {
  ArrowsOutSimpleIcon,
  CheckCircleIcon,
  XIcon,
  MinusIcon,
  PlusIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { StatusBadge } from "./-StatusBadge";
import ScoreBar from "./-ScoreBar";
import { DEFAULT_CRITERIA, MAX_SCORE, computeWeightedScore, deriveFitBand } from "./-criteria";
import Utilities from "@/utils";

function DesktopPanel({ company, onClose }: { company: Schemas.Company; onClose: () => void }) {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const updateCompany = useUpdateCompany();
  const score = company.weightedScore ?? 0;
  const hasEthicsFlag = company.isEthicsCompliant === false;
  const isWaitingHuman = company.status === 1;

  const { data: contactsData } = useQuery(CompaniesQueries.companyContacts(company.id, getToken));
  const linkedContacts = contactsData?.contacts ?? [];

  const initialScores = Object.fromEntries(DEFAULT_CRITERIA.map((c) => [c.name, c.defaultScore]));
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>(initialScores);

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
      id: company.id,
      body: { company: { weightedScore: weighted, fitBand: fit } },
    });
  }

  function handleAccept() {
    updateCompany.mutate({ id: company.id, body: { company: { status: 2 } } });
  }

  function handleReject() {
    updateCompany.mutate({ id: company.id, body: { company: { status: 4 } } });
  }

  const localWeighted = computeWeightedScore(criteriaScores);
  const localPct = MAX_SCORE > 0 ? Math.round((localWeighted / MAX_SCORE) * 100) : 0;
  const displayScore = isWaitingHuman ? localWeighted : score;

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
              Updated {company.updatedAt ?? company.createdAt}
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
          <ScoreBar score={displayScore} max={MAX_SCORE} />
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

        {/* Stage 3 Scored criteria */}
        <div className="px-5 py-4.5 border-b border-border">
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
              Stage 3 · Scored criteria
            </div>
            {isWaitingHuman && (
              <span className="text-[10px] font-medium text-(--text-secondary)">
                {localPct}% · Adjust to override
              </span>
            )}
          </div>
          <div className="flex flex-col">
            {DEFAULT_CRITERIA.map((c, i) => {
              const s = criteriaScores[c.name] ?? c.defaultScore;
              return (
                <div
                  key={c.name}
                  className={[
                    "flex items-center gap-2 py-2",
                    i < DEFAULT_CRITERIA.length - 1 ? "border-b border-border" : "",
                  ].join(" ")}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] font-medium text-foreground leading-snug">
                      {c.name}
                    </span>
                    <span className="text-[11px] text-(--text-secondary) ml-1.5">w{c.weight}</span>
                  </div>
                  {isWaitingHuman ? (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => adjustScore(c.name, -1)}
                        disabled={s <= 1}
                        className="w-5.5 h-5.5 flex items-center justify-center rounded bg-(--surface-raised) text-(--text-secondary) hover:bg-border hover:text-foreground transition-colors disabled:opacity-30"
                      >
                        <MinusIcon size={11} />
                      </button>
                      <span className="w-5.5 text-center text-[12px] font-semibold text-foreground">
                        {s}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustScore(c.name, 1)}
                        disabled={s >= 5}
                        className="w-5.5 h-5.5 flex items-center justify-center rounded bg-(--surface-raised) text-(--text-secondary) hover:bg-border hover:text-foreground transition-colors disabled:opacity-30"
                      >
                        <PlusIcon size={11} />
                      </button>
                      <span className="w-7 text-right text-[11px] text-(--text-secondary) shrink-0">
                        {s * c.weight}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[12px] font-semibold text-foreground shrink-0">
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
              className="mt-3 w-full h-7.75 rounded-lg text-[13px] font-medium border border-border text-foreground hover:bg-(--surface-raised) transition-colors disabled:opacity-50"
            >
              Save scores
            </button>
          )}
        </div>

        {/* Linked contacts */}
        <div className="px-5 py-4.5 border-b border-border">
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
              Contacts{linkedContacts.length > 0 && ` · ${linkedContacts.length}`}
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/contacts" })}
              className="text-[11px] font-medium text-primary hover:opacity-80 transition-opacity"
            >
              Add contact
            </button>
          </div>
          {linkedContacts.length === 0 ? (
            <div className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary)">
              <UserIcon size={14} className="opacity-40" />
              No contacts yet
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {linkedContacts.map((contact, i) => (
                <div
                  key={contact.id}
                  className={[
                    "flex items-center gap-2.5 py-2",
                    i < linkedContacts.length - 1 ? "border-b border-border" : "",
                  ].join(" ")}
                >
                  <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-semibold bg-(--accent-bg) text-(--accent-text) shrink-0">
                    {Utilities.getInitials(contact.name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-foreground truncate">
                      {contact.name}
                    </div>
                    {contact.designation && (
                      <div className="text-[11px] text-(--text-secondary) truncate">
                        {contact.designation}
                      </div>
                    )}
                  </div>
                  <span
                    className={[
                      "inline-flex items-center h-4.5 px-1.5 rounded-[5px] text-[10px] font-semibold shrink-0",
                      contact.status === 2
                        ? "bg-(--accent-bg) text-(--accent-text)"
                        : contact.status === 3 || contact.status === 4
                          ? "bg-(--pipeline-bg) text-(--pipeline-text)"
                          : contact.status === 5
                            ? "bg-(--success-bg) text-(--success-text)"
                            : "bg-(--surface-raised) text-(--text-secondary)",
                    ].join(" ")}
                  >
                    {contact.statusLabel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
          onClick={handleAccept}
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
