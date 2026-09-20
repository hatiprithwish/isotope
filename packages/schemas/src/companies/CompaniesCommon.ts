import z from "zod";

// Integer enums — stored in DB, sent in API requests
export enum CompanyStatusIntEnum {
  WaitingHuman = 1,
  Accepted = 2,
  ContactsAdded = 3,
  RejectedHuman = 4,
  Interviewed = 5,
  Offer = 6,
}
export const ZCompanyStatusIntEnum = z.enum(CompanyStatusIntEnum);

// Label enums — human-readable, included in API responses
export enum CompanyStatusLabelEnum {
  WaitingHuman = "Waiting for Human",
  Accepted = "Accepted",
  ContactsAdded = "Contacts Added",
  RejectedHuman = "Rejected by Human",
  Interviewed = "Interviewed",
  Offer = "Offer",
}
export const ZCompanyStatusLabelEnum = z.enum(CompanyStatusLabelEnum);

// Maps — int → label (used in Repo layer)
export const companyStatusIntToLabel: Record<CompanyStatusIntEnum, CompanyStatusLabelEnum> = {
  [CompanyStatusIntEnum.WaitingHuman]: CompanyStatusLabelEnum.WaitingHuman,
  [CompanyStatusIntEnum.Accepted]: CompanyStatusLabelEnum.Accepted,
  [CompanyStatusIntEnum.ContactsAdded]: CompanyStatusLabelEnum.ContactsAdded,
  [CompanyStatusIntEnum.RejectedHuman]: CompanyStatusLabelEnum.RejectedHuman,
  [CompanyStatusIntEnum.Interviewed]: CompanyStatusLabelEnum.Interviewed,
  [CompanyStatusIntEnum.Offer]: CompanyStatusLabelEnum.Offer,
};

export const ZCompanyBase = z.object({
  name: z.string(),
  status: ZCompanyStatusIntEnum,
  website: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type CompanyBase = z.infer<typeof ZCompanyBase>;

export const ZCompany = ZCompanyBase.extend({
  id: z.number(),
  createdBy: z.string(),
  statusLabel: ZCompanyStatusLabelEnum,
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});
export type Company = z.infer<typeof ZCompany>;
