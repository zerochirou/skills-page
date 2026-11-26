import type { Metadata } from "next";
import { Suspense } from "react";
import { buildBreadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { HomeTemplate } from "@/features/home/components/home-template";
import { createMetadata } from "@/lib/seo";
import { SkillsDirectoryFilters } from "@/features/skills/components/skills-directory-filters";
import { queryPublicSkills } from "@/features/skills/services/leaderboard.service";
import { SkillCard } from "@/components/ui/skill-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = createMetadata({
  title: "Explore Skills",
  description:
    "Search and filter public technical skills, Markdown repositories, sub-skills, and learning units on Skills Page.",
  path: "/skills",
  markdownUrl: "/llms.txt",
  keywords: ["explore skills", "public skill directory", "skills page directory"],
});

const PAGE_SIZE = 12;

function buildPageHref(
  page: number,
  params: { q: string; username: string; sort: string }
) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.username) sp.set("username", params.username);
  if (params.sort && params.sort !== "stars") sp.set("sort", params.sort);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/skills?${qs}` : "/skills";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function SkillsDirectoryContent({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    username?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const query = sp.q?.trim() ?? "";
  const username = sp.username?.trim() ?? "";
  const sort =
    sp.sort === "newest" || sp.sort === "oldest" ? sp.sort : "stars";
  const currentPage = Math.max(Number(sp.page) || 1, 1);

  const { skills, totalCount } = await queryPublicSkills({
    query,
    username,
    sort,
    page: currentPage,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);

  return (
    <div className="flex flex-col gap-8">
      <SkillsDirectoryFilters
        initialQuery={query}
        initialUsername={username}
        initialSort={sort}
      />

      {skills.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No skills found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search query, username filter, or sort order.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => {
            const ownerHandle = skill.ownerUsername ?? skill.ownerName;
            return (
              <SkillCard
                key={skill.id}
                href={
                  skill.ownerUsername
                    ? `/skills/${encodeURIComponent(skill.ownerUsername)}/${encodeURIComponent(skill.slug)}`
                    : `/skills/${encodeURIComponent(skill.slug)}`
                }
                date={formatDate(skill.updatedAt)}
                title={skill.title}
                subtitle={`${ownerHandle}/${skill.slug}`}
                members={[
                  {
                    name: skill.ownerName,
                    avatar: skill.ownerImage ?? undefined,
                    initials: skill.ownerName.slice(0, 2).toUpperCase(),
                  },
                ]}
                timeLeft={`${skill.unitsCount} ${
                  skill.unitsCount === 1 ? "unit" : "units"
                }`}
              />
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            {currentPage > 1 ? (
              <PaginationItem>
                <PaginationPrevious
                  href={buildPageHref(currentPage - 1, {
                    q: query,
                    username,
                    sort,
                  })}
                />
              </PaginationItem>
            ) : null}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href={buildPageHref(p, { q: query, username, sort })}
                  isActive={p === currentPage}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}

            {currentPage < totalPages ? (
              <PaginationItem>
                <PaginationNext
                  href={buildPageHref(currentPage + 1, {
                    q: query,
                    username,
                    sort,
                  })}
                />
              </PaginationItem>
            ) : null}
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}

export default function SkillsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    username?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  return (
    <HomeTemplate>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Skills Page", path: "/" },
          { name: "Explore Skills", path: "/skills" },
        ])}
      />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-8">
          <h1 className="font-serif text-4xl font-normal tracking-tight text-primary">
            Explore Skills
          </h1>
          <p className="mt-2 text-sm text-body">
            Search and filter all public skills by keyword, username, or date.
          </p>
        </header>

        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-44 rounded-[12px]" />
              <Skeleton className="h-44 rounded-[12px]" />
              <Skeleton className="h-44 rounded-[12px]" />
            </div>
          }
        >
          <SkillsDirectoryContent searchParams={searchParams} />
        </Suspense>
      </main>
    </HomeTemplate>
  );
}
