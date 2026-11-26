import { getSeoIndexSnapshot } from "@/features/skills/services/seo.service";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export async function GET() {
  const siteUrl = getSiteUrl();
  const snapshot = await getSeoIndexSnapshot({ limit: 100 });

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `${SITE_NAME} (skills-page) organizes technical knowledge into structured skill repositories containing an overview (README.md), ordered sub-skill folders, and modular Markdown units with mathematical equations, Mermaid diagrams, and internal wiki-links.`,
    "",
    "## Primary Pages",
    "",
    `- [Home](${siteUrl}/): Main landing page and public skills leaderboard.`,
    `- [Explore Skills](${siteUrl}/skills): Searchable directory of all published public skills.`,
    `- [How to Use](${siteUrl}/how-to-use): Step-by-step guide to creating skills, sub-skills, units, and rich content.`,
    `- [About Skills Page](${siteUrl}/about): Architecture principles and overview of the repository workspace.`,
    `- [Full LLM Catalog](${siteUrl}/llms-full.txt): Extended Markdown export of public skill repositories and unit indexes.`,
    `- [Sitemap](${siteUrl}/sitemap.xml): XML sitemap of public skills, units, and creator profiles.`,
    "",
    "## Public Skills",
    "",
  ];

  if (snapshot.skills.length === 0) {
    lines.push("- No published public skills indexed yet.");
  } else {
    for (const skill of snapshot.skills) {
      const skillPath = `/skills/${encodeURIComponent(skill.ownerUsername)}/${encodeURIComponent(skill.slug)}`;
      const summary = skill.summary?.trim() || `${skill.subSkillsCount} sub-skills, ${skill.unitsCount} units.`;
      lines.push(
        `- [${skill.title}](${siteUrl}${skillPath}) ([Markdown](${siteUrl}${skillPath}/llms.txt)): By @${skill.ownerUsername}. ${summary}`
      );
    }
  }

  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
