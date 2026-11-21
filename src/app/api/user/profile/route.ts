import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/db";
import { user, userProfiles } from "@/db/schema";
import { getAuth } from "@/lib/auth";

const USERNAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().max(60).optional().default(""),
  username: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters")
    .max(40)
    .regex(USERNAME_REGEX, "Lowercase letters, numbers, and hyphens only"),
  website: z.string().trim().max(200).optional().default(""),
  bio: z.string().trim().max(200, "Biography max 200 characters").optional().default(""),
  bannerImage: z.string().trim().max(500).nullable().optional(),
  avatarImage: z.string().trim().max(500).nullable().optional(),
});

function normalizeWebsite(raw: string): string | null {
  const trimmed = raw.trim().replace(/^https?:\/\//i, "");
  if (!trimmed) return null;
  return `https://${trimmed}`;
}

export async function GET(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const { searchParams } = new URL(request.url);
  const checkUsername = searchParams.get("checkUsername")?.trim().toLowerCase();

  if (checkUsername) {
    if (!USERNAME_REGEX.test(checkUsername) || checkUsername.length < 2) {
      return NextResponse.json({ available: false });
    }
    const existing = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(
        and(
          eq(userProfiles.username, checkUsername),
          ne(userProfiles.userId, session.user.id)
        )
      )
      .limit(1);

    return NextResponse.json({ available: existing.length === 0 });
  }

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, session.user.id))
    .limit(1);

  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
    },
    profile: profile ?? null,
  });
}

export async function PATCH(request: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
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

  const taken = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(
      and(
        eq(userProfiles.username, input.username),
        ne(userProfiles.userId, session.user.id)
      )
    )
    .limit(1);

  if (taken.length > 0) {
    return NextResponse.json(
      { error: "Username is already taken." },
      { status: 409 }
    );
  }

  const displayName = [input.firstName, input.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const website = normalizeWebsite(input.website);

  const [existing] = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.userId, session.user.id))
    .limit(1);

  if (existing) {
    await db
      .update(userProfiles)
      .set({
        username: input.username,
        displayName,
        firstName: input.firstName,
        lastName: input.lastName || null,
        website,
        bio: input.bio || null,
        bannerImage: input.bannerImage ?? null,
      })
      .where(eq(userProfiles.userId, session.user.id));
  } else {
    await db.insert(userProfiles).values({
      userId: session.user.id,
      username: input.username,
      displayName,
      firstName: input.firstName,
      lastName: input.lastName || null,
      website,
      bio: input.bio || null,
      bannerImage: input.bannerImage ?? null,
    });
  }

  await db
    .update(user)
    .set({
      name: displayName,
      image: input.avatarImage !== undefined ? input.avatarImage : session.user.image,
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id));

  return NextResponse.json({
    ok: true,
    username: input.username,
    displayName,
  });
}
