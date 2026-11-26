import type { Metadata } from "next";
import { getPublicSkillByOwnerAndSlug } from "@/features/skills/services/public-skill.service";
import { createMetadata, SITE_DESCRIPTION } from "@/lib/seo";
import { PublicSkillRoute } from "../../_components/public-skill-route";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; slug: string; subSkillId: string }>;
}): Promise<Metadata> {
  const { owner, slug, subSkillId } = await params;
  const data = await getPublicSkillByOwnerAndSlug(owner, slug);
  const parsedSubSkillId = Number(subSkillId);
  const subSkill = data?.subSkills.find((item) => item.id === parsedSubSkillId);

  if (!data || !subSkill) {
    return createMetadata({
      title: "Sub-skill Not Found",
      description: SITE_DESCRIPTION,
      noIndex: true,
    });
  }

  const { skill } = data;
  const description =
    subSkill.description?.trim() ||
    `Explore ${subSkill.title} in ${skill.title} on Skills Page.`;
  const skillPath = `/skills/${owner}/${slug}`;

  return createMetadata({
    title: `${subSkill.title} | ${skill.title}`,
    description,
    path: `${skillPath}/sub-skills/${subSkillId}`,
    markdownUrl: `${skillPath}/llms.txt`,
    keywords: [subSkill.title, skill.title, `@${owner}`],
    type: "article",
    og: {
      eyebrow: `@${owner} / ${skill.title}`,
      title: subSkill.title,
      subtitle: description,
      kind: "skill",
    },
  });
}

export default function PublicSubSkillPage({
  params,
}: {
  params: Promise<{ owner: string; slug: string; subSkillId: string }>;
}) {
  return <PublicSkillRoute params={params} mode="subSkill" />;
}
