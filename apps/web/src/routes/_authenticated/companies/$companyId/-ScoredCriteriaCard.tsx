import { useState } from "react";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { DEFAULT_CRITERIA, MAX_SCORE, computeWeightedScore, deriveFitBand } from "../-criteria";
import { useUpdateCompany } from "../-data";

interface Props {
  companyId: number;
  isWaitingHuman: boolean;
}

export function ScoredCriteriaCard({ companyId, isWaitingHuman }: Props) {
  const updateCompany = useUpdateCompany();
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
      id: companyId,
      body: { company: { weightedScore: weighted, fitBand: fit } },
    });
  }

  return (
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
                <div className="text-[13px] font-medium text-foreground leading-snug">{c.name}</div>
                <div className="text-[11px] text-(--text-secondary) mt-0.5">Weight {c.weight}</div>
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
  );
}

export { MAX_SCORE, computeWeightedScore };
