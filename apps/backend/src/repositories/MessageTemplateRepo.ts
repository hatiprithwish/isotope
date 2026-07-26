import MessageTemplateDAL from "@/data-access-layer/MessageTemplateDAL";
import * as Schemas from "@app/schemas";
import AppLogger from "@/providers/AppLogger";

export default class MessageTemplateRepo {
  private dal: MessageTemplateDAL;

  constructor(env: Env) {
    this.dal = new MessageTemplateDAL(env);
  }

  async getTemplates(params: { userId: string }): Promise<Schemas.GetMessageTemplatesApiResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.GetMessageTemplates,
      message: "Fetching message templates",
      metadata: { userId: params.userId },
    });

    return this.dal.getTemplates({ createdBy: params.userId });
  }

  async findTemplate(params: {
    userId: string;
    step: number;
    variantLabel: string | null;
  }): Promise<Schemas.MessageTemplate | null> {
    return this.dal.findTemplate({
      createdBy: params.userId,
      step: params.step,
      variantLabel: params.variantLabel,
    });
  }

  async saveTemplate(params: {
    userId: string;
    input: Schemas.SaveMessageTemplateApiRequest;
  }): Promise<Schemas.SaveMessageTemplateApiResponse> {
    AppLogger.info({
      category: Schemas.LogCategory.Repo,
      action: Schemas.LogAction.SaveMessageTemplate,
      message: "Saving message template",
      metadata: { userId: params.userId, step: params.input.step },
    });

    return this.dal.saveTemplate({
      createdBy: params.userId,
      step: params.input.step,
      variantLabel: params.input.variantLabel,
      body: params.input.body,
    });
  }
}
