import AppLogger from "@/providers/logger";
import * as Schemas from "@app/schemas";

export const AI_MODELS = {
  // Use for all AI work except personalisation research
  sonnet: "@cf/anthropic/claude-sonnet-4" as const,
  // Use exclusively for contact personalisation research (Step 5 of Contact Finder)
  haiku: "@cf/anthropic/claude-haiku-4" as const,
} as const;

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiTextResponse {
  response: string;
}

export default class AiProvider {
  private ai: Ai;

  constructor(env: Env) {
    this.ai = env.AI;
  }

  async run(model: AiModel, messages: AiMessage[]): Promise<AiTextResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.AiRun,
      message: "Running AI inference",
      metadata: { model, messageCount: messages.length },
    });

    const result = (await this.ai.run(model, {
      messages,
    })) as unknown as AiTextResponse;

    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.AiRun,
      message: "AI inference complete",
      metadata: { model },
    });

    return result;
  }

  async runWithRetry(
    model: AiModel,
    messages: AiMessage[],
    maxRetries = 3,
  ): Promise<AiTextResponse> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.run(model, messages);
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;

        AppLogger.error({
          category: Schemas.LogCategory.Repo,
          action: Schemas.LogAction.AiRun,
          message: isLastAttempt
            ? "AI inference failed after max retries"
            : `AI inference failed, retrying (attempt ${attempt + 1}/${maxRetries})`,
          error,
          metadata: { model, attempt, maxRetries },
        });

        if (isLastAttempt) throw error;
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
    throw new Error("AI run failed after max retries");
  }
}
