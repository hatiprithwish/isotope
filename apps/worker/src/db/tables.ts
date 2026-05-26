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
    createdAt: t.text("created_at").notNull(),
    updatedAt: t.text("updated_at"),
  },
  (table) => [t.index("IDX_companies_created_by").on(table.createdBy)],
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
