import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const userProfiles = sqliteTable("user_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  website: text("website"),
  bannerImage: text("banner_image"),
  role: text("role"),
  bio: text("bio"),
  onboardedAt: integer("onboarded_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Repository-level entity ("skill").
 * Large Markdown `overview` (README.md) is placed last to keep listing scans out of SQLite overflow pages.
 */
export const skills = sqliteTable(
  "skills",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    bannerImage: text("banner_image"),
    visibility: text("visibility", { enum: ["public", "private"] })
      .notNull()
      .default("public"),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("draft"),
    subSkillsCount: integer("sub_skills_count").notNull().default(0),
    unitsCount: integer("units_count").notNull().default(0),
    starsCount: integer("stars_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    overview: text("overview"),
  },
  (table) => [
    uniqueIndex("skills_owner_slug_uidx").on(table.ownerId, table.slug),
    index("skills_owner_updated_idx").on(table.ownerId, table.updatedAt),
    index("skills_public_stars_idx").on(
      table.visibility,
      table.status,
      table.starsCount
    ),
    index("skills_public_updated_idx").on(
      table.visibility,
      table.status,
      table.updatedAt
    ),
  ]
);

/**
 * Folder-level entity ("sub-skill") inside a skill repository.
 */
export const subSkills = sqliteTable(
  "sub_skills",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    unitsCount: integer("units_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("sub_skills_skill_slug_uidx").on(table.skillId, table.slug),
    index("sub_skills_skill_order_idx").on(table.skillId, table.sortOrder),
  ]
);

/**
 * File/page-level entity ("unit") inside a sub-skill folder.
 * Denormalizes `skillId` for single-index sidebar tree queries in D1 and places Markdown `content` last.
 */
export const units = sqliteTable(
  "units",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    subSkillId: integer("sub_skill_id")
      .notNull()
      .references(() => subSkills.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    unitType: text("unit_type", { enum: ["page", "reference", "guide"] })
      .notNull()
      .default("page"),
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(true),
    estimatedMinutes: integer("estimated_minutes"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    content: text("content").notNull().default(""),
  },
  (table) => [
    uniqueIndex("units_sub_skill_slug_uidx").on(table.subSkillId, table.slug),
    index("units_skill_sub_order_idx").on(
      table.skillId,
      table.subSkillId,
      table.sortOrder
    ),
  ]
);

export const skillsRelations = relations(skills, ({ one, many }) => ({
  owner: one(user, {
    fields: [skills.ownerId],
    references: [user.id],
  }),
  subSkills: many(subSkills),
  units: many(units),
}));

export const subSkillsRelations = relations(subSkills, ({ one, many }) => ({
  skill: one(skills, {
    fields: [subSkills.skillId],
    references: [skills.id],
  }),
  units: many(units),
}));

export const unitsRelations = relations(units, ({ one }) => ({
  skill: one(skills, {
    fields: [units.skillId],
    references: [skills.id],
  }),
  subSkill: one(subSkills, {
    fields: [units.subSkillId],
    references: [subSkills.id],
  }),
}));
