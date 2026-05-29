import { useState } from "react";
import { SparkleIcon } from "@phosphor-icons/react";
import type { CompanyFrameworkFormInputs, ScoredCriterion } from "@app/schemas";
import { ScoredCriteriaField } from "@/shared/fields/ScoredCriteriaField";

const DEFAULT_LOCATIONS = ["Remote", "Hybrid (India)", "On-site (India)"];

const DEFAULT_ETHICS_FLAGS = [
  "Data privacy violations",
  "Active regulatory action",
  "Predatory monetization (dark patterns, surveillance)",
  "Public reputation scandals",
];

const DEFAULT_CRITERIA: ScoredCriterion[] = [
  {
    name: "Work-Life Balance & Culture",
    whyItMatters:
      "A sustainable work environment is non-negotiable for long-term performance and personal wellbeing.",
    whatToLookFor:
      'Glassdoor WLB ≥ 3.8, avg LinkedIn tenure ≥ 2 yrs, JD language ("family", "many hats", "thrives under pressure") flagged.',
    weight: 5,
    autoNoGo: false,
  },
  {
    name: "Manager Quality & Role Clarity",
    whyItMatters: "The direct manager determines day-to-day experience more than any other factor.",
    whatToLookFor:
      "JD lists measurable outcomes. HM has mentorship history on LinkedIn. Role is a defined backfill or growth hire.",
    weight: 5,
    autoNoGo: false,
  },
  {
    name: "Company Stability",
    whyItMatters: "Unstable companies lead to layoffs, pivots, and lost growth opportunities.",
    whatToLookFor:
      "Profitable or funded (runway ≥ 18 mo). No recent mass layoffs. Headcount stable or growing.",
    weight: 4,
    autoNoGo: false,
  },
  {
    name: "Learning & Mentorship",
    whyItMatters: "Continuous growth requires deliberate investment from the company.",
    whatToLookFor:
      "Learning budget or 20% time in JD. Senior engineers with mentorship history. Active engineering blog.",
    weight: 4,
    autoNoGo: false,
  },
  {
    name: "Clear Advancement Pathways",
    whyItMatters: "Defined progression prevents stagnation and aligns incentives.",
    whatToLookFor:
      "Levelling framework exists. Internal promotions visible on LinkedIn. Defined performance review cycle.",
    weight: 3,
    autoNoGo: false,
  },
  {
    name: "Tech Health & Stack",
    whyItMatters: "Working with modern tooling builds marketable skills and reduces frustration.",
    whatToLookFor:
      "Stack aligns with target skills. CI/CD, observability, modern practices in JD or eng blog. Low Glassdoor complaints about tech debt.",
    weight: 3,
    autoNoGo: false,
  },
  {
    name: "Team Integration & Culture",
    whyItMatters: "Good team dynamics reduce friction and make work enjoyable.",
    whatToLookFor:
      "Proportional team size. Cross-functional collaboration in JD. Good peer-review sentiment.",
    weight: 2,
    autoNoGo: false,
  },
  {
    name: "Impactful Projects",
    whyItMatters: "Real-world impact provides motivation and strong portfolio material.",
    whatToLookFor:
      'Real users or revenue. Non-trivial engineering challenges (scale, reliability, ML). Ask: "What shipped last quarter?"',
    weight: 1,
    autoNoGo: false,
  },
];

const DEFAULT_FORM: CompanyFrameworkFormInputs = {
  salaryMin: 12,
  salaryMax: 16,
  locations: DEFAULT_LOCATIONS,
  ethicsRedFlags: DEFAULT_ETHICS_FLAGS,
  scoredCriteria: DEFAULT_CRITERIA,
  strongFitThreshold: 80,
  conditionalFitThreshold: 60,
};

type FormErrors = {
  salaryMin?: string;
  salaryMax?: string;
  locations?: string;
  strongFitThreshold?: string;
  conditionalFitThreshold?: string;
  scoredCriteria?: string;
  criteriaFields?: Record<number, Partial<Record<keyof ScoredCriterion, string>>>;
};

interface Props {
  initialValues?: CompanyFrameworkFormInputs;
  onGenerate: (inputs: CompanyFrameworkFormInputs) => Promise<void>;
  isGenerating: boolean;
  generateError?: string;
  context: "onboarding" | "settings";
}

