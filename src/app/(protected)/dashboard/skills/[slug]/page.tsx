import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillEditorWorkspace } from "@/features/skills";
import { getSkillEditorData } from "@/features/skills/services/skill.service";

async function SkillEditorLoader({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const initialData = await getSkillEditorData(slug);

  if (!initialData) {
    notFound();
  }

  return <SkillEditorWorkspace slug={slug} initialData={initialData} />;
}

export default function SkillEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-64" />
          <div className="grid gap-4 md:grid-cols-[270px_1fr]">
            <Skeleton className="h-96 rounded-[12px]" />
            <Skeleton className="h-96 rounded-[12px]" />
          </div>
        </div>
      }
    >
      <SkillEditorLoader params={params} />
    </Suspense>
  );
}
