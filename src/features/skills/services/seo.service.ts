import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { skills, subSkills, units, user, userProfiles } from "@/db/schema";

export interface SeoSkillEntry {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  overview: string | null;
  subSkillsCount: number;
  unitsCount: number;
  updatedAt: Date;
  ownerUsername: string;
  ownerName: string;
}

export interface SeoSubSkillEntry {
  id: number;
  skillId: number;
  title: string;
  description: string | null;
  updatedAt: Date;
}

export interface SeoUnitEntry {
  id: number;
  skillId: number;
  subSkillId: number;
  title: string;
  updatedAt: Date;
}

export interface SeoProfileEntry {
  username: string;
  displayName: string;
  onboardedAt: Date;
}

export interface SeoIndexSnapshot {
  skills: SeoSkillEntry[];
  subSkills: SeoSubSkillEntry[];
  units: SeoUnitEntry[];
  profiles: SeoProfileEntry[];
}

export async function getSeoIndexSnapshot(options?: {
  includeOverview?: boolean;
  limit?: number;
}): Promise<SeoIndexSnapshot> {
  await connection();

  try {
    const db = await getDb();
    const skillLimit = options?.limit ?? 500;

    const skillRows = await db
      .select({
        id: skills.id,
        slug: skills.slug,
        title: skills.title,
        summary: skills.summary,
        ...(options?.includeOverview ? { overview: skills.overview } : {}),
        subSkillsCount: skills.subSkillsCount,
        unitsCount: skills.unitsCount,
        updatedAt: skills.updatedAt,
        ownerUsername: userProfiles.username,
        ownerName: user.name,
      })
      .from(skills)
      .innerJoin(userProfiles, eq(skills.ownerId, userProfiles.userId))
      .leftJoin(user, eq(skills.ownerId, user.id))
      .where(and(eq(skills.visibility, "public"), eq(skills.status, "published")))
      .orderBy(desc(skills.updatedAt))
      .limit(skillLimit);

    const skillIds = skillRows.map((row) => row.id);

    const [subSkillRows, unitRows, profileRows] = await Promise.all([
      skillIds.length > 0
        ? db
            .select({
              id: subSkills.id,
              skillId: subSkills.skillId,
              title: subSkills.title,
              description: subSkills.description,
              updatedAt: subSkills.updatedAt,
            })
            .from(subSkills)
            .where(inArray(subSkills.skillId, skillIds))
            .orderBy(asc(subSkills.sortOrder))
        : Promise.resolve([]),
      skillIds.length > 0
        ? db
            .select({
              id: units.id,
              skillId: units.skillId,
              subSkillId: units.subSkillId,
              title: units.title,
              updatedAt: units.updatedAt,
            })
            .from(units)
            .where(and(inArray(units.skillId, skillIds), eq(units.isPublished, true)))
            .orderBy(asc(units.sortOrder))
        : Promise.resolve([]),
      db
        .select({
          username: userProfiles.username,
          displayName: userProfiles.displayName,
          onboardedAt: userProfiles.onboardedAt,
        })
        .from(userProfiles)
        .limit(500),
    ]);

    return {
      skills: skillRows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        overview:
          "overview" in row && typeof row.overview === "string"
            ? row.overview
            : null,
        subSkillsCount: row.subSkillsCount,
        unitsCount: row.unitsCount,
        updatedAt:
          row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
        ownerUsername: row.ownerUsername,
        ownerName: row.ownerName ?? row.ownerUsername,
      })),
      subSkills: subSkillRows.map((row) => ({
        ...row,
        updatedAt:
          row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
      })),
      units: unitRows.map((row) => ({
        ...row,
        updatedAt:
          row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
      })),
      profiles: profileRows.map((row) => ({
        ...row,
        onboardedAt:
          row.onboardedAt instanceof Date
            ? row.onboardedAt
            : new Date(row.onboardedAt),
      })),
    };
  } catch {
    return {
      skills: [],
      subSkills: [],
      units: [],
      profiles: [],
    };
  }
}

export async function getPublicSkillFullMarkdownData(
  ownerUsername: string,
  slug: string
) {
  await connection();
  const db = await getDb();

  const [skillRow] = await db
    .select({
      id: skills.id,
      slug: skills.slug,
      title: skills.title,
      summary: skills.summary,
      overview: skills.overview,
      updatedAt: skills.updatedAt,
      ownerName: user.name,
      ownerUsername: userProfiles.username,
    })
    .from(skills)
    .innerJoin(userProfiles, eq(skills.ownerId, userProfiles.userId))
    .leftJoin(user, eq(skills.ownerId, user.id))
    .where(
      and(
        eq(userProfiles.username, ownerUsername),
        eq(skills.slug, slug),
        eq(skills.visibility, "public"),
        eq(skills.status, "published")
      )
    )
    .limit(1);

  if (!skillRow) return null;

  const [subSkillRows, unitRows] = await Promise.all([
    db
      .select({
        id: subSkills.id,
        title: subSkills.title,
        description: subSkills.description,
        sortOrder: subSkills.sortOrder,
      })
      .from(subSkills)
      .where(eq(subSkills.skillId, skillRow.id))
      .orderBy(asc(subSkills.sortOrder)),
    db
      .select({
        id: units.id,
        subSkillId: units.subSkillId,
        title: units.title,
        content: units.content,
        estimatedMinutes: units.estimatedMinutes,
        sortOrder: units.sortOrder,
      })
      .from(units)
      .where(and(eq(units.skillId, skillRow.id), eq(units.isPublished, true)))
      .orderBy(asc(units.sortOrder)),
  ]);

  return {
    skill: {
      ...skillRow,
      ownerName: skillRow.ownerName ?? ownerUsername,
      updatedAt:
        skillRow.updatedAt instanceof Date
          ? skillRow.updatedAt
          : new Date(skillRow.updatedAt),
    },
    subSkills: subSkillRows,
    units: unitRows,
  };
}
