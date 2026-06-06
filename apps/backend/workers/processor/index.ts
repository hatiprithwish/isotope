import { configureLogger, disposeLogger } from "@/providers/AppLogger";

// DEV_NOTE: Configure logger at the top level to ensure it's ready before handling any requests
await configureLogger();

export default {
  async queue(batch: MessageBatch<unknown>, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(disposeLogger());

    for (const message of batch.messages) {
      try {
        // Route message by type — add handlers here as queue producers are wired up
        message.ack();
      } catch (err) {
        message.retry();
      }
    }
  },
};
