import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GlobeIcon } from "lucide-react";
import {
  buildBreadcrumbJsonLd,
  buildProfileJsonLd,
  JsonLd,
} from "@/components/seo/json-ld";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkillCard } from "@/components/ui/skill-card";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeTemplate } from "@/features/home";
import { getPublicProfileByUsername } from "@/features/profile/services/profile.service";
import { createMetadata, SITE_DESCRIPTION } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const result = await getPublicProfileByUsername(username);

  if (!result) {
    return createMetadata({
      title: "Profile Not Found",
      description: SITE_DESCRIPTION,
      noIndex: true,
    });
  }

  const { profile, skills } = result;
  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.displayName;
  const description =
    profile.bio?.trim() ||
    `${fullName} (@${profile.username}) has ${skills.length} published ${skills.length === 1 ? "skill" : "skills"} on Skills Page.`;

  return createMetadata({
    title: `${fullName} (@${profile.username})`,
    description,
    path: `/${profile.username}`,
    type: "profile",
    og: {
      eyebrow: `@${profile.username}`,
      title: fullName,
      subtitle: description,
      kind: "profile",
    },
  });
}

async function PublicProfileContent({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const result = await getPublicProfileByUsername(username);

  if (!result) {
    notFound();
  }

  const { profile, skills } = result;
  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.displayName;
  const initials =
    fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0] ?? "")
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <JsonLd
        data={[
          buildProfileJsonLd({
            name: fullName,
            username: profile.username,
            bio: profile.bio,
            website: profile.website,
            avatarImage: profile.avatarImage,
          }),
          buildBreadcrumbJsonLd([
            { name: "Skills Page", path: "/" },
            { name: `@${profile.username}`, path: `/${profile.username}` },
          ]),
        ]}
      />
      <section className="overflow-hidden rounded-[12px] border border-border bg-card">
        <div className="relative h-44 w-full bg-muted">
          {profile.bannerImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.bannerImage}
                alt={`${fullName} banner`}
                className="size-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-b from-transparent via-card/60 to-card" />
            </>
          ) : null}
        </div>

        <div className="px-6 pb-6">
          <div className="relative -mt-12 mb-4 flex items-end justify-between gap-4">
            <Avatar className="size-24 border-4 border-card">
              {profile.avatarImage ? (
                <AvatarImage src={profile.avatarImage} alt={fullName} />
              ) : null}
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>

            {profile.website ? (
              <Link
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <GlobeIcon className="size-3.5" />
                {profile.website.replace(/^https?:\/\//i, "")}
              </Link>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="font-serif text-3xl font-normal tracking-tight text-primary">
              {fullName}
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              @{profile.username}
              {profile.role ? ` · ${profile.role}` : ""}
            </p>
          </div>

          {profile.bio ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {profile.bio}
            </p>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight">
            Published Skills ({skills.length})
          </h2>
        </div>

        {skills.length === 0 ? (
          <div className="rounded-[12px] border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No published public skills yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <SkillCard
                key={skill.id}
                date={skill.updatedAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                title={skill.title}
                subtitle={skill.summary || `/${skill.slug}`}
                timeLeft={`${skill.subSkillsCount} sub · ${skill.unitsCount} units`}
                members={[
                  {
                    name: fullName,
                    avatar: profile.avatarImage ?? undefined,
                    initials,
                  },
                ]}
                href={`/skills/${encodeURIComponent(profile.username)}/${encodeURIComponent(skill.slug)}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <HomeTemplate>
      <Suspense
        fallback={
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
            <Skeleton className="h-64 rounded-[12px]" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-44 rounded-[12px]" />
              <Skeleton className="h-44 rounded-[12px]" />
            </div>
          </div>
        }
      >
        <PublicProfileContent params={params} />
      </Suspense>
    </HomeTemplate>
  );
}
