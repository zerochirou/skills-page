import { Suspense } from "react";
import { notFound } from "next/navigation";
import LatticeLoader from "@/components/lattice-loader";
import { getPublicSkillByOwnerAndSlug } from "@/features/skills/services/public-skill.service";

export function PublicSkillSkeleton() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-6 py-16">
      <LatticeLoader
        label="Loading skill"
        color="#f54e00"
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

  if (mode === "subSkill") {
    const parsedSubSkillId = Number(subSkillId);
    if (
      !Number.isInteger(parsedSubSkillId) ||
      !data.subSkills.some((item) => item.id === parsedSubSkillId)
    ) {
      notFound();
    }
  }

  if (mode === "unit") {
    const parsedUnitId = Number(unitId);
    if (
      !Number.isInteger(parsedUnitId) ||
      !data.units.some((item) => item.id === parsedUnitId)
    ) {
      notFound();
    }
  }

  return null;
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
