import { configureLogger, disposeLogger } from "@/providers/AppLogger";
import EnvConfig from "@/config/EnvConfig";
import InboundJobAlertHandler from "@/handlers/InboundJobAlertHandler";

// DEV_NOTE: Configure logger at the top level to ensure it's ready before handling any requests
await configureLogger();

type QueueMessage = { type?: string };

export default {
  async queue(batch: MessageBatch<unknown>, env: Env, ctx: ExecutionContext): Promise<void> {
    EnvConfig.validate(env);
    ctx.waitUntil(disposeLogger());

    const firstMessage = batch.messages[0]?.body as QueueMessage | undefined;
    const messageType = firstMessage?.type;

    if (messageType === "InboundJobAlert") {
      await InboundJobAlertHandler.handle(batch, env);
      return;
    }

    // Unknown message type — ack to avoid stalling the queue
    for (const message of batch.messages) {
      message.ack();
    }
  },
};
