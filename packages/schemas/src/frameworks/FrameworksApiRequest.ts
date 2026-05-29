import { z } from "zod";
import { ZCompanyFrameworkFormInputs } from "./FrameworksCommon";

export const ZGenerateFrameworkApiRequest = z.object({
  formInputs: ZCompanyFrameworkFormInputs,
});
export type GenerateFrameworkApiRequest = z.infer<typeof ZGenerateFrameworkApiRequest>;

export const ZSaveFrameworkApiRequest = z.object({
  content: z.string().min(1),
  formInputs: ZCompanyFrameworkFormInputs.optional(),
  isCustomized: z.boolean().optional(),
});
export type SaveFrameworkApiRequest = z.infer<typeof ZSaveFrameworkApiRequest>;
