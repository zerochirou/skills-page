import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillEditorWorkspace } from "@/features/skills";
import { getSkillEditorData } from "@/features/skills/services/skill.service";

async function SkillUnitEditorLoader({
  params,
}: {
  params: Promise<{ slug: string; unitId: string }>;
}) {
  const { slug, unitId: rawUnitId } = await params;
  const unitId = Number(rawUnitId);
  if (!Number.isInteger(unitId) || unitId <= 0) {
    notFound();
  }

  const data = await getSkillEditorData(slug, unitId);
  if (!data || !data.initialUnit) {
    notFound();
  }

  return (
    <SkillEditorWorkspace
      slug={slug}
      initialUnitId={unitId}
      initialData={{
        skill: data.skill,
        subSkills: data.subSkills,
        units: data.units,
      }}
      initialUnit={data.initialUnit}
    />
  );
}

export default function SkillUnitEditorPage({
  params,
}: {
  params: Promise<{ slug: string; unitId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full rounded-[12px]" />
          <Skeleton className="h-96 w-full rounded-[12px]" />
        </div>
      }
    >
      <SkillUnitEditorLoader params={params} />
    </Suspense>
  );
}
