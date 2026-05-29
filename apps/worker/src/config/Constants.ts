export default class Constants {
  static readonly APP_REDACT_FIELDS = [/clerkId/i, /clerk_id/i];

  static readonly APP_NAME = "scaffold-worker" as const;

  static readonly AI_MODELS = {
    llama: "@cf/meta/llama-4-scout-17b-16e-instruct" as const,
  } as const;

  static readonly DEFAULT_PAGE_NO = 1 as const;
  static readonly DEFAULT_PAGE_SIZE = 20 as const;

  static readonly DEFAULT_COMPANY_RESEARCH_FRAMEWORK = `# Company Research — Evaluation Framework

_Value-Aligned Company Filter & Prioritised Scorecard_

## How to Use This Document

Run every company through the three stages in order. A company only advances to the next stage if it clears the current one. Do not skip stages — a high score in Stage 3 cannot override a failure in Stage 1 or Stage 2.

| Stage   | Type            | Purpose                                                                                                                                        |
| ------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage 1 | Pre-Filters     | Binary pass/fail. Both must pass. Logistics constraints — failing either makes the rest irrelevant.                                            |
| Stage 2 | Ethics Gate     | Pass/fail. Serious ethical red flags are disqualifiers that no scorecard number can override.                                                  |
| Stage 3 | Scored Criteria | 8 criteria ranked P1–P8 by importance. Score 0–5 on each. Multiply by weight. Use the decision band table to determine Go / No-Go.             |

## Stage 1 — Pre-Filters

Hard constraints. If either fails, stop — do not invest time in the scorecard.

| Pre-Filter Criterion         | What to Check                                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Salary Band: 12–16 LPA       | Confirm offered CTC is within 12–16 LPA. Check JD, Glassdoor, AmbitionBox, or ask recruiter. If not disclosed, estimate from Glassdoor peer roles.       |
| Location: Remote or In India | Role must be fully remote OR based in India. Hybrid with 2–3 days on-site in India is acceptable.                                                        |

Both must PASS to continue.

## Stage 2 — Ethics Gate

Ethics & reputation risk is a gate, not a score. A company with serious ethical issues should not pass just because it scores well on other criteria.

| Ethics & Risk Gate          | Red Flags to Check                                                                                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No Serious Ethics/Legal Risk | Known data privacy violations, active regulatory action, public reputation scandals, or shady monetisation (dark patterns, predatory pricing, surveillance). Check Glassdoor reviews, news, LinkedIn tenure patterns. |

Must be CLEAR to continue. If Flagged, document it and decide consciously — do not let the score override a serious concern.

## Stage 3 — Value-Aligned Scoring Criteria

Score each criterion 0–5. Multiply by Weight for weighted score. Criteria ordered P1–P8 from most to least important.

| Pri. | Criterion                      | Why It Matters                                                                                                                  | What to Look For                                                                                                                                                                         | Wt. |
| ---- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| P1   | Work-Life Balance & Culture    | Primary non-negotiable. A toxic or overwork culture makes every other criterion irrelevant.                                     | JD language (flag: "family", "thrives under pressure", "many hats"). Glassdoor WLB ≥ 3.8. Avg. LinkedIn tenure ≥ 2 yrs. Fixed 5-day, ≤ 10hr/day norms.                                  | 5   |
| P2   | Manager Quality & Role Clarity | You work FOR a manager, not a company. Clear KPIs and a good manager define your daily experience.                              | JD lists measurable outcomes. HM has mentorship history on LinkedIn. Role is a backfill or growth hire — not a vague "we'll figure it out" opening.                                      | 5   |
| P3   | Company Stability              | Unstable companies trigger sudden layoffs, pivots, and scope changes that destroy learning and WLB simultaneously.               | Profitable or well-funded (runway ≥ 18 months). Headcount trending stable or growing. No recent mass layoffs. B2B SaaS, established product, or logistics preferred.                    | 4   |
| P4   | Learning & Mentorship          | Rapid skill growth maximises long-term career value. Companies that invest in learning compound your returns.                    | Dedicated learning budget or time (e.g. 20% time, L&D stipend). Senior engineers with mentorship history. Structured onboarding. Engineering blog or public talks signal learning culture. | 4   |
| P5   | Clear Advancement Pathways     | Without a visible promotion ladder, you risk being stuck at the same level with no structured way to grow.                      | Levelling framework exists (IC2→IC3, SDE1→SDE2). Internal promotions visible on LinkedIn. Performance review cycle defined. HM can articulate what "great in 12 months" looks like.     | 3   |
| P6   | Tech Health & Stack            | Modern, market-relevant stack keeps skills current and CV strong. Tech-debt-ridden legacy systems drain energy and learning.           | Stack in JD aligns with target skills. Engineering blog/GitHub shows modern practices (CI/CD, observability, microservices). Low Glassdoor complaints about legacy code.                 | 3   |
| P7   | Team Integration & Culture     | A collaborative, psychologically safe team makes hard problems enjoyable. Siloed or political teams make easy problems painful.  | Team size proportional (not ≥ 30 engineers per manager). Cross-functional collaboration mentioned. Reviews mention good peer relationships. Low internal-transfer churn.                  | 2   |
| P8   | Impactful Projects             | Nice-to-have. Impact matters for CV and motivation, but is rarely verifiable pre-joining.                                       | Product has real users / revenue. Engineering challenges non-trivial (scale, reliability, ML, data). Ask in interview: "What shipped last quarter and what was your team's contribution?" | 1   |

### Scoring Guide

| Score | Meaning                                                   |
| ----- | --------------------------------------------------------- |
| 5     | Fully met — clear, verifiable evidence. No doubt.         |
| 4     | Mostly met — strong signals, one minor gap.               |
| 3     | Partially met — mixed signals. Ask about it in interview. |
| 2     | Mostly not met — weak evidence, significant gaps.         |
| 1     | Barely met — only one weak signal.                        |
| 0     | Not met — no evidence or clear counter-evidence.          |

## Decision Bands

Maximum possible weighted score: 135 points (sum of all weights × 5).

| Band            | Weighted Score        | Decision                                                    |
| --------------- | --------------------- | ----------------------------------------------------------- |
| Strong Fit      | ≥ 80% of 135 (≥ 108)  | Apply aggressively. Prioritise in pipeline.                 |
| Conditional Fit | 60–79% (81–107 pts)   | Apply if pipeline is thin. Flag gaps to probe in interview. |
| Weak Fit        | < 60% (< 81 pts)      | Skip unless you have a strong personal connection inside.   |

**Important:** If a company scores 0 on P1 (Work-Life Balance) or P2 (Manager Quality), treat it as a No-Go regardless of total score. These two criteria are the core of value alignment — a perfect score everywhere else cannot compensate for failing them.` as const;
}
