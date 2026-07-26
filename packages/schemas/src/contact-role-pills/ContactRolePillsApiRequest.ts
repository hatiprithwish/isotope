import type { z } from "zod";
import { ZContactRolePillsInput } from "./ContactRolePillsCommon";

export const ZSaveContactRolePillsApiRequest = ZContactRolePillsInput;
export type SaveContactRolePillsApiRequest = z.infer<typeof ZSaveContactRolePillsApiRequest>;
