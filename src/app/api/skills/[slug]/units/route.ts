import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/db";
import { skills, subSkills, units } from "@/db/schema";
import { slugify } from "@/features/skills/utils/slugify";
import { getAuth } from "@/lib/auth";

const createUnitSchema = z.object({
  subSkillId: z.number().int().positive(),
  title: z.string().trim().min(1, "Unit title is required").max(120),
  unitType: z.enum(["page", "reference", "guide"]).default("page"),
});

export async function POST(
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
  const parsed = createUnitSchema.safeParse(body);
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

  const [subSkill] = await db
    .select({ id: subSkills.id, unitsCount: subSkills.unitsCount })
    .from(subSkills)
    .where(
      and(
        eq(subSkills.id, parsed.data.subSkillId),
        eq(subSkills.skillId, skill.id)
      )
    )
    .limit(1);

  if (!subSkill) {
    return NextResponse.json({ error: "Sub-skill not found" }, { status: 404 });
  }

  const baseSlug = slugify(parsed.data.title) || `unit-${Date.now()}`;
  const existing = await db
    .select({ id: units.id })
    .from(units)
    .where(and(eq(units.subSkillId, subSkill.id), eq(units.slug, baseSlug)))
    .limit(1);

  const finalSlug = existing.length > 0 ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

  const [created] = await db
    .insert(units)
    .values({
      skillId: skill.id,
      subSkillId: subSkill.id,
      slug: finalSlug,
      title: parsed.data.title,
      unitType: parsed.data.unitType,
      sortOrder: subSkill.unitsCount,
      isPublished: true,
      content: `## ${parsed.data.title}\n\nStart writing Markdown here.\n`,
    })
    .returning();

  await Promise.all([
    db
      .update(subSkills)
      .set({
        unitsCount: sql`${subSkills.unitsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(subSkills.id, subSkill.id)),
    db
      .update(skills)
      .set({
        unitsCount: sql`${skills.unitsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, skill.id)),
  ]);

  return NextResponse.json({ unit: created }, { status: 201 });
}
