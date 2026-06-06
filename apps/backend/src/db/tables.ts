import { sqliteTable as table } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";
import type * as Schemas from "@app/schemas";

// DEV_NOTE: SQLite does not have bigInt support

export const users = table(
  "users",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    clerkId: t.text("clerk_id").notNull(),
    email: t.text().notNull(),
    role: t.text().$type<Schemas.UserRoleEnum>().notNull(),
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at").notNull(),
  },
  (table) => [
    t.uniqueIndex("UNQ_users_clerk_id").on(table.clerkId),
    t.uniqueIndex("UNQ_users_email").on(table.email),
  ],
);

export const companies = table(
  "companies",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    createdBy: t.text("created_by").notNull(),
    name: t.text().notNull(),
    website: t.text(),
    industry: t.text(),
    size: t.text(),
    location: t.text(),
    isSalaryMatch: t.integer("is_salary_match", { mode: "boolean" }),
    isLocationMatch: t.integer("is_location_match", { mode: "boolean" }),
    isEthicsCompliant: t.integer("is_ethics_compliant", { mode: "boolean" }),
    ethicsNotes: t.text("ethics_notes"),
    weightedScore: t.integer("weighted_score"),
    fitBand: t.integer("fit_band").$type<Schemas.CompanyFitBandIntEnum>(),
    aiSummary: t.text("ai_summary"),
    userContext: t.text("user_context"),
    notes: t.text(),
    status: t.integer().$type<Schemas.CompanyStatusIntEnum>().notNull(),
    failedAt: t.text("failed_at"),
    retryCount: t.integer("retry_count"),
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at"),
  },
  (table) => [t.index("IDX_companies_created_by").on(table.createdBy)],
);

export const contacts = table(
  "contacts",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    createdBy: t.text("created_by").notNull(),
    companyId: t.int("company_id").notNull(),
    jobId: t.int("job_id"),
    name: t.text().notNull(),
    designation: t.text(),
    email: t.text(),
    linkedinUrl: t.text("linkedin_url"),
    linkedinConnected: t.integer("linkedin_connected", { mode: "boolean" }),
    sequencePosition: t.integer("sequence_position"),
    lastTouchAt: t.text("last_touch_at"),
    nextTouchDueAt: t.text("next_touch_due_at"),
    deadAt: t.text("dead_at"),
    reEngageAt: t.text("re_engage_at"),
    abVariable: t.text("ab_variable"),
    abVariant: t.text("ab_variant"),
    abReplied: t.integer("ab_replied", { mode: "boolean" }),
    status: t.integer().$type<Schemas.ContactStatusIntEnum>().notNull(),
    draftBody: t.text("draft_body"),
    draftSubject: t.text("draft_subject"),
    personalizationNotes: t.text("personalization_notes"),
    manualPersonalizationNotes: t.text("manual_personalization_notes"),
    reengagementRecommendation: t.text("reengagement_recommendation"),
    source: t.integer().$type<Schemas.ContactSourceIntEnum>(),
    notes: t.text(),
    failedAt: t.text("failed_at"),
    retryCount: t.integer("retry_count"),
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at"),
  },
  (table) => [
    t.index("IDX_contacts_created_by").on(table.createdBy),
    t.index("IDX_contacts_company_id").on(table.companyId),
  ],
);

export const contactHistory = table(
  "contact_history",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    createdBy: t.text("created_by").notNull(),
    contactId: t.int("contact_id").notNull(),
    type: t.text().notNull(),
    channel: t.text().notNull(),
    subject: t.text(),
    body: t.text().notNull(),
    sequencePosition: t.integer("sequence_position"),
    abVariable: t.text("ab_variable"),
    abVariant: t.text("ab_variant"),
    sentAt: t.text("sent_at").notNull(),
    createdAt: t.text("created_at").notNull(),
  },
  (table) => [
    t.index("IDX_contact_history_contact_id").on(table.contactId),
    t.index("IDX_contact_history_created_by").on(table.createdBy),
  ],
);

export const jobs = table(
  "jobs",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    status: t.integer().$type<Schemas.JobStatusIntEnum>().notNull(),
    title: t.text().notNull(),
    companyId: t.int("company_id"),
    url: t.text(),
    location: t.text(),
    salary: t.text(),
    source: t.text(),
    type: t.integer().$type<Schemas.JobTypeIntEnum>().notNull(),
    description: t.text(),
    skills: t.text(),
    createdBy: t.text("created_by").notNull(),
    matchScore: t.real("match_score"),
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at"),
  },
  (table) => [
    t.uniqueIndex("UNQ_jobs_url_created_by").on(table.url, table.createdBy),
    t.index("IDX_jobs_created_by").on(table.createdBy),
    t.index("IDX_jobs_company_id").on(table.companyId),
  ],
);

export const jobSearchFrameworks = table(
  "job_search_frameworks",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    createdBy: t.text("created_by").notNull(),
    targetRoles: t.text("target_roles").notNull().default("[]"),
    isRemote: t.integer("is_remote", { mode: "boolean" }).notNull().default(false),
    requiredSkills: t.text("required_skills").notNull().default("[]"),
    skills: t.text().notNull().default("[]"),
    minSalaryLpa: t.real("min_salary_lpa").notNull().default(10),
    minExp: t.real("min_exp").notNull().default(2),
    maxExp: t.real("max_exp").notNull().default(5),
    preferredLocations: t.text("preferred_locations").notNull().default("[]"),
    recencyWindow: t.integer("recency_window").notNull().default(7),
    version: t.integer().notNull().default(1),
    isCustomized: t.integer("is_customized", { mode: "boolean" }).notNull().default(false),
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at"),
  },
  (table) => [t.index("idx_job_fw_user").on(table.createdBy, table.version)],
);

export const notes = table(
  "notes",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    createdBy: t.text("created_by").notNull(),
    title: t.text().notNull(),
    body: t.text(),
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at"),
  },
  (table) => [t.index("IDX_notes_created_by").on(table.createdBy)],
);
