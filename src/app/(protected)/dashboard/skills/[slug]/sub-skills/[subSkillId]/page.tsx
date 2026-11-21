import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillEditorWorkspace } from "@/features/skills";
import { getSkillEditorData } from "@/features/skills/services/skill.service";

async function SkillSubSkillEditorLoader({
  params,
}: {
  params: Promise<{ slug: string; subSkillId: string }>;
}) {
  const { slug, subSkillId: rawSubSkillId } = await params;
  const subSkillId = Number(rawSubSkillId);
  if (!Number.isInteger(subSkillId) || subSkillId <= 0) {
    notFound();
  }

  const data = await getSkillEditorData(slug);
  if (!data || !data.subSkills.some((s) => s.id === subSkillId)) {
    notFound();
  }

  return (
    <SkillEditorWorkspace
      slug={slug}
      initialSubSkillId={subSkillId}
      initialData={{
        skill: data.skill,
        subSkills: data.subSkills,
        units: data.units,
      }}
    />
  );
}

export default function SkillSubSkillEditorPage({
  params,
}: {
  params: Promise<{ slug: string; subSkillId: string }>;
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
      <SkillSubSkillEditorLoader params={params} />
    </Suspense>
  );
}
