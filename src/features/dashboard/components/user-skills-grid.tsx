"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import useSWR, { preload, useSWRConfig } from "swr";
import { authClient } from "@/features/auth/lib/auth-client";
import { fetcher, swrKeys } from "@/lib/swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SkillCard } from "@/components/ui/skill-card";
import { Skeleton } from "@/components/ui/skeleton";

export interface SkillSummaryRow {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  bannerImage?: string | null;
  visibility: "public" | "private";
  status: "draft" | "published" | "archived";
  subSkillsCount: number;
  unitsCount: number;
  updatedAt?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "U";
}

function formatSkillDate(value?: string): string {
  if (!value) return "Recently updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UserSkillsGrid({
  title,
  description,
  limit,
  showSearch = true,
  showViewAll = false,
}: {
  title?: string;
  description?: string;
  limit?: number;
  showSearch?: boolean;
  showViewAll?: boolean;
}) {
  const { mutate } = useSWRConfig();
  const { data: session } = authClient.useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteTarget, setDeleteTarget] = useState<SkillSummaryRow | null>(null);

  const { data: skillsData, isLoading } = useSWR<{
    skills: SkillSummaryRow[];
  }>(session?.user ? swrKeys.skills.list() : null);

  const editorName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const userInitials = getInitials(editorName);

  const visibleSkills = useMemo(() => {
    const all = skillsData?.skills ?? [];
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (skill) =>
            skill.title.toLowerCase().includes(q) ||
            skill.slug.toLowerCase().includes(q) ||
            (skill.summary?.toLowerCase().includes(q) ?? false)
        )
      : all;

    return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
  }, [limit, searchQuery, skillsData]);

  const totalCount = skillsData?.skills?.length ?? 0;

  return (
    <section id="skills" className="flex flex-col gap-4">
      {title || description ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            {title ? (
              <h2 className="text-lg font-medium tracking-tight">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {showViewAll && totalCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/dashboard/all" />}
            >
              View all ({totalCount})
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          ) : null}
        </div>
      ) : null}

      {showSearch ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your skills..."
              aria-label="Search your skills"
              className="bg-card pl-8"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-xs"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGridIcon />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon-xs"
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
            >
              <ListIcon />
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-44 rounded-[12px]" />
          <Skeleton className="h-44 rounded-[12px]" />
          <Skeleton className="h-44 rounded-[12px]" />
        </div>
      ) : totalCount === 0 ? (
        <Card className="border-dashed py-10 text-center">
          <CardContent className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t created any skills yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/dashboard/skills/new" />}
            >
              <PlusIcon data-icon="inline-start" />
              Create your first skill
            </Button>
          </CardContent>
        </Card>
      ) : visibleSkills.length === 0 ? (
        <Card className="py-8 text-center">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No skills matched &ldquo;{searchQuery}&rdquo;.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSkills.map((skill) => (
            <div
              key={skill.id}
              onMouseEnter={() =>
                void preload(swrKeys.skills.detail(skill.slug), fetcher)
              }
            >
              <SkillCard
                date={`${formatSkillDate(skill.updatedAt)} · ${skill.visibility}`}
                title={skill.title}
                subtitle={skill.summary || `/${skill.slug}`}
                timeLeft={`${skill.subSkillsCount} sub · ${skill.unitsCount} units`}
                bannerImage={skill.bannerImage}
                showHeaderBanner
                members={[
                  {
                    name: editorName,
                    avatar: session?.user?.image ?? undefined,
                    initials: userInitials,
                  },
                ]}
                href={`/dashboard/skills/${skill.slug}`}
                editHref={`/dashboard/skills/${skill.slug}`}
                isOwner
                onDuplicate={async () => {
                  await fetcher(`/api/skills/${skill.slug}/duplicate`, {
                    method: "POST",
                  });
                  await mutate(swrKeys.skills.list());
                }}
                onDelete={async () => {
                  await fetcher(`/api/skills/${skill.slug}`, {
                    method: "DELETE",
                  });
                  await mutate(swrKeys.skills.list());
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-[12px] border border-border bg-card">
          {visibleSkills.map((skill) => (
            <div
              key={skill.id}
              onMouseEnter={() =>
                void preload(swrKeys.skills.detail(skill.slug), fetcher)
              }
              className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              <Link
                href={`/dashboard/skills/${skill.slug}`}
                className="flex min-w-0 flex-1 items-center gap-3.5"
              >
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted/60">
                  {skill.bannerImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={skill.bannerImage}
                        alt={skill.title}
                        className="h-full w-full object-cover"
                      />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-muted/80 via-background to-accent/60 text-muted-foreground">
                      <BookOpenIcon className="size-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {skill.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {skill.summary || `/${skill.slug}`}
                  </p>
                </div>
              </Link>

              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                  {formatSkillDate(skill.updatedAt)} · {skill.visibility}
                </span>
                <Badge
                  variant="secondary"
                  className="font-mono text-xs font-normal"
                >
                  {skill.subSkillsCount} sub · {skill.unitsCount} units
                </Badge>
                <Button
                  variant="outline"
                  size="xs"
                  render={<Link href={`/dashboard/skills/${skill.slug}`} />}
                >
                  Open
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Delete ${skill.title}`}
                  onClick={() => setDeleteTarget(skill)}
                >
                  <Trash2Icon className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete skill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget) return;
                const slugToDelete = deleteTarget.slug;
                setDeleteTarget(null);
                await fetcher(`/api/skills/${slugToDelete}`, {
                  method: "DELETE",
                });
                await mutate(swrKeys.skills.list());
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
