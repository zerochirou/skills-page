"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpenIcon,
  BookTextIcon,
  CompassIcon,
  FileCode2Icon,
  FilePlus2Icon,
  FolderGit2Icon,
  InfoIcon,
  LayoutGridIcon,
  SearchIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { LeaderboardSkill } from "@/features/skills/services/leaderboard.service";

export const READING_HISTORY_KEY = "skills-page:reading-history";

const INTRO_VIDEOS = [
  "/assets/videos/flower.mp4",
  "/assets/videos/math.mp4",
] as const;

export interface ReadingHistoryItem {
  title: string;
  href: string;
  subtitle?: string;
  visitedAt: string;
}

const PRIMARY_SIDEBAR_LINKS = [
  { label: "Explore Skills", href: "/skills", icon: CompassIcon },
  { label: "Create Skill", href: "/dashboard/skills/new", icon: FilePlus2Icon },
  { label: "How to Use", href: "/how-to-use", icon: BookOpenIcon },
] as const;

const SECONDARY_SIDEBAR_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGridIcon },
  { label: "All Skills", href: "/dashboard/all", icon: FolderGit2Icon },
  { label: "About", href: "/about", icon: InfoIcon },
  { label: "Reading Demo", href: "/learn/demo", icon: BookTextIcon },
  { label: "LLMs Index", href: "/llms.txt", icon: FileCode2Icon },
] as const;

function formatRelativeAge(iso: string): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "";
  const diffMin = Math.max(1, Math.floor((Date.now() - timestamp) / 60_000));
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

const emptySubscribe = () => () => {};

function getStoredHistorySnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return window.localStorage.getItem(READING_HISTORY_KEY) || "[]";
  } catch {
    return "[]";
  }
}

function parseStoredHistory(raw: string): ReadingHistoryItem[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is ReadingHistoryItem =>
          Boolean(item) &&
          typeof item.title === "string" &&
          typeof item.href === "string" &&
          typeof item.visitedAt === "string"
      )
      .slice(0, 4);
  } catch {
    return [];
  }
}

