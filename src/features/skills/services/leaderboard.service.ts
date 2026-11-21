import { connection } from "next/server";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { skills, user, userProfiles } from "@/db/schema";

export const LEADERBOARD_CACHE_TAG = "skills-leaderboard";
const DEFAULT_LEADERBOARD_LIMIT = 20;
const MAX_LEADERBOARD_LIMIT = 50;

export interface LeaderboardSkill {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  status: "draft" | "published" | "archived";
  subSkillsCount: number;
  unitsCount: number;
  starsCount: number;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  ownerName: string;
  ownerImage: string | null;
  ownerUsername: string | null;
}

export interface LeaderboardResult {
  skills: LeaderboardSkill[];
  totalCount: number;
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Queries public non-archived skills from D1 without reading the large `overview` column.
 */
export async function queryPublicSkills(options?: {
  query?: string;
  username?: string;
  sort?: "stars" | "newest" | "oldest";
  page?: number;
  limit?: number;
}): Promise<LeaderboardResult> {
  const db = await getDb();
  const trimmedQuery = options?.query?.trim().slice(0, 100) ?? "";
  const trimmedUsername = options?.username?.trim().slice(0, 60) ?? "";
  const page = Math.max(options?.page ?? 1, 1);
  const limit = Math.min(
    Math.max(options?.limit ?? DEFAULT_LEADERBOARD_LIMIT, 1),
    MAX_LEADERBOARD_LIMIT
  );
  const offset = (page - 1) * limit;

  const baseVisibilityCondition = and(
    eq(skills.visibility, "public"),
    eq(skills.status, "published")
  );

  const usernameCondition = trimmedUsername
    ? (() => {
        const pattern = `%${escapeLikePattern(trimmedUsername)}%`;
        return or(
          sql`${userProfiles.username} LIKE ${pattern} ESCAPE '\\'`,
          sql`${user.name} LIKE ${pattern} ESCAPE '\\'`
        );
      })()
    : undefined;

  const searchCondition = trimmedQuery
    ? (() => {
        const pattern = `%${escapeLikePattern(trimmedQuery)}%`;
        return or(
          sql`${skills.title} LIKE ${pattern} ESCAPE '\\'`,
          sql`${skills.slug} LIKE ${pattern} ESCAPE '\\'`,
          sql`${skills.summary} LIKE ${pattern} ESCAPE '\\'`,
          sql`${user.name} LIKE ${pattern} ESCAPE '\\'`,
          sql`${userProfiles.username} LIKE ${pattern} ESCAPE '\\'`
        );
      })()
    : undefined;

  const conditions = [baseVisibilityCondition, usernameCondition, searchCondition].filter(
    Boolean
  );
  const whereClause = conditions.length > 1 ? and(...conditions) : baseVisibilityCondition;

  const orderByClauses =
    options?.sort === "newest"
      ? [desc(skills.createdAt)]
      : options?.sort === "oldest"
        ? [asc(skills.createdAt)]
        : [desc(skills.starsCount), desc(skills.updatedAt)];

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: skills.id,
        slug: skills.slug,
        title: skills.title,
        summary: skills.summary,
        status: skills.status,
        subSkillsCount: skills.subSkillsCount,
        unitsCount: skills.unitsCount,
        starsCount: skills.starsCount,
        createdAt: skills.createdAt,
        updatedAt: skills.updatedAt,
        ownerId: skills.ownerId,
        ownerName: user.name,
        ownerImage: user.image,
        ownerUsername: userProfiles.username,
      })
      .from(skills)
      .leftJoin(user, eq(skills.ownerId, user.id))
      .leftJoin(userProfiles, eq(skills.ownerId, userProfiles.userId))
      .where(whereClause)
      .orderBy(...orderByClauses)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(skills)
      .leftJoin(user, eq(skills.ownerId, user.id))
      .leftJoin(userProfiles, eq(skills.ownerId, userProfiles.userId))
      .where(whereClause),
  ]);

  return {
    skills: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      status: row.status,
      subSkillsCount: row.subSkillsCount,
      unitsCount: row.unitsCount,
      starsCount: row.starsCount,
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : new Date(row.createdAt).toISOString(),
      updatedAt:
        row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : new Date(row.updatedAt).toISOString(),
      ownerId: row.ownerId,
      ownerName: row.ownerName ?? "Anonymous",
      ownerImage: row.ownerImage ?? null,
      ownerUsername: row.ownerUsername ?? null,
    })),
    totalCount: Number(countRows[0]?.count ?? 0),
  };
}

/**
 * Cached initial leaderboard payload for the home page.
 * Revalidated on-demand via `revalidateTag(LEADERBOARD_CACHE_TAG, "max")` on skill mutations.
 */
export async function getCachedLeaderboardSkills(): Promise<LeaderboardResult> {
  await connection();
  return queryPublicSkills({ limit: 8 });
}
