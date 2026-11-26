import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/db";
import { skills, subSkills, units } from "@/db/schema";
import { LEADERBOARD_CACHE_TAG } from "@/features/skills/services/leaderboard.service";
import {
  countMarkdownImages,
  MAX_IMAGES_PER_DOCUMENT,
} from "@/features/editor/lib/image-limit";
import { getPublicSkillCacheTag } from "@/features/skills/services/public-skill.service";
import { slugify } from "@/features/skills/utils/slugify";
import { getAuth } from "@/lib/auth";

const updateSkillSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  summary: z.string().trim().max(280).nullable().optional(),
  bannerImage: z.string().trim().url().max(500).nullable().optional(),
  visibility: z.enum(["public", "private"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  overview: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const [skill] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.ownerId, session.user.id), eq(skills.slug, slug)))
    .limit(1);

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
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
      .where(eq(subSkills.skillId, skill.id))
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
        isPublished: units.isPublished,
        estimatedMinutes: units.estimatedMinutes,
      })
      .from(units)
      .where(eq(units.skillId, skill.id))
      .orderBy(asc(units.sortOrder)),
  ]);

  return NextResponse.json({
    skill,
    subSkills: subSkillRows,
    units: unitRows,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSkillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (
    parsed.data.overview &&
    countMarkdownImages(parsed.data.overview) > MAX_IMAGES_PER_DOCUMENT
  ) {
    return NextResponse.json(
      {
        error: `Overview cannot exceed ${MAX_IMAGES_PER_DOCUMENT} embedded images.`,
      },
      { status: 400 }
    );
  }

  const nextSlug =
    parsed.data.title !== undefined
      ? slugify(parsed.data.title) || slug
      : undefined;

  const db = await getDb();
  const [updated] = await db
    .update(skills)
    .set({
      ...parsed.data,
      ...(nextSlug ? { slug: nextSlug } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(skills.ownerId, session.user.id), eq(skills.slug, slug)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  revalidateTag(LEADERBOARD_CACHE_TAG, "max");
  revalidateTag(getPublicSkillCacheTag(slug), "max");
  if (updated.slug !== slug) {
    revalidateTag(getPublicSkillCacheTag(updated.slug), "max");
  }

  return NextResponse.json({ skill: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const [deleted] = await db
    .delete(skills)
    .where(and(eq(skills.ownerId, session.user.id), eq(skills.slug, slug)))
    .returning({ id: skills.id });

  if (!deleted) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  revalidateTag(LEADERBOARD_CACHE_TAG, "max");
  revalidateTag(getPublicSkillCacheTag(slug), "max");

  return NextResponse.json({ deleted: true });
}
