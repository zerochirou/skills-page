import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { connection } from "next/server";
import { getDb } from "@/db";
import { skills, subSkills, units } from "@/db/schema";
import { getAuth } from "@/lib/auth";

export async function getSkillEditorData(slug: string, unitId?: number) {
  await connection();
  const reqHeaders = await headers();
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    return null;
  }

  const db = await getDb();
  const [skill] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.ownerId, session.user.id), eq(skills.slug, slug)))
    .limit(1);

  if (!skill) {
    return null;
  }

  const [subSkillRows, unitRows, initialUnitRow] = await Promise.all([
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
    unitId && Number.isInteger(unitId) && unitId > 0
      ? db
          .select()
          .from(units)
          .where(and(eq(units.id, unitId), eq(units.skillId, skill.id)))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
  ]);

  return {
    skill,
    subSkills: subSkillRows,
    units: unitRows,
    initialUnit: initialUnitRow,
  };
}
