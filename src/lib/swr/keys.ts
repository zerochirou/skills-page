/**
 * Centralized SWR cache key factory for deterministic caching and mutation.
 */
export const swrKeys = {
  user: {
    session: () => ["auth", "session"] as const,
    profile: () => "/api/user/profile" as const,
  },
  dashboard: {
    overview: () => "/api/dashboard/overview" as const,
  },
  skills: {
    leaderboard: (query?: string) => {
      const trimmed = query?.trim();
      if (!trimmed) return "/api/skills/leaderboard" as const;
      const search = new URLSearchParams({ q: trimmed });
      return `/api/skills/leaderboard?${search.toString()}` as const;
    },
    publicUnit: (owner: string, slug: string, unitId: number) =>
      `/api/skills/public/${encodeURIComponent(owner)}/${encodeURIComponent(slug)}/units/${unitId}` as const,
    list: (params?: { filter?: string; query?: string }) => {
      const search = new URLSearchParams();
      if (params?.filter) search.set("filter", params.filter);
      if (params?.query) search.set("query", params.query);
      const qs = search.toString();
      return qs ? (`/api/skills?${qs}` as const) : ("/api/skills" as const);
    },
    detail: (slug: string) => `/api/skills/${slug}` as const,
    unit: (slug: string, unitId: number) =>
      `/api/skills/${slug}/units/${unitId}` as const,
  },
} as const;
