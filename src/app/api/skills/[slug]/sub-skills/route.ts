import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/db";
import { skills, subSkills } from "@/db/schema";
import { slugify } from "@/features/skills/utils/slugify";
import { getAuth } from "@/lib/auth";

const createSubSkillSchema = z.object({
  title: z.string().trim().min(1, "Sub-skill title is required").max(120),
  description: z.string().trim().max(280).optional(),
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
  const parsed = createSubSkillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
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

  const baseSlug = slugify(parsed.data.title) || `section-${Date.now()}`;
  const existing = await db
    .select({ id: subSkills.id })
    .from(subSkills)
    .where(and(eq(subSkills.skillId, skill.id), eq(subSkills.slug, baseSlug)))
    .limit(1);

  const finalSlug = existing.length > 0 ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

  const [created] = await db
    .insert(subSkills)
    .values({
      skillId: skill.id,
      slug: finalSlug,
      title: parsed.data.title,
      description: parsed.data.description || null,
      sortOrder: skill.subSkillsCount,
      unitsCount: 0,
    })
    .returning();

  await db
    .update(skills)
    .set({
      subSkillsCount: sql`${skills.subSkillsCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(skills.id, skill.id));

  return NextResponse.json({ subSkill: created }, { status: 201 });
}