export function CompanyResearchFrameworkForm({
  initialValues,
  onGenerate,
  isGenerating,
  generateError,
  context,
}: Props) {
  const [form, setForm] = useState<CompanyFrameworkFormInputs>(initialValues ?? DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [newLocationInput, setNewLocationInput] = useState("");
  const [newEthicsInput, setNewEthicsInput] = useState("");
  const [exampleOpen, setExampleOpen] = useState(false);

  const maxScore = form.scoredCriteria.reduce((s, c) => s + c.weight * 5, 0);
  const strongFitMin = Math.round((form.strongFitThreshold / 100) * maxScore);
  const conditionalFitMin = Math.round((form.conditionalFitThreshold / 100) * maxScore);

  function validate(): boolean {
    const e: FormErrors = {};

    if (form.salaryMin < 0) e.salaryMin = "Must be ≥ 0";
    if (form.salaryMax < 0) e.salaryMax = "Must be ≥ 0";
    if (form.salaryMin >= form.salaryMax) e.salaryMin = "Min must be less than max";
    if (form.locations.length === 0) e.locations = "At least one location required";
    if (form.strongFitThreshold <= form.conditionalFitThreshold)
      e.strongFitThreshold = "Strong fit must be greater than conditional fit";
    if (form.strongFitThreshold < 1 || form.strongFitThreshold > 99)
      e.strongFitThreshold = "Must be between 1 and 99";
    if (form.conditionalFitThreshold < 1 || form.conditionalFitThreshold > 99)
      e.conditionalFitThreshold = "Must be between 1 and 99";
    if (form.scoredCriteria.length === 0) e.scoredCriteria = "At least one criterion required";

    const criteriaErrors: Record<number, Partial<Record<keyof ScoredCriterion, string>>> = {};
    form.scoredCriteria.forEach((c, i) => {
      const ce: Partial<Record<keyof ScoredCriterion, string>> = {};
      if (!c.name.trim()) ce.name = "Required";
      if (!c.whyItMatters.trim()) ce.whyItMatters = "Required";
      if (!c.whatToLookFor.trim()) ce.whatToLookFor = "Required";
      if (Object.keys(ce).length > 0) criteriaErrors[i] = ce;
    });
    if (Object.keys(criteriaErrors).length > 0) e.criteriaFields = criteriaErrors;

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function addLocation() {
    const v = newLocationInput.trim();
    if (!v || form.locations.includes(v)) return;
    setForm((f) => ({ ...f, locations: [...f.locations, v] }));
    setNewLocationInput("");
  }

  function removeLocation(loc: string) {
    setForm((f) => ({ ...f, locations: f.locations.filter((l) => l !== loc) }));
  }

  function addEthicsFlag() {
    const v = newEthicsInput.trim();
    if (!v || form.ethicsRedFlags.includes(v)) return;
    setForm((f) => ({ ...f, ethicsRedFlags: [...f.ethicsRedFlags, v] }));
    setNewEthicsInput("");
  }

  function removeEthicsFlag(flag: string) {
    setForm((f) => ({ ...f, ethicsRedFlags: f.ethicsRedFlags.filter((fl) => fl !== flag) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onGenerate(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      {/* See an example — onboarding only */}
      {context === "onboarding" && (
        <div className="rounded-r-lg border border-border border-l-[3px] border-l-(--ai-border) bg-(--ai-bg) overflow-hidden">
          <button
            type="button"
            onClick={() => setExampleOpen((o) => !o)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left"
          >
            <SparkleIcon size={12} className="text-(--ai) shrink-0" weight="fill" />
            <span className="text-[11px] font-semibold text-(--ai-text) uppercase tracking-[0.05em] flex-1">
              See an example
            </span>
            <span className="text-[11px] text-(--ai-text)">{exampleOpen ? "▲" : "▼"}</span>
          </button>
          {exampleOpen && (
            <div className="px-4 pb-4 flex flex-col gap-3">
              <p className="text-[12px] leading-[1.65] text-(--text-secondary)">
                With Work-Life Balance weight set to 5, the AI flags any company where Glassdoor WLB
                rating is below 3.8 as a likely miss.
              </p>
              <div className="rounded-lg bg-(--ai-bg) border border-(--ai-border) p-3 text-[12px] leading-[1.75] text-foreground font-mono whitespace-pre-wrap">
                {`STAGE 1 — Pre-Filters
• Salary: 12–16 LPA
• Location: Remote or India-based

STAGE 2 — Ethics Gate
Flag: data privacy violations, predatory monetisation.

STAGE 3 — Scored Criteria (max 135)
P1 Work-Life Balance  (weight 5, AUTO NO-GO)
P2 Manager Quality    (weight 5)
…

Strong Fit ≥ 108 pts · Conditional ≥ 81 pts`}
              </div>
              <p className="text-[12px] leading-[1.65] text-(--text-secondary)">
                When you save this framework, it becomes v1. The AI uses it for every company
                research run until you update it.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stage 1: Pre-filters */}
      <section className="bg-card rounded-xl border border-border p-6 flex flex-col gap-5">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">Stage 1 · Pre-filters</h3>
          <p className="text-[12px] leading-[1.55] text-(--text-secondary) mt-1">
            Hard gates. If either fails, the company is disqualified before scoring.
          </p>
        </div>

        {/* Salary range */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-2">
            Salary range (LPA)
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="number"
                min={0}
                value={form.salaryMin}
                onChange={(e) => setForm((f) => ({ ...f, salaryMin: Number(e.target.value) }))}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Min"
              />
            </div>
            <span className="text-muted-foreground text-[13px]">—</span>
            <div className="flex-1">
              <input
                type="number"
                min={0}
                value={form.salaryMax}
                onChange={(e) => setForm((f) => ({ ...f, salaryMax: Number(e.target.value) }))}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Max"
              />
            </div>
          </div>
          {errors.salaryMin && (
            <p className="mt-1 text-[12px] text-destructive">{errors.salaryMin}</p>
          )}
          {errors.salaryMax && !errors.salaryMin && (
            <p className="mt-1 text-[12px] text-destructive">{errors.salaryMax}</p>
          )}
        </div>

        {/* Locations */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-2">
            Acceptable locations
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.locations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-(--accent-bg) text-(--accent-text) text-[12px] font-medium"
              >
                {loc}
                <button
                  type="button"
                  onClick={() => removeLocation(loc)}
                  className="text-(--accent-text) hover:opacity-70 transition-opacity leading-none"
                  aria-label={`Remove ${loc}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLocationInput}
              onChange={(e) => setNewLocationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLocation();
                }
              }}
              placeholder="Add city or region…"
              className="h-9 flex-1 rounded-lg border border-dashed border-(--border-strong) bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={addLocation}
              className="h-9 px-3 rounded-lg border border-border text-[13px] font-medium text-(--text-secondary) hover:text-foreground hover:bg-(--surface-raised) transition-colors"
            >
              Add
            </button>
          </div>
          {errors.locations && (
            <p className="mt-1 text-[12px] text-destructive">{errors.locations}</p>
          )}
        </div>
      </section>

      {/* Stage 2: Ethics gate */}
      <section className="bg-card rounded-xl border border-border p-6 flex flex-col gap-5">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">Stage 2 · Ethics gate</h3>
          <p className="text-[12px] leading-[1.55] text-(--text-secondary) mt-1">
            Surface for conscious human review — does not auto-disqualify.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mb-1">
          {form.ethicsRedFlags.map((flag) => (
            <span
              key={flag}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[12px] font-medium"
            >
              {flag}
              <button
                type="button"
                onClick={() => removeEthicsFlag(flag)}
                className="text-(--text-secondary) hover:opacity-70 transition-opacity leading-none"
                aria-label={`Remove ${flag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newEthicsInput}
            onChange={(e) => setNewEthicsInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEthicsFlag();
              }
            }}
            placeholder="Add custom red flag…"
            className="h-9 flex-1 rounded-lg border border-dashed border-(--border-strong) bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="button"
            onClick={addEthicsFlag}
            className="h-9 px-3 rounded-lg border border-border text-[13px] font-medium text-(--text-secondary) hover:text-foreground hover:bg-(--surface-raised) transition-colors"
          >
            Add
          </button>
        </div>
        {form.ethicsRedFlags.length === 0 && (
          <p className="text-[12px] text-(--text-secondary) italic">
            No ethics flags set — all companies proceed to scoring.
          </p>
        )}
      </section>

      {/* Stage 3: Scored criteria */}
      <section className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-foreground">Stage 3 · Scored criteria</h3>
            <p className="text-[12px] leading-[1.55] text-(--text-secondary) mt-1">
              {form.scoredCriteria.length} criteria · max {maxScore} pts · drag to reorder (priority
              matters)
            </p>
          </div>
        </div>

        <ScoredCriteriaField
          criteria={form.scoredCriteria}
          onChange={(criteria) => setForm((f) => ({ ...f, scoredCriteria: criteria }))}
          errors={errors.criteriaFields}
        />
        {errors.scoredCriteria && (
          <p className="text-[12px] text-destructive">{errors.scoredCriteria}</p>
        )}
      </section>

      {/* Decision bands */}
      <section className="bg-card rounded-xl border border-border p-6 flex flex-col gap-5">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">Decision bands</h3>
          <p className="text-[12px] leading-[1.55] text-(--text-secondary) mt-1">
            Thresholds as a percentage of max — works regardless of your criteria count.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-2">
              Strong fit ≥
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={99}
                value={form.strongFitThreshold}
                onChange={(e) =>
                  setForm((f) => ({ ...f, strongFitThreshold: Number(e.target.value) }))
                }
                className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-[13px] text-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <span className="text-muted-foreground text-[13px]">%</span>
            </div>
            {errors.strongFitThreshold && (
              <p className="mt-1 text-[12px] text-destructive">{errors.strongFitThreshold}</p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-2">
              Conditional fit ≥
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={99}
                value={form.conditionalFitThreshold}
                onChange={(e) =>
                  setForm((f) => ({ ...f, conditionalFitThreshold: Number(e.target.value) }))
                }
                className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-[13px] text-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <span className="text-muted-foreground text-[13px]">%</span>
            </div>
            {errors.conditionalFitThreshold && (
              <p className="mt-1 text-[12px] text-destructive">{errors.conditionalFitThreshold}</p>
            )}
          </div>
        </div>

        {/* Live computed example */}
        <p className="text-[12px] leading-[1.55] text-(--text-secondary)">
          With {form.scoredCriteria.length} criteria, max = {maxScore}.{" "}
          <span className="text-(--success-text) font-medium">Strong Fit ≥ {strongFitMin} pts</span>
          {", "}
          <span className="text-(--warning-text) font-medium">
            Conditional Fit ≥ {conditionalFitMin} pts
          </span>
          {". Weak Fit = anything below Conditional threshold."}
        </p>
      </section>

      {/* Auto no-go summary */}
      <section className="bg-card rounded-xl border border-border p-6 flex flex-col gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">Auto no-go flags</h3>
          <p className="text-[12px] leading-[1.55] text-(--text-secondary) mt-1">
            If any of these criteria score 0, the company is rejected regardless of total score.
          </p>
        </div>
        {form.scoredCriteria.filter((c) => c.autoNoGo).length === 0 ? (
          <p className="text-[12px] text-(--text-secondary) italic">
            None set — enable Auto No-Go on any criterion above.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {form.scoredCriteria
              .map((c, i) => ({ c, i }))
              .filter(({ c }) => c.autoNoGo)
              .map(({ c, i }) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-7 rounded text-[10px] font-semibold bg-(--accent-bg) text-(--accent-text)">
                    P{i + 1}
                  </span>
                  <span className="text-[13px] text-foreground">{c.name}</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* Generate button */}
      <div className="flex flex-col gap-2">
        {generateError && (
          <div className="rounded-lg bg-(--danger-bg) border border-destructive px-4 py-3 text-[13px] text-(--danger-text)">
            {generateError}
          </div>
        )}
        <button
          type="submit"
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 h-[31px] px-[13px] rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed self-start"
        >
          {isGenerating ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <SparkleIcon size={13} weight="fill" />
              Generate framework
            </>
          )}
        </button>
      </div>
    </form>
  );
}
