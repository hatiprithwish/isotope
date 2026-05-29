import FrameworksDAL from "@/data-access-layer/FrameworksDAL";
import AiProvider from "@/providers/ai";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/logger";
import Constants from "@/config/Constants";

const GENERATE_SYSTEM_PROMPT = `You are a job search AI assistant. You will receive a partially-written Company Research Evaluation Framework document with placeholders already filled in. Your job is to complete and polish it into a clean, well-formatted markdown document. Do not change any of the values — only improve prose clarity and formatting. Output only the final document with no preamble or commentary.`;

export default class FrameworksRepo {
  private dal: FrameworksDAL;
  private ai: AiProvider;

  constructor(env: Env) {
    this.dal = new FrameworksDAL(env);
    this.ai = new AiProvider(env);
  }

  async generateCompanyFramework(params: {
    userId: string;
    formInputs: Schemas.CompanyFrameworkFormInputs;
  }): Promise<Schemas.GenerateFrameworkApiResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.GenerateFramework,
      message: "Generating company research framework",
      metadata: { userId: params.userId },
    });

    const { formInputs } = params;
    const maxScore = formInputs.scoredCriteria.reduce((sum, c) => sum + c.weight * 5, 0);
    const strongFitMin = Math.round((formInputs.strongFitThreshold / 100) * maxScore);
    const conditionalFitMin = Math.round((formInputs.conditionalFitThreshold / 100) * maxScore);

    const autoNoGoCriteria = formInputs.scoredCriteria
      .map((c, i) => ({ ...c, priority: `P${i + 1}` }))
      .filter((c) => c.autoNoGo);

    const userMessage = `# Company Research — Evaluation Framework

_Value-Aligned Company Filter & Prioritised Scorecard_

## How to Use This Document

Run every company through the three stages in order. A company only advances if it clears the current stage. Do not skip stages.

| Stage   | Type            | Purpose |
| ------- | --------------- | ------- |
| Stage 1 | Pre-Filters     | Binary pass/fail. Hard logistics constraints — failing either disqualifies immediately. |
| Stage 2 | Ethics Gate     | Pass/fail. Serious ethical red flags are disqualifiers no score can override. |
| Stage 3 | Scored Criteria | ${formInputs.scoredCriteria.length} criteria ranked P1–P${formInputs.scoredCriteria.length} by importance. Score 0–5 on each, multiply by weight. Use decision bands to determine Go / No-Go. |

## Stage 1 — Pre-Filters

Hard constraints. If either fails, stop.

| Pre-Filter Criterion | What to Check |
| -------------------- | ------------- |
| Salary Band: ${formInputs.salaryMin}–${formInputs.salaryMax} LPA | Confirm offered CTC is within ${formInputs.salaryMin}–${formInputs.salaryMax} LPA. Check JD, Glassdoor, AmbitionBox, or ask recruiter upfront. |
| Location: ${formInputs.locations.join(" or ")} | Role must be: ${formInputs.locations.join(", ")}. |

Both must PASS to continue.

## Stage 2 — Ethics Gate

Ethics & reputation risk is a gate, not a score. Flag consciously — do not let scorecard numbers override a serious concern.

| Ethics & Risk Gate | Red Flags to Check |
| ------------------ | ------------------ |
| No Serious Ethics / Legal Risk | ${formInputs.ethicsRedFlags.length > 0 ? formInputs.ethicsRedFlags.join("; ") : "No specific flags configured — apply general judgement."} |

Must be CLEAR to continue.

## Stage 3 — Value-Aligned Scoring Criteria

Score each criterion 0–5. Multiply by Weight for weighted score. Max possible score: **${maxScore} points**.

| Pri. | Criterion | Why It Matters | What to Look For | Wt. |${autoNoGoCriteria.length > 0 ? " Auto No-Go |" : ""}
| ---- | --------- | -------------- | ---------------- | --- |${autoNoGoCriteria.length > 0 ? " ---------- |" : ""}
${formInputs.scoredCriteria
  .map(
    (c, i) =>
      `| P${i + 1} | ${c.name} | ${c.whyItMatters} | ${c.whatToLookFor} | ${c.weight} |${autoNoGoCriteria.length > 0 ? (c.autoNoGo ? " ✓ |" : "  |") : ""}`,
  )
  .join("\n")}

### Scoring Guide

| Score | Meaning |
| ----- | ------- |
| 5 | Fully met — clear, verifiable evidence. No doubt. |
| 4 | Mostly met — strong signals, one minor gap. |
| 3 | Partially met — mixed signals. Ask about it in interview. |
| 2 | Mostly not met — weak evidence, significant gaps. |
| 1 | Barely met — only one weak signal. |
| 0 | Not met — no evidence or clear counter-evidence. |

## Decision Bands

Maximum possible weighted score: **${maxScore} points**.

| Band | Weighted Score | Decision |
| ---- | -------------- | -------- |
| Strong Fit | ≥ ${formInputs.strongFitThreshold}% of ${maxScore} (≥ ${strongFitMin} pts) | Apply aggressively. Prioritise in pipeline. |
| Conditional Fit | ${formInputs.conditionalFitThreshold}–${formInputs.strongFitThreshold - 1}% (${conditionalFitMin}–${strongFitMin - 1} pts) | Apply if pipeline is thin. Flag gaps to probe in interview. |
| Weak Fit | < ${formInputs.conditionalFitThreshold}% (< ${conditionalFitMin} pts) | Skip unless you have a strong personal connection inside. |
${
  autoNoGoCriteria.length > 0
    ? `
