import type Constants from "@/config/Constants";
import AppLogger from "@/providers/AppLogger";
import * as Schemas from "@app/schemas";

export type AiModel = (typeof Constants.AI_MODELS)[keyof typeof Constants.AI_MODELS];

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

  /**
   * JSON-mode inference. Workers AI returns `response` already parsed into an object when
   * `response_format` is a json_schema, so there is no string to JSON.parse here. The model can
   * still fail to satisfy the schema (Workers AI surfaces "JSON Mode couldn't be met"), which
   * throws — callers treat that as "no result", never as a hard failure.
   */
  async runJson<TResult>(
    model: AiModel,
    messages: AiMessage[],
    jsonSchema: Record<string, unknown>,
  ): Promise<TResult> {
    AppLogger.info({
      category: Schemas.LogCategory.Provider,
      action: Schemas.LogAction.AiRun,
      message: "Running AI inference (JSON mode)",
      metadata: { model, messageCount: messages.length },
    });

    const result = (await this.ai.run(model, {
      messages,
      response_format: { type: "json_schema", json_schema: jsonSchema },
    } as never)) as unknown as { response?: TResult };

    if (!result?.response) throw new Error("AI returned no JSON response");
    return result.response;
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
