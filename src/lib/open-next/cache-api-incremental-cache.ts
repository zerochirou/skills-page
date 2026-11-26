import type { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";
import { FALLBACK_BUILD_ID } from "@opennextjs/cloudflare/overrides/internal";

type CloudflareOverrides = NonNullable<
  Parameters<typeof defineCloudflareConfig>[0]
>;
type IncrementalCache = Exclude<
  NonNullable<CloudflareOverrides["incrementalCache"]>,
  "dummy" | ((...args: never[]) => unknown)
>;
type TagCache = Exclude<
  NonNullable<CloudflareOverrides["tagCache"]>,
  "dummy" | ((...args: never[]) => unknown)
>;
type NextModeTagCache = Extract<TagCache, { mode: "nextMode" }>;
type NextModeTagCacheWriteInput = Parameters<
  NextModeTagCache["writeTags"]
>[0][number];

const ISR_CACHE_NAME = "skills-page-isr-v1";
const TAG_CACHE_NAME = "skills-page-tags-v1";
const DEFAULT_ISR_TTL_SEC = 60 * 30;
const TAG_TTL_SEC = 60 * 60 * 24;

type TagValue = {
  revalidatedAt: number;
  stale: number | null;
  expire: number | null;
};

function getCacheUrl(prefix: string, key: string, suffix: string): string | null {
  const buildId = process.env.OPEN_NEXT_BUILD_ID ?? FALLBACK_BUILD_ID;
  const segments = `/${prefix}/${buildId}/${key}.${suffix}`
    .replace(/\/+/g, "/")
    .split("/");
  if (segments.some((segment) => segment === "." || segment === "..")) {
    return null;
  }
  return `https://cache.local${segments.map(encodeURIComponent).join("/")}`;
}

/**
 * Cloudflare Cache API backed IncrementalCache with Static Assets fallback.
 * Keeps name `cf-static-assets-incremental-cache` so `opennextjs-cloudflare build`
 * populates prerendered build entries into static assets without extra KV/R2 bindings.
 */
export function createCloudflareCacheLayer(): {
  incrementalCache: IncrementalCache;
  tagCache: NextModeTagCache;
} {
  let isrCachePromise: Promise<Cache> | undefined;
  let tagCachePromise: Promise<Cache> | undefined;

  const getIsrCache = () => {
    if (typeof caches === "undefined") return undefined;
    isrCachePromise ??= caches.open(ISR_CACHE_NAME);
    return isrCachePromise;
  };

  const getTagCache = () => {
    if (typeof caches === "undefined") return undefined;
    tagCachePromise ??= caches.open(TAG_CACHE_NAME);
    return tagCachePromise;
  };

  const incrementalCache: IncrementalCache = {
    name: staticAssetsIncrementalCache.name,

    async get(key, cacheType) {
      const effectiveType = cacheType ?? "cache";
      const readStaticFallback = () =>
        staticAssetsIncrementalCache.get(key, cacheType);
      try {
        const cache = await getIsrCache();
        const url = getCacheUrl("isr", key, effectiveType);
        if (cache && url) {
          const hit = await cache.match(url);
          if (hit) {
            return (await hit.json()) as Awaited<
              ReturnType<typeof readStaticFallback>
            >;
          }
        }
      } catch {
        // Fall through to static assets fallback
      }
      if (effectiveType === "composable") {
        return null;
      }
      return readStaticFallback();
    },

    async set(key, value, cacheType) {
      const effectiveType = cacheType ?? "cache";
      try {
        const cache = await getIsrCache();
        const url = getCacheUrl("isr", key, effectiveType);
        if (!cache || !url) return;

        const revalidate =
          typeof value === "object" &&
          value !== null &&
          "revalidate" in value &&
          typeof value.revalidate === "number"
            ? value.revalidate
            : undefined;

        const ttl =
          typeof revalidate === "number" && revalidate > 0
            ? revalidate
            : DEFAULT_ISR_TTL_SEC;

        const payload = {
          value,
          lastModified: Date.now(),
        };

        await cache.put(
          url,
          new Response(JSON.stringify(payload), {
            headers: {
              "content-type": "application/json",
              "cache-control": `public, max-age=${ttl}`,
            },
          })
        );
      } catch {
        // Ignore transient Cache API write errors
      }
    },

    async delete(key) {
      try {
        const cache = await getIsrCache();
        if (!cache) return;
        await Promise.all(
          (["cache", "fetch", "composable"] as const).map((type) => {
            const url = getCacheUrl("isr", key, type);
            return url ? cache.delete(url) : Promise.resolve(false);
          })
        );
      } catch {
        // Ignore delete failures
      }
    },
  };

  const readTags = async (tags: string[]): Promise<Map<string, TagValue | null>> => {
    const map = new Map<string, TagValue | null>();
    const cache = await getTagCache();
    if (!cache || tags.length === 0) return map;

    await Promise.all(
      tags.map(async (tag) => {
        const url = getCacheUrl("tag", tag, "json");
        if (!url) {
          map.set(tag, null);
          return;
        }
        try {
          const hit = await cache.match(url);
          if (!hit) {
            map.set(tag, null);
            return;
          }
          map.set(tag, (await hit.json()) as TagValue);
        } catch {
          map.set(tag, null);
        }
      })
    );
    return map;
  };

  const tagCache: NextModeTagCache = {
    mode: "nextMode",
    name: "cf-cache-api-tag-cache",

    async getLastRevalidated(tags: string[]): Promise<number> {
      if (tags.length === 0) return 0;
      const values = await readTags(tags);
      let latest = 0;
      for (const value of values.values()) {
        if (value && value.revalidatedAt > latest) {
          latest = value.revalidatedAt;
        }
      }
      return latest;
    },

    async hasBeenRevalidated(tags: string[], lastModified?: number): Promise<boolean> {
      if (tags.length === 0) return false;
      const now = Date.now();
      const values = await readTags(tags);
      for (const value of values.values()) {
        if (!value) continue;
        if (value.expire != null) {
          if (value.expire <= now && value.expire > (lastModified ?? 0)) {
            return true;
          }
          continue;
        }
        if (value.revalidatedAt > (lastModified ?? now)) {
          return true;
        }
      }
      return false;
    },

    async isStale(tags: string[], lastModified?: number): Promise<boolean> {
      if (tags.length === 0) return false;
      const now = Date.now();
      const values = await readTags(tags);
      const lastModifiedOrNow = lastModified ?? now;
      for (const value of values.values()) {
        if (!value) continue;
        const { revalidatedAt, stale, expire } = value;
        const inStaleWindow =
          stale != null &&
          revalidatedAt > lastModifiedOrNow &&
          lastModifiedOrNow <= stale;
        if (inStaleWindow && (expire == null || expire > now)) {
          return true;
        }
      }
      return false;
    },

    async writeTags(tags: NextModeTagCacheWriteInput[]): Promise<void> {
      const cache = await getTagCache();
      if (!cache || tags.length === 0) return;

      const nowMs = Date.now();
      await Promise.all(
        tags.map(async (entry) => {
          const tagStr = typeof entry === "string" ? entry : entry.tag;
          const stale = typeof entry === "string" ? nowMs : (entry.stale ?? nowMs);
          const expire = typeof entry === "string" ? null : (entry.expire ?? null);
          const url = getCacheUrl("tag", tagStr, "json");
          if (!url) return;

          const payload: TagValue = {
            revalidatedAt: nowMs,
            stale,
            expire,
          };
          await cache.put(
            url,
            new Response(JSON.stringify(payload), {
              headers: {
                "content-type": "application/json",
                "cache-control": `public, max-age=${TAG_TTL_SEC}`,
              },
            })
          );
        })
      );
    },
  };

  return { incrementalCache, tagCache };
}