**Auto No-Go rule:** If a company scores 0 on ${autoNoGoCriteria.map((c) => `${c.priority} (${c.name})`).join(" or ")}, treat it as a No-Go regardless of total score.`
    : ""
}`;

    try {
      const result = await this.ai.runWithRetry(Constants.AI_MODELS.llama, [
        { role: "system", content: GENERATE_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ]);

      AppLogger.info({
        category: Schemas.LogCategory.Repo,
        action: Schemas.LogAction.GenerateFramework,
        message: "Framework generated successfully",
        metadata: { userId: params.userId, length: result.response.length },
      });

      return { isSuccess: true, message: "Framework generated", frameworkText: result.response };
    } catch (error) {
      const message = "Failed to generate framework";
      AppLogger.error({
        category: Schemas.LogCategory.Repo,
        action: Schemas.LogAction.GenerateFramework,
        message,
        error,
        metadata: { userId: params.userId },
      });
      return { isSuccess: false, message };
    }
  }

  async saveCompanyFramework(params: {
    userId: string;
    content: string;
    formInputs?: Schemas.CompanyFrameworkFormInputs;
    isCustomized?: boolean;
  }): Promise<Schemas.SaveFrameworkApiResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.SaveFramework,
      message: "Saving company research framework",
      metadata: { userId: params.userId },
    });

    const latestRes = await this.dal.getLatestFramework({
      createdBy: params.userId,
      type: Schemas.FrameworkTypeIntEnum.CompanyResearch,
    });

    if (!latestRes.isSuccess) {
      return { isSuccess: false, message: "Failed to determine next version" };
    }

    const nextVersion = latestRes.framework ? latestRes.framework.version + 1 : 1;

    return this.dal.createFramework({
      createdBy: params.userId,
      type: Schemas.FrameworkTypeIntEnum.CompanyResearch,
      content: params.content,
      formInputs: params.formInputs ? JSON.stringify(params.formInputs) : null,
      isCustomized: params.isCustomized ?? false,
      version: nextVersion,
    });
  }

  async getLatestCompanyFramework(params: { userId: string }) {
    return this.dal.getLatestFramework({
      createdBy: params.userId,
      type: Schemas.FrameworkTypeIntEnum.CompanyResearch,
    });
  }

  async getCompanyFrameworkVersions(params: { userId: string }) {
    return this.dal.getFrameworkVersions({
      createdBy: params.userId,
      type: Schemas.FrameworkTypeIntEnum.CompanyResearch,
      limit: 5,
    });
  }
}
