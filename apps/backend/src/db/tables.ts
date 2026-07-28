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
    name: t.text().notNull(),
    designation: t.text(),
    email: t.text(),
    linkedinUrl: t.text("linkedin_url"),
    linkedinConnected: t.integer("linkedin_connected", { mode: "boolean" }),
    sequencePosition: t.integer("sequence_position"),
    lastTouchAt: t.text("last_touch_at"),
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
    channel: t.text().$type<Schemas.ContactHistoryChannelEnum>().notNull(),
    subject: t.text(),
    body: t.text().notNull(),
    sequencePosition: t.integer("sequence_position"),
    abVariable: t.text("ab_variable"),
    abVariant: t.text("ab_variant"),
    sentAt: t.text("sent_at").notNull(),
    createdAt: t.text("created_at").notNull(),
    deletedAt: t.text("deleted_at"),
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
    salary: t.text(),
    source: t.text(),
    type: t.integer().$type<Schemas.JobTypeIntEnum>().notNull(),
    description: t.text(),
    skills: t.text(),
    roleType: t.text("role_type"),
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

export const tasks = table(
  "tasks",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    createdBy: t.text("created_by").notNull(),
    contactId: t.int("contact_id"),
    // Every task row is a follow-up today (see TasksRepo — no standalone-task creation path exists),
    // so this is required; email and linkedin run independent sequences for the same contact.
    channel: t.text().$type<Schemas.ContactHistoryChannelEnum>().notNull(),
    title: t.text().notNull(),
    dueAt: t.text("due_at").notNull(),
    status: t.integer().$type<Schemas.TaskStatusIntEnum>().notNull(),
    stepNumber: t.integer("step_number"),
    pausedAt: t.text("paused_at"),
    note: t.text(),
    completedAt: t.text("completed_at"),
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at"),
  },
  (table) => [
    // Composite: every hot read filters created_by AND due_at (day/calendar/past); the createdBy prefix still serves createdBy-only predicates.
    t.index("IDX_tasks_created_by_due_at").on(table.createdBy, table.dueAt),
    // Widened to (contact_id, channel) — the "one active follow-up per contact" lookups now filter
    // on both, since email and linkedin each have their own active Pending/Paused row.
    t.index("IDX_tasks_contact_id_channel").on(table.contactId, table.channel),
    // Serves the cron sweep's (status, due_at) predicate, which has no created_by filter.
    t.index("IDX_tasks_due_at").on(table.dueAt),
  ],
);

export const followUpSettings = table(
  "followup_settings",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    createdBy: t.text("created_by").notNull(),
    stepOffsetDays: t.text("step_offset_days").notNull().default("[]"),
    version: t.integer().notNull().default(1),
    isCustomized: t.integer("is_customized", { mode: "boolean" }).notNull().default(false),
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at"),
  },
  (table) => [t.index("idx_followup_settings_user").on(table.createdBy, table.version)],
);

export const contactRolePills = table(
  "contact_role_pills",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    createdBy: t.text("created_by").notNull(),
    pillLabels: t.text("pill_labels").notNull().default("[]"),
    version: t.integer().notNull().default(1),
    isCustomized: t.integer("is_customized", { mode: "boolean" }).notNull().default(false),
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at"),
  },
  (table) => [t.index("idx_contact_role_pills_user").on(table.createdBy, table.version)],
);

export const roleTypes = table(
  "role_types",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    createdBy: t.text("created_by").notNull(),
    labels: t.text().notNull().default("[]"),
    defaultLabel: t.text("default_label"),
    isCustomized: t.integer("is_customized", { mode: "boolean" }).notNull().default(false),
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at"),
  },
  (table) => [t.uniqueIndex("UNQ_role_types_created_by").on(table.createdBy)],
);

// One row per (user, step, variant). variantLabel is only ever non-null at step 0 (one row
// per configured role type label); step >= 1 and step 0's "default" slot both use NULL.
// SQLite treats NULL as distinct per-row in a UNIQUE index, so a plain unique index on
// (created_by, step, variant_label) would NOT block duplicate NULL-variant rows for the
// same (created_by, step) — enforced instead at the DAL/upsert level.
export const messageTemplates = table(
  "message_templates",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    createdBy: t.text("created_by").notNull(),
    step: t.integer().notNull(),
    variantLabel: t.text("variant_label"),
    body: t.text().notNull().default(""),
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at"),
  },
  (table) => [
    t.index("IDX_message_templates_user_step").on(table.createdBy, table.step),
    t
      .uniqueIndex("UNQ_message_templates_user_step_variant")
      .on(table.createdBy, table.step, table.variantLabel),
  ],
);

// Single-row global table — id is always 1
export const browserRunBudget = table("browser_run_budget", {
  id: t.int().primaryKey({ autoIncrement: true }),
  usedSeconds: t.real("used_seconds").notNull().default(0),
  resetAt: t.text("reset_at").notNull(),
  updatedAt: t.text("updated_at"),
});
