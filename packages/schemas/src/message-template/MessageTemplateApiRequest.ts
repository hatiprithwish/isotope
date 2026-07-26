import type { z } from "zod";
import { ZSaveMessageTemplateEntryInput } from "./MessageTemplateCommon";

export const ZSaveMessageTemplateApiRequest = ZSaveMessageTemplateEntryInput;
export type SaveMessageTemplateApiRequest = z.infer<typeof ZSaveMessageTemplateApiRequest>;
