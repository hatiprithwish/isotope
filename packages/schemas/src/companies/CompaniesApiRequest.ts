import { z } from "zod";
import { ZCompanyBase } from "./CompaniesCommon";

export const ZGetCompaniesApiRequest = z.object({
  search: z.string().nullable().optional(),
});
export type GetCompaniesApiRequest = z.infer<typeof ZGetCompaniesApiRequest>;

export const ZCreateCompanyApiRequest = z.object({
  company: ZCompanyBase,
});
export type CreateCompanyApiRequest = z.infer<typeof ZCreateCompanyApiRequest>;

export const ZUpdateCompanyApiRequest = z.object({
  company: ZCompanyBase.partial(),
});
export type UpdateCompanyApiRequest = z.infer<typeof ZUpdateCompanyApiRequest>;

export const ZBulkDeleteCompaniesApiRequest = z.object({
  ids: z.array(z.number().int().positive()).min(1),
});
export type BulkDeleteCompaniesApiRequest = z.infer<typeof ZBulkDeleteCompaniesApiRequest>;
