"use server";

import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { user, userProfiles } from "@/db/schema";
import { getAuth } from "@/lib/auth";

export type OnboardingState = {
  error?: string;
};

const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;

export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/signin");
  }

  const rawUsername = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!USERNAME_REGEX.test(rawUsername)) {
    return {
      error:
        "Username must be 3–30 characters and only contain lowercase letters, numbers, underscores, or hyphens.",
    };
  }

  if (!displayName) {
    return { error: "Display name is required." };
  }

  const db = await getDb();

  const existingUsername = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(
      and(
        eq(userProfiles.username, rawUsername),
        ne(userProfiles.userId, session.user.id)
      )
    )
    .get();

  if (existingUsername) {
    return { error: "That username is already taken." };
  }

  const existingProfile = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.userId, session.user.id))
    .get();

  if (existingProfile) {
    await db
      .update(userProfiles)
      .set({
        username: rawUsername,
        displayName,
        role: role || null,
        bio: bio || null,
      })
      .where(eq(userProfiles.userId, session.user.id));
  } else {
    await db.insert(userProfiles).values({
      userId: session.user.id,
      username: rawUsername,
      displayName,
      role: role || null,
      bio: bio || null,
    });
  }

  if (displayName !== session.user.name) {
    await db
      .update(user)
      .set({ name: displayName })
      .where(eq(user.id, session.user.id));
  }

  redirect("/dashboard");
}

export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean; reason?: string }> {
  const normalized = username.trim().toLowerCase();
  if (!USERNAME_REGEX.test(normalized)) {
    return {
      available: false,
      reason: "Use 3–30 lowercase letters, numbers, _ or -.",
    };
  }

  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const db = await getDb();
  const existing = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(
      session?.user
        ? and(
            eq(userProfiles.username, normalized),
            ne(userProfiles.userId, session.user.id)
          )
        : eq(userProfiles.username, normalized)
    )
    .get();

  if (existing) {
    return { available: false, reason: "Username is already taken." };
  }

  return { available: true };
}
