import { and, desc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { skills, user, userProfiles } from "@/db/schema";

export async function getPublicProfileByUsername(username: string) {
  await connection();
  const db = await getDb();

  const [row] = await db
    .select({
      userId: userProfiles.userId,
      username: userProfiles.username,
      displayName: userProfiles.displayName,
      firstName: userProfiles.firstName,
      lastName: userProfiles.lastName,
      website: userProfiles.website,
      bannerImage: userProfiles.bannerImage,
      role: userProfiles.role,
      bio: userProfiles.bio,
      avatarImage: user.image,
    })
    .from(userProfiles)
    .innerJoin(user, eq(userProfiles.userId, user.id))
    .where(eq(userProfiles.username, username.toLowerCase()))
    .limit(1);

  if (!row) {
    return null;
  }

  const publicSkills = await db
    .select({
      id: skills.id,
      slug: skills.slug,
      title: skills.title,
      summary: skills.summary,
      subSkillsCount: skills.subSkillsCount,
      unitsCount: skills.unitsCount,
      updatedAt: skills.updatedAt,
    })
    .from(skills)
    .where(
      and(
        eq(skills.ownerId, row.userId),
        eq(skills.visibility, "public"),
        eq(skills.status, "published")
      )
    )
    .orderBy(desc(skills.updatedAt))
    .limit(24);

  return {
    profile: row,
    skills: publicSkills,
  };
}
