import { getSeoIndexSnapshot } from "@/features/skills/services/seo.service";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export async function GET() {
  const siteUrl = getSiteUrl();
  const snapshot = await getSeoIndexSnapshot({ includeOverview: true, limit: 100 });

  const subSkillsBySkill = new Map<number, typeof snapshot.subSkills>();
  for (const sub of snapshot.subSkills) {
    const list = subSkillsBySkill.get(sub.skillId) ?? [];
    list.push(sub);
    subSkillsBySkill.set(sub.skillId, list);
  }

  const unitsBySubSkill = new Map<number, typeof snapshot.units>();
  for (const unit of snapshot.units) {
    const list = unitsBySubSkill.get(unit.subSkillId) ?? [];
    list.push(unit);
    unitsBySubSkill.set(unit.subSkillId, list);
  }

  const lines: string[] = [
    `# ${SITE_NAME} - Full Public Knowledge Catalog`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `Canonical URL: ${siteUrl}`,
    `Compact index: ${siteUrl}/llms.txt`,
    "",
  ];

  for (const skill of snapshot.skills) {
    const basePath = `/skills/${encodeURIComponent(skill.ownerUsername)}/${encodeURIComponent(skill.slug)}`;
    lines.push(`## ${skill.title}`);
    lines.push("");
    lines.push(`- URL: ${siteUrl}${basePath}`);
    lines.push(`- Markdown Export: ${siteUrl}${basePath}/llms.txt`);
    lines.push(`- Author: ${skill.ownerName} (@${skill.ownerUsername})`);
    lines.push(`- Updated: ${skill.updatedAt.toISOString()}`);
    if (skill.summary?.trim()) {
      lines.push(`- Summary: ${skill.summary.trim()}`);
    }
    if (skill.overview?.trim()) {
      lines.push("");
      lines.push(skill.overview.trim().slice(0, 2000));
    }

    const subs = subSkillsBySkill.get(skill.id) ?? [];
    if (subs.length > 0) {
      lines.push("");
      lines.push("### Structure");
      lines.push("");
      subs.forEach((sub, idx) => {
        lines.push(
          `- ${idx + 1}. [${sub.title}](${siteUrl}${basePath}/sub-skills/${sub.id})`
        );
        const subUnits = unitsBySubSkill.get(sub.id) ?? [];
        subUnits.forEach((unit, uIdx) => {
          lines.push(
            `  - ${idx + 1}.${uIdx + 1} [${unit.title}](${siteUrl}${basePath}/units/${unit.id})`
          );
        });
      });
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
