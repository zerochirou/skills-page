import type { SWRConfiguration } from "swr";
import { ApiError, fetcher } from "./fetcher";

/**
 * Default SWR configuration tuned for Cloudflare Workers + D1:
 * - Disables focus revalidation to avoid bursty D1 reads on tab switches.
 * - Deduplicates identical concurrent/mounted requests for 10s.
 * - Skips retries on 4xx client/auth errors so unauthorized states fail fast.
 */
export const dashboardSwrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  dedupingInterval: 10_000,
  focusThrottleInterval: 30_000,
  keepPreviousData: true,
  errorRetryCount: 2,
  errorRetryInterval: 3_000,
  shouldRetryOnError: (error: unknown) => {
    if (error instanceof ApiError) {
      return error.status >= 500;
    }
    return true;
  },
};
