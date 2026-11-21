import { NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { skills, subSkills, units } from "@/db/schema";
import { getAuth } from "@/lib/auth";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string; subSkillId: string }> }
) {
  const { slug, subSkillId } = await context.params;
  const parsedId = Number(subSkillId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: "Invalid sub-skill ID" }, { status: 400 });
  }

  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const [skill] = await db
    .select({ id: skills.id, subSkillsCount: skills.subSkillsCount })
    .from(skills)
    .where(and(eq(skills.ownerId, session.user.id), eq(skills.slug, slug)))
    .limit(1);

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const [source] = await db
    .select()
    .from(subSkills)
    .where(and(eq(subSkills.id, parsedId), eq(subSkills.skillId, skill.id)))
    .limit(1);

  if (!source) {
    return NextResponse.json({ error: "Sub-skill not found" }, { status: 404 });
  }

  const sourceUnits = await db
    .select()
    .from(units)
    .where(eq(units.subSkillId, source.id))
    .orderBy(asc(units.sortOrder));

  const suffix = Date.now().toString().slice(-4);
  const [clonedSub] = await db
    .insert(subSkills)
    .values({
      skillId: skill.id,
      slug: `${source.slug}-copy-${suffix}`,
      title: `${source.title} (Copy)`,
      description: source.description,
      sortOrder: skill.subSkillsCount,
      unitsCount: sourceUnits.length,
    })
    .returning();

  if (sourceUnits.length > 0) {
    await db.insert(units).values(
      sourceUnits.map((u, idx) => ({
        skillId: skill.id,
        subSkillId: clonedSub.id,
        slug: `${u.slug}-${suffix}`,
        title: u.title,
        unitType: u.unitType,
        sortOrder: idx,
        isPublished: u.isPublished,
        estimatedMinutes: u.estimatedMinutes,
        content: u.content,
      }))
    );
  }

  await db
    .update(skills)
    .set({
      subSkillsCount: sql`${skills.subSkillsCount} + 1`,
      unitsCount: sql`${skills.unitsCount} + ${sourceUnits.length}`,
      updatedAt: new Date(),
    })
    .where(eq(skills.id, skill.id));

  return NextResponse.json({ subSkill: clonedSub }, { status: 201 });
}
