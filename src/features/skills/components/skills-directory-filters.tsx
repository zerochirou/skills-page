"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, UserIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SkillsDirectoryFiltersProps {
  initialQuery: string;
  initialUsername: string;
  initialSort: "stars" | "newest" | "oldest";
}

export function SkillsDirectoryFilters({
  initialQuery,
  initialUsername,
  initialSort,
}: SkillsDirectoryFiltersProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [username, setUsername] = useState(initialUsername);
  const [sort, setSort] = useState<"stars" | "newest" | "oldest">(initialSort);

  function applyFilters(next: {
    q?: string;
    username?: string;
    sort?: "stars" | "newest" | "oldest";
  }) {
    const params = new URLSearchParams();
    const nextQ = (next.q ?? query).trim();
    const nextUser = (next.username ?? username).trim();
    const nextSort = next.sort ?? sort;

    if (nextQ) params.set("q", nextQ);
    if (nextUser) params.set("username", nextUser);
    if (nextSort !== "stars") params.set("sort", nextSort);

    const qs = params.toString();
    router.push(qs ? `/skills?${qs}` : "/skills");
  }

  function handleReset() {
    setQuery("");
    setUsername("");
    setSort("stars");
    router.push("/skills");
  }

  const hasFilters = Boolean(query.trim() || username.trim() || sort !== "stars");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        applyFilters({});
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills by title, slug, or summary..."
          aria-label="Search skills"
          className="bg-card pl-9"
        />
      </div>

      <div className="relative w-full sm:w-48">
        <UserIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Filter by username"
          aria-label="Filter by username"
          className="bg-card pl-9"
        />
      </div>

      <Select
        value={sort}
        onValueChange={(val) => {
          const nextSort = val as "stars" | "newest" | "oldest";
          setSort(nextSort);
          applyFilters({ sort: nextSort });
        }}
      >
        <SelectTrigger className="w-full bg-card sm:w-40" aria-label="Sort skills">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="stars">Most Stars</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm">
          Search
        </Button>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            aria-label="Reset filters"
          >
            <XIcon data-icon="inline-start" />
            Reset
          </Button>
        ) : null}
      </div>
    </form>
  );
}
