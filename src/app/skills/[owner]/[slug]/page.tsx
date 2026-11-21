import type { Metadata } from "next";
import { getPublicSkillByOwnerAndSlug } from "@/features/skills/services/public-skill.service";
import { createMetadata, SITE_DESCRIPTION } from "@/lib/seo";
import { PublicSkillRoute } from "./_components/public-skill-route";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; slug: string }>;
}): Promise<Metadata> {
  const { owner, slug } = await params;
  const data = await getPublicSkillByOwnerAndSlug(owner, slug);

  if (!data) {
    return createMetadata({
      title: "Skill Not Found",
      description: SITE_DESCRIPTION,
      noIndex: true,
    });
  }

  const { skill } = data;
  const description = `Explore ${skill.title} by @${owner} on Skills Page.`;

  return createMetadata({
    title: skill.title,
    description,
    path: `/skills/${owner}/${slug}`,
    type: "article",
    og: {
      eyebrow: `@${owner}`,
      title: skill.title,
      subtitle: description,
      kind: "skill",
    },
  });
}

export default function PublicSkillPage({
  params,
}: {
  params: Promise<{ owner: string; slug: string }>;
}) {
  return <PublicSkillRoute params={params} mode="overview" />;
}
