import { type ReactNode, Suspense } from "react";
import { HomeTemplate } from "@/features/home/components/home-template";
import { PublicSkillViewer } from "@/features/skills/components/public-skill-viewer";
import { getPublicSkillByOwnerAndSlug } from "@/features/skills/services/public-skill.service";
import { PublicSkillSkeleton } from "./_components/public-skill-route";

async function PublicSkillLayoutLoader({
  params,
  children,
}: {
  params: Promise<{ owner: string; slug: string }>;
  children: ReactNode;
}) {
  const { owner, slug } = await params;
  const data = await getPublicSkillByOwnerAndSlug(owner, slug);

  if (!data) {
    return <>{children}</>;
  }

  return (
    <>
      <PublicSkillViewer data={data} />
      {children}
    </>
  );
}

export default function PublicSkillLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ owner: string; slug: string }>;
}) {
  return (
    <HomeTemplate>
      <Suspense fallback={<PublicSkillSkeleton />}>
        <PublicSkillLayoutLoader params={params}>
          {children}
        </PublicSkillLayoutLoader>
      </Suspense>
    </HomeTemplate>
  );
}
