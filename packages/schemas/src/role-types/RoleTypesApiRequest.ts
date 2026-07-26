import type { z } from "zod";
import { ZRoleTypesInput } from "./RoleTypesCommon";

export const ZSaveRoleTypesApiRequest = ZRoleTypesInput;
export type SaveRoleTypesApiRequest = z.infer<typeof ZSaveRoleTypesApiRequest>;