export function EditorialHero({
  recentSkills = [],
}: {
  recentSkills?: LeaderboardSkill[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [videoIndex, setVideoIndex] = useState(0);

  const historyRaw = useSyncExternalStore(
    emptySubscribe,
    getStoredHistorySnapshot,
    () => "[]"
  );
  const historyItems = useMemo(() => parseStoredHistory(historyRaw), [historyRaw]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    router.push(trimmed ? `/skills?q=${encodeURIComponent(trimmed)}` : "/skills");
  }

  const timelineItems =
    historyItems.length > 0
      ? historyItems.map((item) => ({
          title: item.title,
          href: item.href,
          age: formatRelativeAge(item.visitedAt),
        }))
      : recentSkills.slice(0, 4).map((skill) => ({
          title: skill.title,
          href: skill.ownerUsername
            ? `/skills/${encodeURIComponent(skill.ownerUsername)}/${encodeURIComponent(skill.slug)}`
            : `/skills/${encodeURIComponent(skill.slug)}`,
          age: formatRelativeAge(skill.updatedAt),
        }));

  const timelineHeading =
    historyItems.length > 0 ? "Your history" : "Recent skills";

  return (
    <section
      aria-label="Skills Page overview"
      className="border-b border-hairline bg-canvas"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
          {/* Left main editorial column */}
          <div className="flex flex-col items-center py-8 text-center sm:py-10 lg:items-start lg:py-12 lg:pr-10 lg:text-left">
            <h1 className="font-serif text-4xl font-normal leading-[1.08] tracking-[-0.02em] text-primary sm:text-5xl lg:text-[52px]">
              Skills Page
            </h1>
            <p className="mx-auto mt-3 max-w-xl font-serif text-lg leading-snug text-body sm:text-[19px] lg:mx-0">
              Knowledge becomes clearer when it has structure. Organize
              technical skills, Markdown units, equations, and diagrams in one
              living repository.
            </p>

            {/* Video showcase */}
            <div className="relative mx-auto mt-7 aspect-video w-full max-w-3xl overflow-hidden rounded-[16px] border border-hairline bg-[#111010] lg:mx-0 lg:max-w-none lg:rounded-[12px]">
              <video
                key={INTRO_VIDEOS[videoIndex]}
                src={INTRO_VIDEOS[videoIndex]}
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={() =>
                  setVideoIndex((prev) => (prev + 1) % INTRO_VIDEOS.length)
                }
                aria-label="Skills Page intro video"
                className="size-full object-cover grayscale"
              />
            </div>

            {/* Mobile centered summary */}
            <p className="mx-auto mt-7 max-w-xl text-sm leading-relaxed text-body lg:hidden">
              Skills Page is an open repository workspace built for organizing
              technical notes, sub-skills, and reusable learning units in a
              clean hierarchy. Author documents in Markdown with interactive
              MathQuill equations, Mermaid diagrams, and{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-primary">
                @
              </code>{" "}
              wiki-links.
            </p>

            {/* Desktop 3-column editorial summary */}
            <div className="mt-8 hidden gap-6 text-sm leading-relaxed text-body lg:grid lg:grid-cols-3">
              <p>
                Skills Page is an open repository workspace built for
                organizing technical notes, sub-skills, and reusable learning
                units in a clean hierarchy.
              </p>
              <p>
                Author documents in Markdown with interactive MathQuill
                equations, Mermaid diagrams, ImageKit media compression, and{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-primary">
                  @
                </code>{" "}
                wiki-links.
              </p>
              <p>
                Publish public repositories to your creator profile or maintain
                private working drafts inside your personal workspace.
              </p>
            </div>
          </div>

          {/* Right editorial utility sidebar */}
          <aside
            aria-label="Workspace shortcuts and reading history"
            className="flex flex-col gap-5 border-t border-hairline py-8 lg:border-t-0 lg:border-l lg:py-12 lg:pl-8"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search skills"
                className="h-10 border-hairline bg-surface-card pr-9 text-sm"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-primary"
              >
                <SearchIcon className="size-4" />
              </button>
            </form>

            <nav aria-label="Quick actions" className="flex flex-col gap-0.5">
              {PRIMARY_SIDEBAR_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-[42px] items-center gap-3 rounded-md px-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
                  >
                    <Icon className="size-4 shrink-0 text-body" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <Separator />

            <nav
              aria-label="Platform sections"
              className="flex flex-col gap-0.5"
            >
              {SECONDARY_SIDEBAR_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-[40px] items-center gap-3 rounded-md px-2 text-sm text-primary transition-colors hover:bg-accent"
                  >
                    <Icon className="size-4 shrink-0 text-body" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <Separator />

            <div className="flex flex-col gap-3">
              <h2 className="px-2 text-xs font-semibold text-primary">
                {timelineHeading}
              </h2>

              {timelineItems.length === 0 ? (
                <p className="px-2 text-xs leading-relaxed text-muted-foreground">
                  Open a public skill below to build your reading timeline.
                </p>
              ) : (
                <ol className="flex flex-col gap-3 px-2">
                  {timelineItems.map((entry, idx) => (
                    <li
                      key={entry.href + idx}
                      className="relative flex items-start gap-3 text-xs"
                    >
                      <span className="w-6 shrink-0 pt-0.5 font-mono text-[11px] text-muted-foreground tabular-nums">
                        {idx === 0 ? (
                          <span
                            aria-hidden="true"
                            className="mt-1 inline-block size-1.5 rounded-full bg-hairline-strong"
                          />
                        ) : (
                          entry.age || "•"
                        )}
                      </span>
                      <Link
                        href={entry.href}
                        className="line-clamp-2 text-sm leading-snug text-body transition-colors hover:text-primary hover:underline"
                      >
                        {entry.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
