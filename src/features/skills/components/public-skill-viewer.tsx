"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowUpRightIcon, FileTextIcon } from "lucide-react";
import useSWR, { preload } from "swr";

import BranchedMenu, { type BranchedMenuItem } from "@/components/branched-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownEditor, type WikiLinkItem } from "@/features/editor";
import {
  READING_HISTORY_KEY,
  type ReadingHistoryItem,
} from "@/features/home/components/editorial-hero";
import type {
  PublicSkillPayload,
  PublicUnitSummary,
} from "@/features/skills/services/public-skill.service";
import { dashboardSwrConfig, fetcher, swrKeys } from "@/lib/swr";
import { cn } from "@/lib/utils";

interface UnitDetailResponse {
  unit: PublicUnitSummary & { content: string };
}

type ActiveTarget =
  | { kind: "overview" }
  | { kind: "subSkill"; subSkillId: number }
  | { kind: "unit"; unitId: number };

const NOOP = () => {};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function PublicSkillViewer({
  data,
  initialSubSkillId,
  initialUnitId,
}: {
  data: PublicSkillPayload;
  initialSubSkillId?: number;
  initialUnitId?: number;
}) {
  const router = useRouter();
  const params = useParams<{
    owner?: string;
    slug?: string;
    subSkillId?: string;
    unitId?: string;
  }>();
  const { skill, subSkills, units } = data;
  const ownerSegment = skill.ownerUsername ?? params.owner ?? "";
  const basePath = ownerSegment
    ? `/skills/${encodeURIComponent(ownerSegment)}/${encodeURIComponent(skill.slug)}`
    : `/skills/${encodeURIComponent(skill.slug)}`;

  const contentSectionRef = useRef<HTMLElement>(null);
  const shouldScrollToContentRef = useRef(false);

  const target = useMemo<ActiveTarget>(() => {
    const paramUnitId = params.unitId ? Number(params.unitId) : undefined;
    const paramSubSkillId = params.subSkillId
      ? Number(params.subSkillId)
      : undefined;
    const resolvedUnitId =
      paramUnitId && Number.isInteger(paramUnitId) && paramUnitId > 0
        ? paramUnitId
        : initialUnitId;
    const resolvedSubSkillId =
      paramSubSkillId && Number.isInteger(paramSubSkillId) && paramSubSkillId > 0
        ? paramSubSkillId
        : initialSubSkillId;

    return resolvedUnitId
      ? { kind: "unit", unitId: resolvedUnitId }
      : resolvedSubSkillId
        ? { kind: "subSkill", subSkillId: resolvedSubSkillId }
        : { kind: "overview" };
  }, [initialSubSkillId, initialUnitId, params.subSkillId, params.unitId]);

  const scrollToContent = useCallback(() => {
    const el = contentSectionRef.current;
    if (!el) return;
    const isStackedViewport = window.innerWidth < 1024;
    const rect = el.getBoundingClientRect();
    if (isStackedViewport || rect.top < 0 || rect.top > 200) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    if (!shouldScrollToContentRef.current) return;
    shouldScrollToContentRef.current = false;
    const raf = requestAnimationFrame(() => {
      scrollToContent();
    });
    return () => cancelAnimationFrame(raf);
  }, [target, scrollToContent]);

  useEffect(() => {
    try {
      const entry: ReadingHistoryItem = {
        title: skill.title,
        href: basePath,
        visitedAt: new Date().toISOString(),
      };
      const raw = window.localStorage.getItem(READING_HISTORY_KEY);
      const existing: ReadingHistoryItem[] = raw ? JSON.parse(raw) : [];
      const next = [
        entry,
        ...(Array.isArray(existing)
          ? existing.filter((item) => item?.href !== basePath)
          : []),
      ].slice(0, 6);
      window.localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures in restricted browsing modes
    }
  }, [basePath, skill.title]);

  const navigateToTarget = useCallback(
    (nextTarget: ActiveTarget) => {
      shouldScrollToContentRef.current = true;
      const isSameTarget =
        (nextTarget.kind === "overview" && target.kind === "overview") ||
        (nextTarget.kind === "subSkill" &&
          target.kind === "subSkill" &&
          nextTarget.subSkillId === target.subSkillId) ||
        (nextTarget.kind === "unit" &&
          target.kind === "unit" &&
          nextTarget.unitId === target.unitId);

      if (isSameTarget) {
        shouldScrollToContentRef.current = false;
        scrollToContent();
        return;
      }

      if (nextTarget.kind === "overview") {
        router.push(basePath, { scroll: false });
      } else if (nextTarget.kind === "subSkill") {
        router.push(`${basePath}/sub-skills/${nextTarget.subSkillId}`, {
          scroll: false,
        });
      } else {
        router.push(`${basePath}/units/${nextTarget.unitId}`, {
          scroll: false,
        });
      }
    },
    [basePath, router, scrollToContent, target]
  );

  const handleWikiLinkClick = useCallback(
    (wikiTarget: {
      targetType: "skill" | "sub_skill" | "unit";
      targetId: number;
    }) => {
      if (wikiTarget.targetType === "skill") {
        navigateToTarget({ kind: "overview" });
      } else if (
        wikiTarget.targetType === "sub_skill" &&
        wikiTarget.targetId > 0
      ) {
        navigateToTarget({ kind: "subSkill", subSkillId: wikiTarget.targetId });
      } else if (wikiTarget.targetType === "unit" && wikiTarget.targetId > 0) {
        navigateToTarget({ kind: "unit", unitId: wikiTarget.targetId });
      }
    },
    [navigateToTarget]
  );

  const [bannerFailed, setBannerFailed] = useState(false);

  const unitsBySubSkill = useMemo(() => {
    const grouped = new Map<number, PublicUnitSummary[]>();
    for (const unit of units) {
      const list = grouped.get(unit.subSkillId) ?? [];
      list.push(unit);
      grouped.set(unit.subSkillId, list);
    }
    return grouped;
  }, [units]);

  const activeUnitSummary = useMemo(() => {
    if (target.kind !== "unit") return null;
    return units.find((u) => u.id === target.unitId) ?? null;
  }, [target, units]);

  const activeUnitParentSub = useMemo(() => {
    if (!activeUnitSummary) return null;
    return subSkills.find((s) => s.id === activeUnitSummary.subSkillId) ?? null;
  }, [activeUnitSummary, subSkills]);

  const wikiLinkItems = useMemo<WikiLinkItem[]>(() => {
    const items: WikiLinkItem[] = [
      { targetId: skill.id, targetType: "skill", label: skill.title, subtitle: skill.slug },
    ];
    for (const sub of subSkills) {
      items.push({ targetId: sub.id, targetType: "sub_skill", label: sub.title, subtitle: sub.slug });
    }
    for (const unit of units) {
      items.push({ targetId: unit.id, targetType: "unit", label: unit.title, subtitle: unit.slug });
    }
    return items;
  }, [skill.id, skill.slug, skill.title, subSkills, units]);

  const unitKey =
    target.kind === "unit" && ownerSegment
      ? swrKeys.skills.publicUnit(ownerSegment, skill.slug, target.unitId)
      : null;

  const {
    data: unitDetail,
    error: unitError,
    isLoading: unitLoading,
    mutate: retryUnit,
  } = useSWR<UnitDetailResponse>(unitKey, fetcher, {
    ...dashboardSwrConfig,
    dedupingInterval: 30_000,
  });

  function handlePrefetchUnit(unitId: number) {
    if (!ownerSegment) return;
    void preload(
      swrKeys.skills.publicUnit(ownerSegment, skill.slug, unitId),
      fetcher
    );
  }

  const ownerHandle = skill.ownerUsername || skill.ownerName;
  const showBanner = Boolean(skill.bannerImage) && !bannerFailed;

  return (
    <main className="pb-20">
      {showBanner && skill.bannerImage ? (
        <div className="relative h-[240px] w-full overflow-hidden sm:h-[320px] lg:h-[360px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={skill.bannerImage}
            alt={`${skill.title} banner`}
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(247,247,244,0.18) 0%, transparent 28%, transparent 42%, var(--canvas) 100%)",
            }}
          />
        </div>
      ) : null}

      <div
        className={cn(
          "mx-auto max-w-7xl px-4 sm:px-6",
          showBanner ? "mt-8" : "pt-8 sm:pt-10"
        )}
      >
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[36px] items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeftIcon className="size-3.5" />
            <span>Back to leaderboard</span>
          </Link>

          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Avatar className="size-5 border border-hairline">
              {skill.ownerImage ? (
                <AvatarImage src={skill.ownerImage} alt={skill.ownerName} />
              ) : null}
              <AvatarFallback className="text-[9px]">
                {getInitials(skill.ownerName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-body">{ownerHandle}</span>
            <span>/</span>
            <span>{skill.slug}</span>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)] lg:gap-12">
          <aside
            aria-label="Repository contents"
            className="min-w-0 self-start lg:sticky lg:top-28"
          >
            <BranchedMenu
              items={[
                { label: "README.md", value: "overview" },
                ...subSkills.map<BranchedMenuItem>((sub) => ({
                  label: sub.title,
                  value: `sub-${sub.id}`,
                  children: (unitsBySubSkill.get(sub.id) ?? []).map((unit) => ({
                    value: `unit-${unit.id}`,
                    label: unit.title,
                    icon: <FileTextIcon className="size-3.5" />,
                  })),
                })),
              ]}
              defaultOpen={subSkills.map((_, idx) => idx + 1)}
              defaultActive={
                target.kind === "overview"
                  ? "overview"
                  : target.kind === "subSkill"
                    ? `sub-${target.subSkillId}`
                    : `unit-${target.unitId}`
              }
              onSelect={(value) => {
                if (value === "overview") {
                  navigateToTarget({ kind: "overview" });
                } else if (value.startsWith("sub-")) {
                  const subSkillId = Number(value.slice(4));
                  if (Number.isInteger(subSkillId) && subSkillId > 0) {
                    navigateToTarget({ kind: "subSkill", subSkillId });
                  }
                } else if (value.startsWith("unit-")) {
                  const unitId = Number(value.slice(5));
                  if (Number.isInteger(unitId) && unitId > 0) {
                    navigateToTarget({ kind: "unit", unitId });
                  }
                }
              }}
              color="var(--muted-foreground)"
              accentColor="var(--primary)"
              lineColor="var(--border)"
              width={250}
            />
          </aside>

          <section
            ref={contentSectionRef}
            aria-label="Document viewer"
            className="min-w-0 scroll-mt-28"
          >
            {target.kind === "overview" ? (
              <div>
                <header>
                  <h1 className="font-serif text-[34px] font-normal leading-[1.1] tracking-[-0.02em] text-primary sm:text-[44px]">
                    {skill.title}
                  </h1>
                  {skill.summary ? (
                    <p className="mt-4 max-w-3xl text-base leading-[1.6] text-body">
                      {skill.summary}
                    </p>
                  ) : null}
                </header>

                <Separator className="my-6" />

                {skill.overview?.trim() ? (
                  <MarkdownEditor
                    key="overview"
                    value={skill.overview}
                    onChange={NOOP}
                    wikiLinkItems={wikiLinkItems}
                    onWikiLinkClick={handleWikiLinkClick}
                    readOnly
                    className="rounded-none border-0 bg-transparent"
                  />
                ) : (
                  <div className="py-8 text-sm text-muted-foreground">
                    No README overview provided for this skill yet.
                  </div>
                )}
              </div>
            ) : target.kind === "subSkill" ? (
              (() => {
                const activeSubSkill = subSkills.find(
                  (s) => s.id === target.subSkillId
                );
                const subSkillUnits = activeSubSkill
                  ? (unitsBySubSkill.get(activeSubSkill.id) ?? [])
                  : [];

                if (!activeSubSkill) {
                  return (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Sub-skill not found.
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col">
                    <header>
                      <h1 className="font-serif text-[30px] font-normal leading-[1.15] tracking-[-0.02em] text-primary sm:text-[38px]">
                        {activeSubSkill.title}
                      </h1>
                    </header>

                    <Separator className="my-6" />

                    {activeSubSkill.description?.trim() ? (
                      <div className="mb-8">
                        <MarkdownEditor
                          key={`sub-${activeSubSkill.id}`}
                          value={activeSubSkill.description}
                          onChange={NOOP}
                          wikiLinkItems={wikiLinkItems}
                          onWikiLinkClick={handleWikiLinkClick}
                          readOnly
                          className="rounded-none border-0 bg-transparent"
                        />
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h2 className="font-serif text-xl font-normal tracking-tight text-primary">
                          Units
                        </h2>
                        <span className="font-mono text-xs text-muted-foreground">
                          {subSkillUnits.length}{" "}
                          {subSkillUnits.length === 1 ? "unit" : "units"}
                        </span>
                      </div>

                      {subSkillUnits.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {subSkillUnits.map((unit, idx) => {
                            const unitHref = `${basePath}/units/${unit.id}`;
                            return (
                              <Card
                                key={unit.id}
                                className="gap-5 rounded-[12px] border-border bg-card py-5 transition-colors hover:border-hairline-strong"
                              >
                                <CardHeader className="px-5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-xs text-muted-foreground">
                                      Unit {String(idx + 1).padStart(2, "0")}
                                    </span>
                                    <Link
                                      href={unitHref}
                                      aria-label={`Open ${unit.title}`}
                                      onMouseEnter={() =>
                                        handlePrefetchUnit(unit.id)
                                      }
                                      onFocus={() =>
                                        handlePrefetchUnit(unit.id)
                                      }
                                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                    >
                                      <ArrowUpRightIcon className="size-4" />
                                    </Link>
                                  </div>

                                  <Link
                                    href={unitHref}
                                    onMouseEnter={() =>
                                      handlePrefetchUnit(unit.id)
                                    }
                                    onFocus={() =>
                                      handlePrefetchUnit(unit.id)
                                    }
                                    className="mt-2 block text-left"
                                  >
                                    <CardTitle className="line-clamp-2 font-serif text-xl font-normal leading-snug tracking-tight text-foreground">
                                      {unit.title}
                                    </CardTitle>
                                    <CardDescription className="mt-1 truncate font-mono text-sm text-muted-foreground">
                                      /{unit.slug}
                                    </CardDescription>
                                  </Link>
                                </CardHeader>

                                <CardFooter className="justify-between border-t border-border/60 px-5 pt-4">
                                  <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
                                    <FileTextIcon className="size-3.5 shrink-0" />
                                    <span className="truncate">
                                      {activeSubSkill.title}
                                    </span>
                                  </span>

                                  <Badge
                                    variant="secondary"
                                    className="font-mono text-xs font-normal"
                                  >
                                    {unit.estimatedMinutes
                                      ? `${unit.estimatedMinutes} min`
                                      : "Read"}
                                  </Badge>
                                </CardFooter>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-[12px] border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                          No units in this sub-skill yet.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div>
                <header>
                  {activeUnitParentSub ? (
                    <p className="mb-2 font-mono text-xs text-muted-foreground">
                      {activeUnitParentSub.title}
                      {activeUnitSummary?.estimatedMinutes
                        ? ` · ${activeUnitSummary.estimatedMinutes} min`
                        : ""}
                    </p>
                  ) : null}
                  <h1 className="font-serif text-[30px] font-normal leading-[1.15] tracking-[-0.02em] text-primary sm:text-[38px]">
                    {activeUnitSummary?.title ?? "Unit"}
                  </h1>
                </header>

                <Separator className="my-6" />

                {unitLoading ? (
                  <div className="flex flex-col gap-3 py-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : unitError ? (
                  <div className="flex flex-col items-center gap-3 p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Failed to load unit content.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void retryUnit()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : unitDetail?.unit.content?.trim() ? (
                  <MarkdownEditor
                    key={`unit-${target.unitId}`}
                    value={unitDetail.unit.content}
                    onChange={NOOP}
                    wikiLinkItems={wikiLinkItems}
                    onWikiLinkClick={handleWikiLinkClick}
                    readOnly
                    className="rounded-none border-0 bg-transparent"
                  />
                ) : (
                  <div className="py-8 text-sm text-muted-foreground">
                    This unit does not have any content yet.
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
