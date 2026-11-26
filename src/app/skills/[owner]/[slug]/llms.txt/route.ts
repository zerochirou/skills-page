import { getPublicSkillFullMarkdownData } from "@/features/skills/services/seo.service";
import { getSiteUrl, SITE_NAME } from "@/lib/seo";

export async function GET(
  _request: Request,
  context: { params: Promise<{ owner: string; slug: string }> }
) {
  const { owner, slug } = await context.params;
  const data = await getPublicSkillFullMarkdownData(owner, slug);

  if (!data) {
    return new Response("# Not Found\n\nThis skill repository does not exist or is private.\n", {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  }

  const siteUrl = getSiteUrl();
  const basePath = `/skills/${encodeURIComponent(data.skill.ownerUsername)}/${encodeURIComponent(data.skill.slug)}`;
  const unitsBySub = new Map<number, typeof data.units>();
  for (const unit of data.units) {
    const list = unitsBySub.get(unit.subSkillId) ?? [];
    list.push(unit);
    unitsBySub.set(unit.subSkillId, list);
  }

  const lines: string[] = [
    `# ${data.skill.title}`,
    "",
    `> ${data.skill.summary?.trim() || `${data.skill.title} on ${SITE_NAME}`}`,
    "",
    `- Source: ${siteUrl}${basePath}`,
    `- Author: ${data.skill.ownerName} (@${data.skill.ownerUsername})`,
    `- Last Updated: ${data.skill.updatedAt.toISOString()}`,
    "",
  ];

  if (data.skill.overview?.trim()) {
    lines.push("## Overview");
    lines.push("");
    lines.push(data.skill.overview.trim());
    lines.push("");
  }

  data.subSkills.forEach((sub, sIdx) => {
    lines.push(`## ${sIdx + 1}. ${sub.title}`);
    lines.push("");
    lines.push(`URL: ${siteUrl}${basePath}/sub-skills/${sub.id}`);
    if (sub.description?.trim()) {
      lines.push("");
      lines.push(sub.description.trim());
    }
    const subUnits = unitsBySub.get(sub.id) ?? [];
    for (const [uIdx, unit] of subUnits.entries()) {
      lines.push("");
      lines.push(`### ${sIdx + 1}.${uIdx + 1} ${unit.title}`);
      lines.push("");
      lines.push(`URL: ${siteUrl}${basePath}/units/${unit.id}`);
      if (unit.estimatedMinutes) {
        lines.push(`Estimated reading time: ${unit.estimatedMinutes} minutes`);
      }
      if (unit.content.trim()) {
        lines.push("");
        lines.push(unit.content.trim());
      }
    }
    lines.push("");
  });

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
