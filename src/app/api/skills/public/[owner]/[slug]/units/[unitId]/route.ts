import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { skills, units, userProfiles } from "@/db/schema";

export async function GET(
  _request: Request,
  context: { params: Promise<{ owner: string; slug: string; unitId: string }> }
) {
  const { owner, slug, unitId } = await context.params;
  const parsedUnitId = Number.parseInt(unitId, 10);

  if (!Number.isFinite(parsedUnitId) || parsedUnitId <= 0) {
    return NextResponse.json({ error: "Invalid unit id" }, { status: 400 });
  }

  const db = await getDb();

  const [skill] = await db
    .select({ id: skills.id })
    .from(skills)
    .innerJoin(userProfiles, eq(skills.ownerId, userProfiles.userId))
    .where(
      and(
        eq(userProfiles.username, owner),
        eq(skills.slug, slug),
        eq(skills.visibility, "public"),
        eq(skills.status, "published")
      )
    )
    .limit(1);

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const [unit] = await db
    .select({
      id: units.id,
      skillId: units.skillId,
      subSkillId: units.subSkillId,
      slug: units.slug,
      title: units.title,
      unitType: units.unitType,
      sortOrder: units.sortOrder,
      estimatedMinutes: units.estimatedMinutes,
      content: units.content,
    })
    .from(units)
    .where(
      and(
        eq(units.id, parsedUnitId),
        eq(units.skillId, skill.id),
        eq(units.isPublished, true)
      )
    )
    .limit(1);

  if (!unit) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  return NextResponse.json(
    { unit },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
