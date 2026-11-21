import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/db";
import { skills, subSkills, units } from "@/db/schema";
import { getAuth } from "@/lib/auth";

const updateUnitSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  unitType: z.enum(["page", "reference", "guide"]).optional(),
  isPublished: z.boolean().optional(),
  estimatedMinutes: z.number().int().min(1).max(600).nullable().optional(),
  content: z.string().optional(),
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; unitId: string }> }
) {
  const { slug, unitId } = await context.params;
  const parsedId = Number(unitId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: "Invalid unit ID" }, { status: 400 });
  }

  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db, skill } = await verifySkillOwner(slug, session.user.id);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const [unit] = await db
    .select()
    .from(units)
    .where(and(eq(units.id, parsedId), eq(units.skillId, skill.id)))
    .limit(1);

  if (!unit) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  return NextResponse.json({ unit });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; unitId: string }> }
) {
  const { slug, unitId } = await context.params;
  const parsedId = Number(unitId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: "Invalid unit ID" }, { status: 400 });
  }

  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db, skill } = await verifySkillOwner(slug, session.user.id);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateUnitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(units)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(and(eq(units.id, parsedId), eq(units.skillId, skill.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  await db
    .update(skills)
    .set({ updatedAt: new Date() })
    .where(eq(skills.id, skill.id));

  return NextResponse.json({ unit: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string; unitId: string }> }
) {
  const { slug, unitId } = await context.params;
  const parsedId = Number(unitId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: "Invalid unit ID" }, { status: 400 });
  }

  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db, skill } = await verifySkillOwner(slug, session.user.id);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const [deleted] = await db
    .delete(units)
    .where(and(eq(units.id, parsedId), eq(units.skillId, skill.id)))
    .returning({ id: units.id, subSkillId: units.subSkillId });

  if (!deleted) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  await Promise.all([
    db
      .update(subSkills)
      .set({
        unitsCount: sql`MAX(0, ${subSkills.unitsCount} - 1)`,
        updatedAt: new Date(),
      })
      .where(eq(subSkills.id, deleted.subSkillId)),
    db
      .update(skills)
      .set({
        unitsCount: sql`MAX(0, ${skills.unitsCount} - 1)`,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, skill.id)),
  ]);

  return NextResponse.json({ deletedId: deleted.id });
}
