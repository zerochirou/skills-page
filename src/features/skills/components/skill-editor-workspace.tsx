"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircleIcon,
  CheckIcon,
  CopyIcon,
  FileTextIcon,
  FolderIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import useSWR, { preload, useSWRConfig } from "swr";
import { authClient } from "@/features/auth/lib/auth-client";
import {
  DocumentEditorCard,
  type WikiLinkItem,
} from "@/features/editor";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Dialog, FramedDialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, fetcher, swrKeys } from "@/lib/swr";
import { useEditorSidebar } from "../context/editor-sidebar-context";
import { SkillTableOfContents } from "./skill-table-of-contents";

interface SkillRecord {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  bannerImage: string | null;
  visibility: "public" | "private";
  status: "draft" | "published" | "archived";
  subSkillsCount: number;
  unitsCount: number;
  overview: string | null;
}

interface SubSkillRecord {
  id: number;
  skillId: number;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  unitsCount: number;
}

interface UnitSummaryRecord {
  id: number;
  skillId: number;
  subSkillId: number;
  slug: string;
  title: string;
  unitType: "page" | "reference" | "guide";
  sortOrder: number;
  isPublished: boolean;
  estimatedMinutes: number | null;
}

interface UnitDetailRecord extends UnitSummaryRecord {
  content: string;
}

type ActiveTarget =
  | { kind: "overview" }
  | { kind: "subSkill"; subSkillId: number }
  | { kind: "unit"; unitId: number };

export interface SkillEditorInitialData {
  skill: SkillRecord;
  subSkills: SubSkillRecord[];
  units: UnitSummaryRecord[];
}

const AUTOSAVE_DELAY_MS = 4000;
const DRAFT_STORAGE_PREFIX = "skills-page:draft:";

function getDraftStorageKey(slug: string, draftKey: string): string {
  return `${DRAFT_STORAGE_PREFIX}${slug}:${draftKey}`;
}

