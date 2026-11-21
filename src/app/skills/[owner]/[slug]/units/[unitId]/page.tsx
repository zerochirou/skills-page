import type { Metadata } from "next";
import { getPublicSkillByOwnerAndSlug } from "@/features/skills/services/public-skill.service";
import { createMetadata, SITE_DESCRIPTION } from "@/lib/seo";
import { PublicSkillRoute } from "../../_components/public-skill-route";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; slug: string; unitId: string }>;
}): Promise<Metadata> {
  const { owner, slug, unitId } = await params;
  const data = await getPublicSkillByOwnerAndSlug(owner, slug);
  const parsedUnitId = Number(unitId);
  const unit = data?.units.find((item) => item.id === parsedUnitId);

  if (!data || !unit) {
    return createMetadata({
      title: "Unit Not Found",
      description: SITE_DESCRIPTION,
      noIndex: true,
    });
  }

  const { skill } = data;
  const description = `Read ${unit.title} in ${skill.title} on Skills Page.`;

  return createMetadata({
    title: `${unit.title} / ${skill.title}`,
    description,
    path: `/skills/${owner}/${slug}/units/${unitId}`,
    type: "article",
    og: {
      eyebrow: `@${owner} / ${skill.title}`,
      title: unit.title,
      subtitle: description,
      kind: "unit",
    },
  });
}

export default function PublicSkillUnitPage({
  params,
}: {
  params: Promise<{ owner: string; slug: string; unitId: string }>;
}) {
  return <PublicSkillRoute params={params} mode="unit" />;
}
