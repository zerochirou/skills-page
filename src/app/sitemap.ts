import type { MetadataRoute } from "next";
import { getSeoIndexSnapshot } from "@/features/skills/services/seo.service";
import { getSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/skills`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/how-to-use`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/learn/demo`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/llms.txt`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  const snapshot = await getSeoIndexSnapshot({ limit: 500 });
  const skillById = new Map(snapshot.skills.map((s) => [s.id, s]));

  const profileRoutes: MetadataRoute.Sitemap = snapshot.profiles.map((profile) => ({
    url: `${siteUrl}/${encodeURIComponent(profile.username)}`,
    lastModified: profile.onboardedAt,
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  const skillRoutes: MetadataRoute.Sitemap = snapshot.skills.map((skill) => ({
    url: `${siteUrl}/skills/${encodeURIComponent(skill.ownerUsername)}/${encodeURIComponent(skill.slug)}`,
    lastModified: skill.updatedAt,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const subSkillRoutes: MetadataRoute.Sitemap = snapshot.subSkills
    .map((sub) => {
      const parent = skillById.get(sub.skillId);
      if (!parent) return null;
      return {
        url: `${siteUrl}/skills/${encodeURIComponent(parent.ownerUsername)}/${encodeURIComponent(parent.slug)}/sub-skills/${sub.id}`,
        lastModified: sub.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const unitRoutes: MetadataRoute.Sitemap = snapshot.units
    .map((unit) => {
      const parent = skillById.get(unit.skillId);
      if (!parent) return null;
      return {
        url: `${siteUrl}/skills/${encodeURIComponent(parent.ownerUsername)}/${encodeURIComponent(parent.slug)}/units/${unit.id}`,
        lastModified: unit.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return [
    ...staticRoutes,
    ...skillRoutes,
    ...unitRoutes,
    ...subSkillRoutes,
    ...profileRoutes,
  ];
}
