import { Suspense } from "react";
import { notFound } from "next/navigation";
import LatticeLoader from "@/components/lattice-loader";
import {
  buildBreadcrumbJsonLd,
  buildSkillJsonLd,
  buildUnitJsonLd,
  JsonLd,
} from "@/components/seo/json-ld";
import { getPublicSkillByOwnerAndSlug } from "@/features/skills/services/public-skill.service";

export function PublicSkillSkeleton() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-6 py-16">
      <LatticeLoader
        label="Loading skill"
        color="var(--primary)"
        pattern="spiral"
        grid={4}
        cellSize={6}
        gap={3}
      />
    </div>
  );
}

type RouteParams = {
  owner: string;
  slug: string;
  subSkillId?: string;
  unitId?: string;
};

async function PublicSkillRouteValidator({
  params,
  mode,
}: {
  params: Promise<RouteParams>;
  mode: "overview" | "subSkill" | "unit";
}) {
  const { owner, slug, subSkillId, unitId } = await params;
  const data = await getPublicSkillByOwnerAndSlug(owner, slug);

  if (!data) {
    notFound();
  }

  const basePath = `/skills/${encodeURIComponent(owner)}/${encodeURIComponent(slug)}`;

  if (mode === "subSkill") {
    const parsedSubSkillId = Number(subSkillId);
    const matchedSub = data.subSkills.find((item) => item.id === parsedSubSkillId);
    if (!Number.isInteger(parsedSubSkillId) || !matchedSub) {
      notFound();
    }

    return (
      <JsonLd
        data={[
          buildSkillJsonLd({
            title: `${matchedSub.title} - ${data.skill.title}`,
            description:
              matchedSub.description?.trim() ||
              `Explore ${matchedSub.title} in ${data.skill.title} on Skills Page.`,
            path: `${basePath}/sub-skills/${matchedSub.id}`,
            authorName: data.skill.ownerName,
            authorUsername: data.skill.ownerUsername,
            datePublished: data.skill.createdAt,
            dateModified: data.skill.updatedAt,
            subSkillsCount: data.skill.subSkillsCount,
            unitsCount: matchedSub.unitsCount,
            imageUrl: data.skill.bannerImage,
          }),
          buildBreadcrumbJsonLd([
            { name: "Skills Page", path: "/" },
            { name: "Explore Skills", path: "/skills" },
            { name: data.skill.title, path: basePath },
            { name: matchedSub.title, path: `${basePath}/sub-skills/${matchedSub.id}` },
          ]),
        ]}
      />
    );
  }

  if (mode === "unit") {
    const parsedUnitId = Number(unitId);
    const matchedUnit = data.units.find((item) => item.id === parsedUnitId);
    if (!Number.isInteger(parsedUnitId) || !matchedUnit) {
      notFound();
    }

    return (
      <JsonLd
        data={[
          buildUnitJsonLd({
            title: matchedUnit.title,
            description: `Read ${matchedUnit.title} in ${data.skill.title} on Skills Page.`,
            path: `${basePath}/units/${matchedUnit.id}`,
            skillTitle: data.skill.title,
            skillPath: basePath,
            authorName: data.skill.ownerName,
            authorUsername: data.skill.ownerUsername,
            datePublished: data.skill.createdAt,
            dateModified: data.skill.updatedAt,
            estimatedMinutes: matchedUnit.estimatedMinutes,
          }),
          buildBreadcrumbJsonLd([
            { name: "Skills Page", path: "/" },
            { name: "Explore Skills", path: "/skills" },
            { name: data.skill.title, path: basePath },
            { name: matchedUnit.title, path: `${basePath}/units/${matchedUnit.id}` },
          ]),
        ]}
      />
    );
  }

  return (
    <JsonLd
      data={[
        buildSkillJsonLd({
          title: data.skill.title,
          description:
            data.skill.summary?.trim() ||
            `Explore ${data.skill.title} by @${owner} on Skills Page.`,
          path: basePath,
          authorName: data.skill.ownerName,
          authorUsername: data.skill.ownerUsername,
          datePublished: data.skill.createdAt,
          dateModified: data.skill.updatedAt,
          subSkillsCount: data.skill.subSkillsCount,
          unitsCount: data.skill.unitsCount,
          imageUrl: data.skill.bannerImage,
        }),
        buildBreadcrumbJsonLd([
          { name: "Skills Page", path: "/" },
          { name: "Explore Skills", path: "/skills" },
          { name: data.skill.title, path: basePath },
        ]),
      ]}
    />
  );
}

export function PublicSkillRoute({
  params,
  mode,
}: {
  params: Promise<RouteParams>;
  mode: "overview" | "subSkill" | "unit";
}) {
  return (
    <Suspense fallback={null}>
      <PublicSkillRouteValidator params={params} mode={mode} />
    </Suspense>
  );
}
