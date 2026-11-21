import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { skills, subSkills, units } from "@/db/schema";
import { getAuth } from "@/lib/auth";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string; unitId: string }> }
) {
  const { slug, unitId } = await context.params;
  const parsedId = Number(unitId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: "Invalid unit ID" }, { status: 400 });
  }

  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const [skill] = await db
    .select({ id: skills.id })
    .from(skills)
    .where(and(eq(skills.ownerId, session.user.id), eq(skills.slug, slug)))
    .limit(1);

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const [source] = await db
    .select()
    .from(units)
    .where(and(eq(units.id, parsedId), eq(units.skillId, skill.id)))
    .limit(1);

  if (!source) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  const suffix = Date.now().toString().slice(-4);
  const [cloned] = await db
    .insert(units)
    .values({
      skillId: skill.id,
      subSkillId: source.subSkillId,
      slug: `${source.slug}-copy-${suffix}`,
      title: `${source.title} (Copy)`,
      unitType: source.unitType,
      sortOrder: source.sortOrder + 1,
      isPublished: source.isPublished,
      estimatedMinutes: source.estimatedMinutes,
      content: source.content,
    })
    .returning();

  await Promise.all([
    db
      .update(subSkills)
      .set({
        unitsCount: sql`${subSkills.unitsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(subSkills.id, source.subSkillId)),
    db
      .update(skills)
      .set({
        unitsCount: sql`${skills.unitsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, skill.id)),
  ]);

  return NextResponse.json({ unit: cloned }, { status: 201 });
}
