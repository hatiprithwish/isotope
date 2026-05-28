export interface Criterion {
  name: string;
  weight: number;
  defaultScore: number;
}

export const DEFAULT_CRITERIA: Criterion[] = [
  { name: "Work-Life Balance & Culture", weight: 5, defaultScore: 3 },
  { name: "Manager Quality & Role Clarity", weight: 5, defaultScore: 3 },
  { name: "Company Stability", weight: 4, defaultScore: 3 },
  { name: "Learning & Mentorship", weight: 4, defaultScore: 3 },
  { name: "Clear Advancement Pathways", weight: 3, defaultScore: 3 },
  { name: "Tech Health & Stack", weight: 3, defaultScore: 3 },
  { name: "Team Integration & Culture", weight: 2, defaultScore: 3 },
  { name: "Impactful Projects", weight: 1, defaultScore: 3 },
];

export const MAX_SCORE = DEFAULT_CRITERIA.reduce((sum, c) => sum + 5 * c.weight, 0);

export function computeWeightedScore(scores: Record<string, number>): number {
  return DEFAULT_CRITERIA.reduce(
    (sum, c) => sum + (scores[c.name] ?? c.defaultScore) * c.weight,
    0,
  );
}

export function deriveFitBand(score: number): 1 | 2 | 3 | 4 {
  const pct = MAX_SCORE > 0 ? (score / MAX_SCORE) * 100 : 0;
  if (pct >= 80) return 1; // StrongFit
  if (pct >= 60) return 2; // ConditionalFit
  return 3; // WeakFit
}
