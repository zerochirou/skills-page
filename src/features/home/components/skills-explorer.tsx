"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillCard } from "@/components/ui/skill-card";
import { authClient } from "@/features/auth/lib/auth-client";
import type {
  LeaderboardResult,
  LeaderboardSkill,
} from "@/features/skills/services/leaderboard.service";
import { dashboardSwrConfig, fetcher, swrKeys } from "@/lib/swr";

const DISABLED_FILTER_TABS = [
  { key: "all", label: "All Time" },
  { key: "trending", label: "Trending (24h)" },
  { key: "hot", label: "Hot" },
] as const;

const SEARCH_DEBOUNCE_MS = 250;

function formatSkillDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function SkillCardSkeleton() {
  return (
    <div className="flex flex-col gap-5 rounded-[12px] border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="size-7 rounded-md" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <div className="flex items-center -space-x-2">
          <Skeleton className="size-7 rounded-full" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkillsExplorerSkeleton() {
  return (
    <section aria-label="Skills leaderboard" className="mb-16">
      <h2 className="font-serif text-2xl font-normal tracking-tight text-primary sm:text-3xl">
        Skills Leaderboard
      </h2>
      <Skeleton className="mt-4 h-10 w-full rounded-md" />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {DISABLED_FILTER_TABS.map((tab) => (
          <Skeleton key={tab.key} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkillCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export interface SkillsExplorerProps {
  initialSkills: LeaderboardSkill[];
  totalCount: number;
}

export function SkillsExplorer({
  initialSkills,
  totalCount,
}: SkillsExplorerProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const trimmedQuery = query.trim();
  const swrKey = debouncedQuery
    ? swrKeys.skills.leaderboard(debouncedQuery)
    : null;

  const { data, error, isLoading, mutate } = useSWR<LeaderboardResult>(
    swrKey,
    fetcher,
    {
      ...dashboardSwrConfig,
      dedupingInterval: 30_000,
    }
  );

  const isSearching =
    trimmedQuery.length > 0 &&
    (trimmedQuery !== debouncedQuery || isLoading);

  const displayedSkills = debouncedQuery
    ? (data?.skills ?? [])
    : initialSkills;

  return (
    <section aria-label="Skills leaderboard" className="mb-16">
      <h2 className="font-serif text-2xl font-normal tracking-tight text-primary sm:text-3xl">
        Skills Leaderboard
      </h2>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills..."
          aria-label="Search skills"
          className="h-10 bg-card pr-10 pl-9 text-sm"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          /
        </kbd>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {DISABLED_FILTER_TABS.map((tab) => {
          const label =
            tab.key === "all" ? `${tab.label} (${totalCount})` : tab.label;
          return (
            <Button
              key={tab.key}
              type="button"
              size="sm"
              variant={tab.key === "all" ? "default" : "outline"}
              disabled
              aria-disabled="true"
              className="h-7 cursor-not-allowed rounded-full px-3 text-xs opacity-60"
            >
              {label}
            </Button>
          );
        })}
      </div>

      <div className="mt-6">
        {isSearching ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkillCardSkeleton key={i} />
            ))}
          </div>
        ) : error && debouncedQuery ? (
          <div className="flex flex-col items-center gap-3 rounded-[12px] border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to search skills. Please try again.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void mutate()}
            >
              Retry
            </Button>
          </div>
        ) : displayedSkills.length === 0 ? (
          <div className="rounded-[12px] border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {debouncedQuery
                ? `No skills found for "${query}".`
                : "No public skills published yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {displayedSkills.map((skill) => {
              const isOwner = Boolean(
                session?.user?.id && session.user.id === skill.ownerId
              );
              const authorQuery = skill.ownerUsername || skill.ownerName;

              return (
                <SkillCard
                  key={skill.id}
                  date={formatSkillDate(skill.updatedAt)}
                  title={skill.title}
                  subtitle={
                    skill.ownerUsername
                      ? `${skill.ownerUsername}/${skill.slug}`
                      : `${skill.ownerName}/${skill.slug}`
                  }
                  timeLeft={`${skill.unitsCount} ${
                    skill.unitsCount === 1 ? "unit" : "units"
                  }`}
                  members={[
                    {
                      name: skill.ownerName,
                      avatar: skill.ownerImage ?? undefined,
                      initials: getInitials(skill.ownerName),
                    },
                  ]}
                  href={
                    skill.ownerUsername
                      ? `/skills/${encodeURIComponent(skill.ownerUsername)}/${encodeURIComponent(skill.slug)}`
                      : `/skills/${encodeURIComponent(skill.slug)}`
                  }
                  editHref={`/dashboard/skills/${encodeURIComponent(skill.slug)}`}
                  isOwner={isOwner}
                  onDuplicate={
                    isOwner
                      ? async () => {
                          await fetcher(
                            `/api/skills/${encodeURIComponent(skill.slug)}/duplicate`,
                            { method: "POST" }
                          );
                          await mutate();
                          router.refresh();
                        }
                      : undefined
                  }
                  onDelete={
                    isOwner
                      ? async () => {
                          await fetcher(
                            `/api/skills/${encodeURIComponent(skill.slug)}`,
                            { method: "DELETE" }
                          );
                          await mutate();
                          router.refresh();
                        }
                      : undefined
                  }
                  onSeeAuthor={() => setQuery(authorQuery)}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
