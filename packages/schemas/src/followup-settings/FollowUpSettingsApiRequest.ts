import type { z } from "zod";
import { ZFollowUpSettingsInput } from "./FollowUpSettingsCommon";

export const ZSaveFollowUpSettingsApiRequest = ZFollowUpSettingsInput;
export type SaveFollowUpSettingsApiRequest = z.infer<typeof ZSaveFollowUpSettingsApiRequest>;
