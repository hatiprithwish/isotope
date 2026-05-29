import { useState } from "react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  PlusIcon,
  DotsSixVerticalIcon,
} from "@phosphor-icons/react";
import type { ScoredCriterion } from "@app/schemas";

interface Props {
  criteria: ScoredCriterion[];
  onChange: (criteria: ScoredCriterion[]) => void;
  errors?: Record<number, Partial<Record<keyof ScoredCriterion, string>>>;
}

const DEFAULT_CRITERION: ScoredCriterion = {
  name: "",
  whyItMatters: "",
  whatToLookFor: "",
  weight: 3,
  autoNoGo: false,
};

export function ScoredCriteriaField({ criteria, onChange, errors = {} }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  function update(index: number, patch: Partial<ScoredCriterion>) {
    onChange(criteria.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function remove(index: number) {
    if (criteria.length <= 1) return;
    onChange(criteria.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index) setExpandedIndex(expandedIndex - 1);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...criteria];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
    if (expandedIndex === index) setExpandedIndex(index - 1);
    else if (expandedIndex === index - 1) setExpandedIndex(index);
  }

  function moveDown(index: number) {
    if (index === criteria.length - 1) return;
    const next = [...criteria];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
    if (expandedIndex === index) setExpandedIndex(index + 1);
    else if (expandedIndex === index + 1) setExpandedIndex(index);
  }

  function addCriterion() {
    const next = [...criteria, { ...DEFAULT_CRITERION }];
    onChange(next);
    setExpandedIndex(next.length - 1);
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Desktop header */}
      <div className="hidden md:grid grid-cols-[20px_1fr_120px_90px_32px] gap-3 items-center px-0 py-2 border-b border-border">
        <span />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Criterion
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Weight (0–5)
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Auto No-Go
        </span>
        <span />
      </div>

      {criteria.map((c, i) => {
        const fieldErrors = errors[i] ?? {};
        const isExpanded = expandedIndex === i;

        return (
          <div key={i} className="border-b border-border last:border-b-0">
            {/* Summary row */}
            <div
              className="grid grid-cols-[20px_1fr_120px_90px_32px] gap-3 items-center py-3 cursor-pointer"
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
            >
              {/* Drag handle / priority badge */}
              <div className="flex items-center justify-center">
                <span className="hidden md:flex items-center text-muted-foreground">
                  <DotsSixVerticalIcon size={14} weight="bold" />
                </span>
                <span className="flex md:hidden text-[10px] font-semibold text-muted-foreground">
                  P{i + 1}
                </span>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <span className="hidden md:inline-flex items-center justify-center h-5 px-1.5 rounded text-[10px] font-semibold bg-(--accent-bg) text-(--accent-text) shrink-0">
                  P{i + 1}
                </span>
                <span className="text-[13px] font-medium text-foreground truncate">
                  {c.name || (
                    <span className="text-muted-foreground italic">Untitled criterion</span>
                  )}
                </span>
                {c.autoNoGo && (
                  <span className="hidden md:inline-flex items-center h-4.5 px-1.5 rounded text-[10px] font-semibold bg-(--danger-bg) text-(--danger-text) shrink-0">
                    No-Go
                  </span>
                )}
              </div>

              {/* Weight stepper */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => update(i, { weight: Math.max(0, c.weight - 1) })}
                  className="flex items-center justify-center w-6 h-6 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-(--surface-raised) transition-colors"
                  aria-label="Decrease weight"
                >
                  <span className="text-sm leading-none">−</span>
                </button>
                <span className="w-7 text-center text-[13px] font-semibold text-foreground">
                  {c.weight}
                </span>
                <button
                  type="button"
                  onClick={() => update(i, { weight: Math.min(5, c.weight + 1) })}
                  className="flex items-center justify-center w-6 h-6 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-(--surface-raised) transition-colors"
                  aria-label="Increase weight"
                >
                  <PlusIcon size={12} />
                </button>
              </div>

              {/* Auto No-Go toggle */}
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={c.autoNoGo}
                  onClick={() => update(i, { autoNoGo: !c.autoNoGo })}
                  className={`relative inline-flex w-9 h-5.5 rounded-full transition-colors ${
                    c.autoNoGo ? "bg-primary" : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all duration-150 ${
                      c.autoNoGo ? "left-4.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(i);
                }}
                disabled={criteria.length <= 1}
                className="flex items-center justify-center w-8 h-8 rounded text-muted-foreground hover:text-destructive hover:bg-(--danger-bg) transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Remove criterion"
              >
                <TrashIcon size={13} />
              </button>
            </div>

            {/* Mobile reorder buttons */}
            <div className="flex md:hidden items-center gap-2 pb-2 pl-7">
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="flex items-center justify-center w-6 h-6 rounded border border-border text-muted-foreground disabled:opacity-30"
                aria-label="Move up"
              >
                <ArrowUpIcon size={12} />
              </button>
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i === criteria.length - 1}
                className="flex items-center justify-center w-6 h-6 rounded border border-border text-muted-foreground disabled:opacity-30"
                aria-label="Move down"
              >
                <ArrowDownIcon size={12} />
              </button>
            </div>

            {/* Expanded detail form */}
            {isExpanded && (
              <div className="pb-4 pl-8 pr-0 flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    placeholder="e.g. Work-Life Balance & Culture"
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-[12px] text-destructive">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Why it matters *
                  </label>
                  <textarea
                    value={c.whyItMatters}
                    onChange={(e) => update(i, { whyItMatters: e.target.value })}
                    placeholder="Your reasoning for including this criterion"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                  {fieldErrors.whyItMatters && (
                    <p className="mt-1 text-[12px] text-destructive">{fieldErrors.whyItMatters}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    What to look for *
                  </label>
                  <textarea
                    value={c.whatToLookFor}
                    onChange={(e) => update(i, { whatToLookFor: e.target.value })}
                    placeholder="Signals AI should check (Glassdoor, LinkedIn, JD language…)"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                  {fieldErrors.whatToLookFor && (
                    <p className="mt-1 text-[12px] text-destructive">{fieldErrors.whatToLookFor}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add criterion */}
      <button
        type="button"
        onClick={addCriterion}
        className="flex items-center justify-center gap-2 h-10 mt-2 rounded-lg border border-dashed border-(--border-strong) text-[13px] font-medium text-(--text-secondary) hover:text-foreground hover:border-border transition-colors"
      >
        <PlusIcon size={14} />
        Add criterion
      </button>
    </div>
  );
}
