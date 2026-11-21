import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { skills, subSkills, units } from "@/db/schema";
import { createSkillSchema } from "@/features/skills/schemas/create-skill.schema";
import { LEADERBOARD_CACHE_TAG } from "@/features/skills/services/leaderboard.service";
import { getAuth } from "@/lib/auth";

export async function GET() {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const rows = await db
    .select({
      id: skills.id,
      slug: skills.slug,
      title: skills.title,
      summary: skills.summary,
      bannerImage: skills.bannerImage,
      visibility: skills.visibility,
      status: skills.status,
      subSkillsCount: skills.subSkillsCount,
      unitsCount: skills.unitsCount,
      starsCount: skills.starsCount,
      updatedAt: skills.updatedAt,
    })
    .from(skills)
    .where(eq(skills.ownerId, session.user.id))
    .orderBy(desc(skills.updatedAt))
    .limit(50);

  return NextResponse.json({ skills: rows });
}

export async function POST(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSkillSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const db = await getDb();

  const existing = await db
    .select({ id: skills.id })
    .from(skills)
    .where(
      and(eq(skills.ownerId, session.user.id), eq(skills.slug, input.slug))
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "A skill with this slug already exists in your workspace." },
      { status: 409 }
    );
  }

  const subSkillItems = input.subSkills ?? [];
  const totalSubSkills = subSkillItems.length;
  const totalUnits = subSkillItems.reduce(
    (sum, sub) => sum + sub.units.length,
    0
  );

  const [createdSkill] = await db
    .insert(skills)
    .values({
      ownerId: session.user.id,
      slug: input.slug,
      title: input.title,
      summary: input.summary || null,
      bannerImage: input.bannerImage || null,
      visibility: input.visibility,
      status: input.status,
      subSkillsCount: totalSubSkills,
      unitsCount: totalUnits,
      overview: input.overview || null,
    })
    .returning({
      id: skills.id,
      slug: skills.slug,
      title: skills.title,
    });

  for (let subIndex = 0; subIndex < subSkillItems.length; subIndex++) {
    const sub = subSkillItems[subIndex];
    const [createdSub] = await db
      .insert(subSkills)
      .values({
        skillId: createdSkill.id,
        slug: sub.slug,
        title: sub.title,
        description: sub.description || null,
        sortOrder: subIndex,
        unitsCount: sub.units.length,
      })
      .returning({ id: subSkills.id });

    if (sub.units.length > 0) {
      await db.insert(units).values(
        sub.units.map((unit, unitIndex) => ({
          skillId: createdSkill.id,
          subSkillId: createdSub.id,
          slug: unit.slug,
          title: unit.title,
          unitType: unit.unitType,
          sortOrder: unitIndex,
          isPublished: unit.isPublished,
          estimatedMinutes: unit.estimatedMinutes ?? null,
          content: unit.content,
        }))
      );
    }
  }

  if (input.visibility === "public") {
    revalidateTag(LEADERBOARD_CACHE_TAG, "max");
  }

  return NextResponse.json(
    {
      skill: {
        ...createdSkill,
        subSkillsCount: totalSubSkills,
        unitsCount: totalUnits,
      },
    },
    { status: 201 }
  );
}
