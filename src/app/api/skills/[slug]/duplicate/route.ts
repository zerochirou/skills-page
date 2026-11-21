import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { and, asc, eq, like } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { skills, subSkills, units } from "@/db/schema";
import { LEADERBOARD_CACHE_TAG } from "@/features/skills/services/leaderboard.service";
import { getAuth } from "@/lib/auth";

export async function POST(
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
  const [sourceSkill] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.ownerId, session.user.id), eq(skills.slug, slug)))
    .limit(1);

  if (!sourceSkill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const baseCopySlug = `${sourceSkill.slug}-copy`;
  const existingCopies = await db
    .select({ slug: skills.slug })
    .from(skills)
    .where(
      and(
        eq(skills.ownerId, session.user.id),
        like(skills.slug, `${baseCopySlug}%`)
      )
    );

  const takenSlugs = new Set(existingCopies.map((row) => row.slug));
  let nextSlug = baseCopySlug;
  let suffix = 2;
  while (takenSlugs.has(nextSlug)) {
    nextSlug = `${baseCopySlug}-${suffix}`;
    suffix += 1;
  }

  const [sourceSubSkills, sourceUnits] = await Promise.all([
    db
      .select()
      .from(subSkills)
      .where(eq(subSkills.skillId, sourceSkill.id))
      .orderBy(asc(subSkills.sortOrder)),
    db
      .select()
      .from(units)
      .where(eq(units.skillId, sourceSkill.id))
      .orderBy(asc(units.sortOrder)),
  ]);

  const [createdSkill] = await db
    .insert(skills)
    .values({
      ownerId: session.user.id,
      slug: nextSlug,
      title: `${sourceSkill.title} (Copy)`,
      summary: sourceSkill.summary,
      bannerImage: sourceSkill.bannerImage,
      visibility: sourceSkill.visibility,
      status: "draft",
      subSkillsCount: sourceSubSkills.length,
      unitsCount: sourceUnits.length,
      overview: sourceSkill.overview,
    })
    .returning({
      id: skills.id,
      slug: skills.slug,
      title: skills.title,
    });

  const unitsBySubSkill = new Map<number, typeof sourceUnits>();
  for (const unit of sourceUnits) {
    const list = unitsBySubSkill.get(unit.subSkillId) ?? [];
    list.push(unit);
    unitsBySubSkill.set(unit.subSkillId, list);
  }

  for (const sub of sourceSubSkills) {
    const subUnits = unitsBySubSkill.get(sub.id) ?? [];
    const [createdSub] = await db
      .insert(subSkills)
      .values({
        skillId: createdSkill.id,
        slug: sub.slug,
        title: sub.title,
        description: sub.description,
        sortOrder: sub.sortOrder,
        unitsCount: subUnits.length,
      })
      .returning({ id: subSkills.id });

    if (subUnits.length > 0) {
      await db.insert(units).values(
        subUnits.map((unit) => ({
          skillId: createdSkill.id,
          subSkillId: createdSub.id,
          slug: unit.slug,
          title: unit.title,
          unitType: unit.unitType,
          sortOrder: unit.sortOrder,
          isPublished: unit.isPublished,
          estimatedMinutes: unit.estimatedMinutes,
          content: unit.content,
        }))
      );
    }
  }

  if (sourceSkill.visibility === "public") {
    revalidateTag(LEADERBOARD_CACHE_TAG, "max");
  }

  return NextResponse.json({ skill: createdSkill }, { status: 201 });
}
