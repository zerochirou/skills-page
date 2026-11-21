import { cache } from "react";
import { connection } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { skills, subSkills, units, user, userProfiles } from "@/db/schema";

export interface PublicSkillDetail {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  bannerImage: string | null;
  visibility: "public" | "private";
  status: "draft" | "published" | "archived";
  subSkillsCount: number;
  unitsCount: number;
  starsCount: number;
  overview: string | null;
  createdAt: string;
  updatedAt: string;
  ownerName: string;
  ownerImage: string | null;
  ownerUsername: string | null;
}

export interface PublicSubSkill {
  id: number;
  skillId: number;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  unitsCount: number;
}

export interface PublicUnitSummary {
  id: number;
  skillId: number;
  subSkillId: number;
  slug: string;
  title: string;
  unitType: "page" | "reference" | "guide";
  sortOrder: number;
  estimatedMinutes: number | null;
}

export interface PublicSkillPayload {
  skill: PublicSkillDetail;
  subSkills: PublicSubSkill[];
  units: PublicUnitSummary[];
}

export function getPublicSkillCacheTag(slug: string): string {
  return `skill-${slug}`;
}

const loadPublicSkillByOwnerAndSlug = cache(
  async (
    ownerUsername: string,
    slug: string
  ): Promise<PublicSkillPayload | null> => {
    await connection();

    const db = await getDb();

    const [row] = await db
      .select({
        id: skills.id,
        slug: skills.slug,
        title: skills.title,
        summary: skills.summary,
        bannerImage: skills.bannerImage,
        visibility: skills.visibility,
        status: skills.status,
        subSkillsCount: skills.subSkillsCount,
        unitsCount: skills.unitsCount,
        starsCount: skills.starsCount,
        overview: skills.overview,
        createdAt: skills.createdAt,
        updatedAt: skills.updatedAt,
        ownerName: user.name,
        ownerImage: user.image,
        ownerUsername: userProfiles.username,
      })
      .from(skills)
      .leftJoin(user, eq(skills.ownerId, user.id))
      .innerJoin(userProfiles, eq(skills.ownerId, userProfiles.userId))
      .where(
        and(
          eq(userProfiles.username, ownerUsername),
          eq(skills.slug, slug),
          eq(skills.visibility, "public"),
          eq(skills.status, "published")
        )
      )
      .limit(1);

  if (!row) {
    return null;
  }

  const [subSkillRows, unitRows] = await Promise.all([
    db
      .select({
        id: subSkills.id,
        skillId: subSkills.skillId,
        slug: subSkills.slug,
        title: subSkills.title,
        description: subSkills.description,
        sortOrder: subSkills.sortOrder,
        unitsCount: subSkills.unitsCount,
      })
      .from(subSkills)
      .where(eq(subSkills.skillId, row.id))
      .orderBy(asc(subSkills.sortOrder)),
    db
      .select({
        id: units.id,
        skillId: units.skillId,
        subSkillId: units.subSkillId,
        slug: units.slug,
        title: units.title,
        unitType: units.unitType,
        sortOrder: units.sortOrder,
        estimatedMinutes: units.estimatedMinutes,
      })
      .from(units)
      .where(and(eq(units.skillId, row.id), eq(units.isPublished, true)))
      .orderBy(asc(units.sortOrder)),
  ]);

  return {
    skill: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      bannerImage: row.bannerImage,
      visibility: row.visibility,
      status: row.status,
      subSkillsCount: row.subSkillsCount,
      unitsCount: row.unitsCount,
      starsCount: row.starsCount,
      overview: row.overview,
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : new Date(row.createdAt).toISOString(),
      updatedAt:
        row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : new Date(row.updatedAt).toISOString(),
      ownerName: row.ownerName ?? "Anonymous",
      ownerImage: row.ownerImage ?? null,
      ownerUsername: row.ownerUsername ?? null,
    },
    subSkills: subSkillRows,
    units: unitRows,
  };
  }
);

export async function getPublicSkillByOwnerAndSlug(
  ownerUsername: string,
  slug: string
): Promise<PublicSkillPayload | null> {
  return loadPublicSkillByOwnerAndSlug(ownerUsername, slug);
}
