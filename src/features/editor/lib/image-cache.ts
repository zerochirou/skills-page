const IMAGE_CACHE_NAME = "skills-page-content-images-v1";
const IMAGE_CACHE_META_KEY = "skills-page-content-images-meta-v1";
const IMAGE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHED_IMAGES = 60;

interface CacheEntryMeta {
  cachedAt: number;
  lastAccessedAt: number;
}

const objectUrlCache = new Map<string, { url: string; cachedAt: number }>();

function readMetaMap(): Record<string, CacheEntryMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(IMAGE_CACHE_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, CacheEntryMeta>)
      : {};
  } catch {
    return {};
  }
}

function writeMetaMap(meta: Record<string, CacheEntryMeta>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(IMAGE_CACHE_META_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage quota or private browsing errors.
  }
}

function isExpired(cachedAt: number, now = Date.now()): boolean {
  return now - cachedAt > IMAGE_CACHE_TTL_MS;
}

function revokeMemEntry(src: string): void {
  const existing = objectUrlCache.get(src);
  if (existing) {
    URL.revokeObjectURL(existing.url);
    objectUrlCache.delete(src);
  }
}

async function deleteCacheEntry(cache: Cache, src: string): Promise<void> {
  revokeMemEntry(src);
  try {
    await cache.delete(src);
  } catch {
    // Ignore delete errors.
  }
}

async function pruneCache(
  cache: Cache,
  meta: Record<string, CacheEntryMeta>,
  now = Date.now()
): Promise<Record<string, CacheEntryMeta>> {
  const keys = await cache.keys();
  const validUrls = new Set(keys.map((req) => req.url));
  const nextMeta: Record<string, CacheEntryMeta> = {};

  const urlsToDelete: string[] = [];

  for (const [url, entry] of Object.entries(meta)) {
    if (!validUrls.has(url) || isExpired(entry.cachedAt, now)) {
      urlsToDelete.push(url);
    } else {
      nextMeta[url] = entry;
    }
  }

  // Ensure any untracked Cache API entries still get tracked and bounded.
  for (const req of keys) {
    if (!nextMeta[req.url] && !meta[req.url]) {
      nextMeta[req.url] = { cachedAt: now, lastAccessedAt: now };
    }
  }

  const entries = Object.entries(nextMeta);
  if (entries.length > MAX_CACHED_IMAGES) {
    entries.sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt);
    const excess = entries.length - MAX_CACHED_IMAGES;
    for (let i = 0; i < excess; i++) {
      const [urlToEvict] = entries[i];
      urlsToDelete.push(urlToEvict);
      delete nextMeta[urlToEvict];
    }
  }

  if (urlsToDelete.length > 0) {
    await Promise.all(urlsToDelete.map((url) => deleteCacheEntry(cache, url)));
  }

  writeMetaMap(nextMeta);
  return nextMeta;
}

export async function invalidateCachedImageUrl(src: string): Promise<void> {
  if (!src) return;
  revokeMemEntry(src);

  const meta = readMetaMap();
  if (src in meta) {
    delete meta[src];
    writeMetaMap(meta);
  }

  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await window.caches.open(IMAGE_CACHE_NAME);
      await cache.delete(src);
    } catch {
      // Ignore cache errors.
    }
  }
}

export async function getCachedImageUrl(src: string): Promise<string | null> {
  if (!src) return null;

  const now = Date.now();
  const meta = readMetaMap();
  const entryMeta = meta[src];

  if (entryMeta && isExpired(entryMeta.cachedAt, now)) {
    await invalidateCachedImageUrl(src);
    return null;
  }

  const memCached = objectUrlCache.get(src);
  if (memCached) {
    if (isExpired(memCached.cachedAt, now)) {
      await invalidateCachedImageUrl(src);
      return null;
    }
    if (entryMeta) {
      meta[src] = { ...entryMeta, lastAccessedAt: now };
      writeMetaMap(meta);
    }
    return memCached.url;
  }

  if (typeof window === "undefined" || !("caches" in window)) {
    return null;
  }

  try {
    const cache = await window.caches.open(IMAGE_CACHE_NAME);
    const match = await cache.match(src);
    if (!match) return null;

    const cachedAtHeader = match.headers.get("date");
    const fallbackCachedAt = cachedAtHeader
      ? Date.parse(cachedAtHeader) || now
      : now;
    const cachedAt = entryMeta?.cachedAt ?? fallbackCachedAt;

    if (isExpired(cachedAt, now)) {
      await deleteCacheEntry(cache, src);
      delete meta[src];
      writeMetaMap(meta);
      return null;
    }

    const blob = await match.blob();
    const objectUrl = URL.createObjectURL(blob);
    objectUrlCache.set(src, { url: objectUrl, cachedAt });

    meta[src] = { cachedAt, lastAccessedAt: now };
    writeMetaMap(meta);
    return objectUrl;
  } catch {
    return null;
  }
}

export async function fetchAndCacheImageUrl(
  src: string,
  options?: { forceRefresh?: boolean }
): Promise<{
  url: string;
  cached: boolean;
}> {
  if (options?.forceRefresh) {
    await invalidateCachedImageUrl(src);
  } else {
    const existing = await getCachedImageUrl(src);
    if (existing) {
      return { url: existing, cached: true };
    }
  }

  try {
    const response = await fetch(src, {
      mode: "cors",
      cache: options?.forceRefresh ? "reload" : "default",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const now = Date.now();
    if (typeof window !== "undefined" && "caches" in window) {
      try {
        const cache = await window.caches.open(IMAGE_CACHE_NAME);
        await cache.put(src, response.clone());
        const meta = readMetaMap();
        meta[src] = { cachedAt: now, lastAccessedAt: now };
        await pruneCache(cache, meta, now);
      } catch {
        // Ignore storage quota or private browsing cache errors.
      }
    }

    const blob = await response.blob();
    revokeMemEntry(src);
    const objectUrl = URL.createObjectURL(blob);
    objectUrlCache.set(src, { url: objectUrl, cachedAt: now });
    return { url: objectUrl, cached: true };
  } catch (err) {
    // Fallback to direct URL if CORS blocks fetch() on third-party hosts,
    // while still failing on explicit HTTP status errors.
    if (err instanceof Error && err.message.startsWith("HTTP ")) {
      throw err;
    }
    return { url: src, cached: false };
  }
}
