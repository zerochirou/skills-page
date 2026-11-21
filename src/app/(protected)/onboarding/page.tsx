import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { OnboardingForm } from "@/features/onboarding/components/onboarding-form";
import { getAuth } from "@/lib/auth";

async function OnboardingContent() {
  await connection();
  const requestHeaders = await headers();
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user) {
    redirect("/signin");
  }

  const db = await getDb();
  const existingProfile = await db
    .select({
      username: userProfiles.username,
      displayName: userProfiles.displayName,
      role: userProfiles.role,
      bio: userProfiles.bio,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, session.user.id))
    .get();

  return (
    <OnboardingForm
      defaultDisplayName={session.user.name ?? ""}
      initialProfile={existingProfile ?? null}
    />
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center p-4">
          <div className="h-96 w-full max-w-lg animate-pulse rounded-xl border border-border bg-card" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
