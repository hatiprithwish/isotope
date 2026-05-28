import { z } from "zod";
import { ZCompanyBase } from "./CompaniesCommon";

export const ZCreateCompanyApiRequest = z.object({
  company: ZCompanyBase,
});
export type CreateCompanyApiRequest = z.infer<typeof ZCreateCompanyApiRequest>;

export const ZUpdateCompanyApiRequest = z.object({
  company: ZCompanyBase.partial(),
});
export type UpdateCompanyApiRequest = z.infer<typeof ZUpdateCompanyApiRequest>;
