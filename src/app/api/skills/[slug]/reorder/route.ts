import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/db";
import { skills, subSkills, units } from "@/db/schema";
import { getAuth } from "@/lib/auth";

const reorderSchema = z.object({
  subSkills: z
    .array(
      z.object({
        id: z.number().int().positive(),
        sortOrder: z.number().int().min(0),
      })
    )
    .optional(),
  units: z
    .array(
      z.object({
        id: z.number().int().positive(),
        subSkillId: z.number().int().positive(),
        sortOrder: z.number().int().min(0),
      })
    )
    .optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
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

  const now = new Date();

  if (parsed.data.subSkills?.length) {
    for (const item of parsed.data.subSkills) {
      await db
        .update(subSkills)
        .set({ sortOrder: item.sortOrder, updatedAt: now })
        .where(and(eq(subSkills.id, item.id), eq(subSkills.skillId, skill.id)));
    }
  }

  if (parsed.data.units?.length) {
    const countsBySubSkill = new Map<number, number>();
    for (const item of parsed.data.units) {
      countsBySubSkill.set(
        item.subSkillId,
        (countsBySubSkill.get(item.subSkillId) ?? 0) + 1
      );
      await db
        .update(units)
        .set({
          subSkillId: item.subSkillId,
          sortOrder: item.sortOrder,
          updatedAt: now,
        })
        .where(and(eq(units.id, item.id), eq(units.skillId, skill.id)));
    }

    const allSubs = await db
      .select({ id: subSkills.id })
      .from(subSkills)
      .where(eq(subSkills.skillId, skill.id));

    for (const sub of allSubs) {
      const count = countsBySubSkill.get(sub.id) ?? 0;
      await db
        .update(subSkills)
        .set({ unitsCount: count, updatedAt: now })
        .where(eq(subSkills.id, sub.id));
    }
  }

  await db
    .update(skills)
    .set({ updatedAt: now })
    .where(eq(skills.id, skill.id));

  return NextResponse.json({ ok: true });
}
