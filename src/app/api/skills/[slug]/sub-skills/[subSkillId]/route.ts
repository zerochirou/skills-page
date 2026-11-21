import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/db";
import { skills, subSkills } from "@/db/schema";
import { getAuth } from "@/lib/auth";

const updateSubSkillSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120).optional(),
  description: z.string().max(10000).nullable().optional(),
});

async function verifySkillOwner(slug: string, userId: string) {
  const db = await getDb();
  const [skill] = await db
    .select({ id: skills.id })
    .from(skills)
    .where(and(eq(skills.ownerId, userId), eq(skills.slug, slug)))
    .limit(1);
  return { db, skill };
}

export async function PATCH(
  request: Request,
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

  const { db, skill } = await verifySkillOwner(slug, session.user.id);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSubSkillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(subSkills)
    .set({
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(subSkills.id, parsedId), eq(subSkills.skillId, skill.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Sub-skill not found" }, { status: 404 });
  }

  await db
    .update(skills)
    .set({ updatedAt: new Date() })
    .where(eq(skills.id, skill.id));

  return NextResponse.json({ subSkill: updated });
}

export async function DELETE(
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

  const { db, skill } = await verifySkillOwner(slug, session.user.id);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const [deleted] = await db
    .delete(subSkills)
    .where(and(eq(subSkills.id, parsedId), eq(subSkills.skillId, skill.id)))
    .returning({ id: subSkills.id, unitsCount: subSkills.unitsCount });

  if (!deleted) {
    return NextResponse.json({ error: "Sub-skill not found" }, { status: 404 });
  }

  await db
    .update(skills)
    .set({
      subSkillsCount: sql`MAX(0, ${skills.subSkillsCount} - 1)`,
      unitsCount: sql`MAX(0, ${skills.unitsCount} - ${deleted.unitsCount})`,
      updatedAt: new Date(),
    })
    .where(eq(skills.id, skill.id));

  return NextResponse.json({ deletedId: deleted.id });
}