export function SkillEditorWorkspace({
  slug,
  initialSubSkillId,
  initialUnitId,
  initialData,
  initialUnit,
}: {
  slug: string;
  initialSubSkillId?: number;
  initialUnitId?: number;
  initialData?: SkillEditorInitialData | null;
  initialUnit?: UnitDetailRecord | null;
}) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { setConfig: setEditorSidebarConfig } = useEditorSidebar();
  const { data: session } = authClient.useSession();
  const [confirmDeleteUnitId, setConfirmDeleteUnitId] = useState<number | null>(
    null,
  );

  const {
    data,
    error,
    isLoading,
  } = useSWR<SkillEditorInitialData>(swrKeys.skills.detail(slug), {
    fallbackData: initialData ?? undefined,
    revalidateOnMount: !initialData,
    revalidateIfStale: false,
    dedupingInterval: 60_000,
  });

  const target = useMemo<ActiveTarget>(
    () =>
      initialUnitId
        ? { kind: "unit", unitId: initialUnitId }
        : initialSubSkillId
          ? { kind: "subSkill", subSkillId: initialSubSkillId }
          : { kind: "overview" },
    [initialUnitId, initialSubSkillId]
  );
  const activeUnitId = target.kind === "unit" ? target.unitId : null;

  const {
    data: unitData,
    isLoading: isUnitLoading,
  } = useSWR<{ unit: UnitDetailRecord }>(
    activeUnitId ? swrKeys.skills.unit(slug, activeUnitId) : null,
    {
      fallbackData: initialUnit ? { unit: initialUnit } : undefined,
      revalidateOnMount: !initialUnit,
      revalidateIfStale: false,
      dedupingInterval: 60_000,
    }
  );

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const draftsRef = useRef(drafts);
  const lastSavedRef = useRef<Record<string, string>>({});
  const inFlightSaveRef = useRef<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);

  const selectedSubSkill =
    target.kind === "subSkill"
      ? (data?.subSkills.find((s) => s.id === target.subSkillId) ?? null)
      : null;

  const draftKey =
    target.kind === "overview"
      ? "overview"
      : target.kind === "subSkill"
        ? `subSkill-${target.subSkillId}`
        : `unit-${target.unitId}`;

  const serverMarkdown =
    target.kind === "overview"
      ? (data?.skill.overview ?? "")
      : target.kind === "subSkill"
        ? (selectedSubSkill?.description ?? "")
        : (unitData?.unit.content ?? "");

  const currentMarkdown = drafts[draftKey] ?? serverMarkdown;

  const wikiLinkItems = useMemo<WikiLinkItem[]>(() => {
    if (!data) return [];
    const subMap = new Map(data.subSkills.map((s) => [s.id, s.title]));
    return [
      {
        targetType: "skill",
        targetId: data.skill.id,
        label: data.skill.title,
        subtitle: "Repository Overview",
      },
      ...data.subSkills.map((sub) => ({
        targetType: "sub_skill" as const,
        targetId: sub.id,
        label: sub.title,
        subtitle: data.skill.title,
      })),
      ...data.units.map((unit) => ({
        targetType: "unit" as const,
        targetId: unit.id,
        label: unit.title,
        subtitle: subMap.get(unit.subSkillId) ?? data.skill.title,
      })),
    ];
  }, [data]);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(() => {
    lastSavedRef.current[draftKey] = serverMarkdown;
    try {
      const cached = window.localStorage.getItem(
        getDraftStorageKey(slug, draftKey)
      );
      if (cached !== null && cached !== serverMarkdown) {
        queueMicrotask(() => {
          setDrafts((prev) =>
            draftKey in prev ? prev : { ...prev, [draftKey]: cached }
          );
          setSaveState("unsaved");
        });
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }, [slug, draftKey, serverMarkdown]);

  const handleSave = useCallback(async () => {
    if (!data) return;
    const contentToSave = draftsRef.current[draftKey] ?? serverMarkdown;
    const lastSaved = lastSavedRef.current[draftKey] ?? serverMarkdown;
    const storageKey = getDraftStorageKey(slug, draftKey);

    // Smart cache: skip server PATCH when content matches the last saved state
    if (contentToSave === lastSaved) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Ignore storage errors
      }
      setSaveState("saved");
      return;
    }

    const saveSignature = `${draftKey}:${contentToSave}`;
    if (inFlightSaveRef.current === saveSignature) return;

    inFlightSaveRef.current = saveSignature;
    setSaveState("saving");
    setActionError(null);

    try {
      if (target.kind === "overview") {
        await fetcher(`/api/skills/${slug}`, {
          method: "PATCH",
          body: JSON.stringify({ overview: contentToSave }),
        });
        await mutate<SkillEditorInitialData>(
          swrKeys.skills.detail(slug),
          (prev) =>
            prev
              ? { ...prev, skill: { ...prev.skill, overview: contentToSave } }
              : prev,
          { revalidate: false }
        );
      } else if (target.kind === "subSkill") {
        await fetcher(`/api/skills/${slug}/sub-skills/${target.subSkillId}`, {
          method: "PATCH",
          body: JSON.stringify({ description: contentToSave }),
        });
        await mutate<SkillEditorInitialData>(
          swrKeys.skills.detail(slug),
          (prev) =>
            prev
              ? {
                  ...prev,
                  subSkills: prev.subSkills.map((s) =>
                    s.id === target.subSkillId
                      ? { ...s, description: contentToSave }
                      : s
                  ),
                }
              : prev,
          { revalidate: false }
        );
      } else {
        await fetcher(`/api/skills/${slug}/units/${target.unitId}`, {
          method: "PATCH",
          body: JSON.stringify({ content: contentToSave }),
        });
        await mutate<{ unit: UnitDetailRecord }>(
          swrKeys.skills.unit(slug, target.unitId),
          (prev) =>
            prev
              ? { unit: { ...prev.unit, content: contentToSave } }
              : prev,
          { revalidate: false }
        );
      }

      lastSavedRef.current[draftKey] = contentToSave;

      // Preserve newer edits made while PATCH was in flight
      const latestDraft = draftsRef.current[draftKey];
      if (latestDraft === undefined || latestDraft === contentToSave) {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          // Ignore storage errors
        }
        setDrafts((prev) => {
          if (!(draftKey in prev)) return prev;
          const next = { ...prev };
          delete next[draftKey];
          return next;
        });
        setSaveState("saved");
      } else {
        setSaveState("unsaved");
      }
      if (inFlightSaveRef.current === saveSignature) {
        inFlightSaveRef.current = null;
      }
    } catch (err) {
      if (inFlightSaveRef.current === saveSignature) {
        inFlightSaveRef.current = null;
      }
      setSaveState("unsaved");
      setActionError(
        err instanceof ApiError ? err.message : "Failed to save changes."
      );
    }
  }, [data, draftKey, mutate, serverMarkdown, slug, target]);

  useEffect(() => {
    if (saveState !== "unsaved") return;
    const timer = setTimeout(() => {
      void handleSave();
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [saveState, drafts, draftKey, handleSave]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  async function handleCreateSubSkill(title: string) {
    setActionError(null);
    try {
      await fetcher(`/api/skills/${slug}/sub-skills`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      await mutate(swrKeys.skills.detail(slug));
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to add sub-skill."
      );
    }
  }

  async function handleRenameSubSkill(subSkillId: number, title: string) {
    setActionError(null);
    try {
      await fetcher(`/api/skills/${slug}/sub-skills/${subSkillId}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      await mutate(swrKeys.skills.detail(slug));
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to rename sub-skill."
      );
    }
  }

  async function handleDuplicateSubSkill(subSkillId: number) {
    setActionError(null);
    try {
      await fetcher(`/api/skills/${slug}/sub-skills/${subSkillId}/duplicate`, {
        method: "POST",
      });
      await mutate(swrKeys.skills.detail(slug));
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to duplicate sub-skill."
      );
    }
  }

  async function handleDeleteSubSkill(subSkillId: number) {
    setActionError(null);
    try {
      await fetcher(`/api/skills/${slug}/sub-skills/${subSkillId}`, {
        method: "DELETE",
      });
      const shouldReturnOverview =
        target.kind === "unit" &&
        data?.units.some(
          (u) => u.id === target.unitId && u.subSkillId === subSkillId
        );
      await mutate(swrKeys.skills.detail(slug));
      if (shouldReturnOverview) {
        router.push(`/dashboard/skills/${slug}`);
      }
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to delete sub-skill."
      );
    }
  }

  async function handleCreateUnit(subSkillId: number, title: string) {
    setActionError(null);
    try {
      const res = await fetcher<{ unit: UnitDetailRecord }>(
        `/api/skills/${slug}/units`,
        {
          method: "POST",
          body: JSON.stringify({
            subSkillId,
            title,
            unitType: "page",
          }),
        }
      );
      await mutate(
        swrKeys.skills.unit(slug, res.unit.id),
        { unit: res.unit },
        { revalidate: false }
      );
      await mutate(swrKeys.skills.detail(slug));
      setSaveState("saved");
      router.push(`/dashboard/skills/${slug}/units/${res.unit.id}`);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to add unit."
      );
    }
  }

  async function handleRenameUnit(unitId: number, title: string) {
    setActionError(null);
    try {
      await fetcher(`/api/skills/${slug}/units/${unitId}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      await mutate(swrKeys.skills.detail(slug));
      await mutate(swrKeys.skills.unit(slug, unitId));
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to rename unit."
      );
    }
  }

  async function handleDuplicateUnit(unitId: number) {
    setActionError(null);
    try {
      const res = await fetcher<{ unit: UnitDetailRecord }>(
        `/api/skills/${slug}/units/${unitId}/duplicate`,
        { method: "POST" }
      );
      await mutate(
        swrKeys.skills.unit(slug, res.unit.id),
        { unit: res.unit },
        { revalidate: false }
      );
      await mutate(swrKeys.skills.detail(slug));
      setSaveState("saved");
      router.push(`/dashboard/skills/${slug}/units/${res.unit.id}`);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to duplicate unit."
      );
    }
  }

  async function handleDeleteUnit(unitId: number) {
    setActionError(null);
    try {
      await fetcher(`/api/skills/${slug}/units/${unitId}`, {
        method: "DELETE",
      });
      const isDeletingCurrent =
        target.kind === "unit" && target.unitId === unitId;
      await mutate(swrKeys.skills.detail(slug));
      if (isDeletingCurrent) {
        router.push(`/dashboard/skills/${slug}`);
      }
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to delete unit."
      );
    }
  }

  async function handleUpdateSkillMeta(
    patch: Partial<
      Pick<
        SkillRecord,
        "title" | "summary" | "visibility" | "status" | "bannerImage"
      >
    >
  ): Promise<boolean> {
    setActionError(null);
    try {
      const res = await fetcher<{ skill: SkillRecord }>(`/api/skills/${slug}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await mutate(swrKeys.skills.list());
      if (res.skill.slug && res.skill.slug !== slug) {
        const nextSlug = res.skill.slug;
        const nextPath =
          target.kind === "unit"
            ? `/dashboard/skills/${nextSlug}/units/${target.unitId}`
            : target.kind === "subSkill"
              ? `/dashboard/skills/${nextSlug}/sub-skills/${target.subSkillId}`
              : `/dashboard/skills/${nextSlug}`;
        router.replace(nextPath);
        return true;
      }
      await mutate(swrKeys.skills.detail(slug));
      return true;
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to update skill."
      );
      return false;
    }
  }

  async function handleDeleteSkill() {
    setActionError(null);
    try {
      await fetcher(`/api/skills/${slug}`, {
        method: "DELETE",
      });
      await mutate(swrKeys.skills.list());
      router.push("/dashboard");
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to delete skill."
      );
    }
  }

  function handleCopySlug() {
    void navigator.clipboard?.writeText(`/${data?.skill.slug ?? slug}`);
    setCopiedSlug(true);
    window.setTimeout(() => setCopiedSlug(false), 1500);
  }

  async function handleReorder(
    nextSubSkillIds: number[],
    nextUnits: { id: number; subSkillId: number; sortOrder: number }[]
  ) {
    setActionError(null);
    const subSkillPayload = nextSubSkillIds.map((id, sortOrder) => ({
      id,
      sortOrder,
    }));

    if (data) {
      const subOrderMap = new Map(
        subSkillPayload.map((s) => [s.id, s.sortOrder])
      );
      const unitOrderMap = new Map(nextUnits.map((u) => [u.id, u]));

      const updatedSubs = [...data.subSkills]
        .map((s) => ({
          ...s,
          sortOrder: subOrderMap.get(s.id) ?? s.sortOrder,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const updatedUnits =
        nextUnits.length > 0
          ? [...data.units]
              .map((u) => {
                const next = unitOrderMap.get(u.id);
                return next
                  ? {
                      ...u,
                      subSkillId: next.subSkillId,
                      sortOrder: next.sortOrder,
                    }
                  : u;
              })
              .sort((a, b) => a.sortOrder - b.sortOrder)
          : data.units;

      await mutate(
        swrKeys.skills.detail(slug),
        {
          ...data,
          subSkills: updatedSubs,
          units: updatedUnits,
        },
        { revalidate: false }
      );
    }

    try {
      await fetcher(`/api/skills/${slug}/reorder`, {
        method: "PATCH",
        body: JSON.stringify({
          subSkills: subSkillPayload,
          units: nextUnits.length > 0 ? nextUnits : undefined,
        }),
      });
      await mutate(swrKeys.skills.detail(slug));
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to reorder items."
      );
      await mutate(swrKeys.skills.detail(slug));
    }
  }

  useEffect(() => {
    if (!data) {
      setEditorSidebarConfig(null);
      return;
    }
    setEditorSidebarConfig({
      skillTitle: data.skill.title,
      skillSlug: data.skill.slug,
      treeProps: {
        subSkills: data.subSkills,
        units: data.units,
        activeTarget: target,
        onSelectOverview: () => {
          setSaveState("saved");
          router.push(`/dashboard/skills/${slug}`);
        },
        onSelectSubSkill: (subSkillId) => {
          setSaveState("saved");
          router.push(`/dashboard/skills/${slug}/sub-skills/${subSkillId}`);
        },
        onSelectUnit: (unitId) => {
          setSaveState("saved");
          router.push(`/dashboard/skills/${slug}/units/${unitId}`);
        },
        onPrefetchUnit: (unitId) =>
          void preload(swrKeys.skills.unit(slug, unitId), fetcher),
        onCreateSubSkill: handleCreateSubSkill,
        onRenameSubSkill: handleRenameSubSkill,
        onDuplicateSubSkill: handleDuplicateSubSkill,
        onDeleteSubSkill: handleDeleteSubSkill,
        onCreateUnit: handleCreateUnit,
        onRenameUnit: handleRenameUnit,
        onDuplicateUnit: handleDuplicateUnit,
        onDeleteUnit: handleDeleteUnit,
        onReorder: handleReorder,
      },
      headerControls: {
        slug: data.skill.slug,
        title: data.skill.title,
        summary: data.skill.summary,
        bannerImage: data.skill.bannerImage,
        visibility: data.skill.visibility,
        status: data.skill.status,
        onUpdateMeta: handleUpdateSkillMeta,
        onDeleteSkill: handleDeleteSkill,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, target, slug]);

  useEffect(() => {
    // Keep editorConfig intact across intra-skill route transitions (overview <-> sub-skill <-> unit)
    // so AppSidebar doesn't flash the /dashboard sidebar. AppSidebar already gates on isEditorRoute.
  }, [setEditorSidebarConfig]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <Skeleton className="h-96 rounded-[12px]" />
          <Skeleton className="h-96 rounded-[12px]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg py-12">
        <Alert variant="error">
          <AlertCircleIcon />
          <AlertTitle>Skill not found</AlertTitle>
          <AlertDescription>
            Unable to load this skill repository. It may have been deleted or you
            may not have access.
          </AlertDescription>
          <AlertAction>
            <Button
              variant="outline"
              size="xs"
              render={<Link href="/dashboard" />}
            >
              Dashboard
            </Button>
          </AlertAction>
        </Alert>
      </div>
    );
  }

  const activeUnitSummary =
    target.kind === "unit"
      ? data.units.find((u) => u.id === target.unitId)
      : null;
  const activeSubSkill = activeUnitSummary
    ? data.subSkills.find((s) => s.id === activeUnitSummary.subSkillId)
    : null;

  const editorName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "You";

  return (
    <div className="flex flex-col gap-8">
      {data.skill.bannerImage && !bannerFailed ? (
        <div className="relative -mx-4 -mt-4 h-48 overflow-hidden sm:h-64 md:-mx-6 md:-mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.skill.bannerImage}
            alt={`${data.skill.title} banner`}
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className="size-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-b from-transparent via-background/65 to-background" />
        </div>
      ) : null}

      <header
        className={
          data.skill.bannerImage && !bannerFailed
            ? "mt-2 flex flex-col gap-2.5"
            : "mt-4 flex flex-col gap-2.5"
        }
      >
        <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
          {target.kind === "unit"
            ? (activeUnitSummary?.title ?? data.skill.title)
            : target.kind === "subSkill"
              ? (data.subSkills.find((s) => s.id === target.subSkillId)?.title ?? data.skill.title)
              : data.skill.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={handleCopySlug}
            className="inline-flex items-center gap-1 rounded px-1 py-0.5 font-mono transition-colors hover:bg-muted hover:text-foreground"
            title="Copy slug"
          >
            <span>/{data.skill.slug}</span>
            {copiedSlug ? (
              <CheckIcon className="size-3 text-semantic-success" />
            ) : (
              <CopyIcon className="size-3" />
            )}
          </button>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1">
            <FolderIcon className="size-3.5" />
            {data.subSkills.length}{" "}
            {data.subSkills.length === 1 ? "sub-skill" : "sub-skills"}
          </span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1">
            <FileTextIcon className="size-3.5" />
            {data.units.length} {data.units.length === 1 ? "unit" : "units"}
          </span>
        </div>
      </header>

      <Separator />

      {actionError ? (
        <Alert variant="error">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex min-w-0 flex-col gap-5">
        <div className="min-w-0">
          {target.kind === "unit" && isUnitLoading && !(draftKey in drafts) ? (
            <Skeleton className="h-96 w-full rounded-[12px]" />
          ) : (
            <DocumentEditorCard
              key={
                target.kind === "unit" && unitData?.unit
                  ? `${draftKey}-loaded`
                  : draftKey
              }
              section={
                target.kind === "overview"
                  ? data.skill.title
                  : (activeSubSkill?.title ?? data.skill.title)
              }
              title={
                target.kind === "overview"
                  ? "Overview (README.md)"
                  : target.kind === "subSkill"
                    ? (data.subSkills.find((s) => s.id === target.subSkillId)
                        ?.title ?? "Sub-skill")
                    : (activeUnitSummary?.title ?? "Unit")
              }
              value={currentMarkdown}
              onChange={(nextMd) => {
                setDrafts((prev) => ({ ...prev, [draftKey]: nextMd }));
                const lastSaved = lastSavedRef.current[draftKey] ?? serverMarkdown;
                const storageKey = getDraftStorageKey(slug, draftKey);
                if (nextMd === lastSaved) {
                  try {
                    window.localStorage.removeItem(storageKey);
                  } catch {
                    // Ignore storage errors
                  }
                  setSaveState("saved");
                } else {
                  try {
                    window.localStorage.setItem(storageKey, nextMd);
                  } catch {
                    // Ignore storage errors
                  }
                  setSaveState("unsaved");
                }
              }}
              wikiLinkItems={wikiLinkItems}
              onWikiLinkClick={(wikiTarget) => {
                setSaveState("saved");
                if (wikiTarget.targetType === "skill") {
                  router.push(`/dashboard/skills/${slug}`);
                } else if (wikiTarget.targetType === "sub_skill" && wikiTarget.targetId > 0) {
                  router.push(`/dashboard/skills/${slug}/sub-skills/${wikiTarget.targetId}`);
                } else if (wikiTarget.targetType === "unit" && wikiTarget.targetId > 0) {
                  router.push(`/dashboard/skills/${slug}/units/${wikiTarget.targetId}`);
                }
              }}
              saveState={saveState}
              lastEditedBy={editorName}
              actionLabel={saveState === "saving" ? "Saving..." : "Save Changes"}
              actionIcon={<SaveIcon data-icon="inline-start" />}
              actionDisabled={saveState === "saving"}
              onAction={() => void handleSave()}
              secondaryActions={
                target.kind === "unit" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleDuplicateUnit(target.unitId)}
                      title="Duplicate unit"
                    >
                      <CopyIcon data-icon="inline-start" />
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      variant="destructive-outline"
                      size="sm"
                      onClick={() => setConfirmDeleteUnitId(target.unitId)}
                      title="Delete unit"
                    >
                      <Trash2Icon data-icon="inline-start" />
                      Delete
                    </Button>
                  </>
                ) : null
              }
            />
          )}
        </div>

        {target.kind === "overview" ? (
          <SkillTableOfContents
            subSkills={data.subSkills}
            units={data.units}
            onSelectSubSkill={(subSkillId) => {
              setSaveState("saved");
              router.push(`/dashboard/skills/${slug}/sub-skills/${subSkillId}`);
            }}
            onSelectUnit={(unitId) => {
              setSaveState("saved");
              router.push(`/dashboard/skills/${slug}/units/${unitId}`);
            }}
            onPrefetchUnit={(unitId) =>
              void preload(swrKeys.skills.unit(slug, unitId), fetcher)
            }
            onReorder={handleReorder}
          />
        ) : null}
      </div>

      <Dialog
        open={confirmDeleteUnitId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteUnitId(null);
        }}
      >
        <FramedDialogContent
          className="sm:max-w-md"
          title="Delete unit"
          description="Are you sure you want to delete this unit? This action cannot be undone."
        >
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteUnitId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirmDeleteUnitId === null) return;
                const unitIdToDelete = confirmDeleteUnitId;
                setConfirmDeleteUnitId(null);
                void handleDeleteUnit(unitIdToDelete);
              }}
            >
              Delete
            </Button>
          </CardFooter>
        </FramedDialogContent>
      </Dialog>
    </div>
  );
}
