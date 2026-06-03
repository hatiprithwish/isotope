import { useState } from "react";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { DEFAULT_CRITERIA, MAX_SCORE, computeWeightedScore, deriveFitBand } from "./-criteria";
import { useUpdateCompany } from "./-data";

interface Props {
  companyId: number;
  isWaitingHuman: boolean;
}

export function ScoredCriteria({ companyId, isWaitingHuman }: Props) {
  const updateCompany = useUpdateCompany();
  const initialScores = Object.fromEntries(DEFAULT_CRITERIA.map((c) => [c.name, c.defaultScore]));
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>(initialScores);

  const localWeighted = computeWeightedScore(criteriaScores);
  const localPct = MAX_SCORE > 0 ? Math.round((localWeighted / MAX_SCORE) * 100) : 0;

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
      id: companyId,
      body: { company: { weightedScore: weighted, fitBand: fit } },
    });
  }

  return (
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
  );
}
