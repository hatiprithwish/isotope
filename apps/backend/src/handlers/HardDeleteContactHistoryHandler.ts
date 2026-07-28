import ContactsRepo from "@/repositories/ContactsRepo";
import AppLogger from "@/providers/AppLogger";
import * as Schemas from "@app/schemas";

interface HardDeleteContactHistoryMessage {
  type?: string;
  historyId: number;
  contactId: number;
  userId: string;
}

export default class HardDeleteContactHistoryHandler {
  static async handle(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    const repo = new ContactsRepo(env);

    for (const message of batch.messages) {
      const msg = message.body as HardDeleteContactHistoryMessage;

      if (msg?.type !== "HardDeleteContactHistory") {
        message.ack();
        continue;
      }

      const { historyId, contactId, userId } = msg;

      const response = await repo.hardDeleteContactHistory({ historyId, contactId, userId });

      AppLogger.info({
        category: Schemas.LogCategory.Provider,
        action: Schemas.LogAction.HardDeleteContactHistory,
        message: response.isSuccess
          ? "Hard-deleted contact history entry"
          : "Hard-delete no-op — entry restored or already deleted",
        metadata: { historyId, contactId, userId, isSuccess: response.isSuccess },
      });

      message.ack();
    }
  }
}
