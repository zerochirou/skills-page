import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import { createCloudflareCacheLayer } from "./src/lib/open-next/cache-api-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: () => createCloudflareCacheLayer().incrementalCache,
  tagCache: () => createCloudflareCacheLayer().tagCache,
  queue: "direct",
  enableCacheInterception: true,
  routePreloadingBehavior: "none",
});
