import type { MetadataRoute } from "next";
import { DONATION_ENABLED } from "@/features/donation/config";
import { getSiteUrl } from "@/lib/seo";

const PRIVATE_PATHS = [
  "/dashboard",
  "/dashboard/",
  "/onboarding",
  "/signin",
  "/signup",
  "/api/auth/",
  "/api/images/",
  "/api/user/",
  ...(!DONATION_ENABLED ? ["/donation"] : []),
];

const PUBLIC_PATHS = [
  "/",
  "/skills",
  "/about",
  "/how-to-use",
  ...(DONATION_ENABLED ? ["/donation"] : []),
  "/learn/demo",
  "/llms.txt",
  "/llms-full.txt",
  "/api/og",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: PUBLIC_PATHS,
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: [
          "Googlebot",
          "Google-Extended",
          "Bingbot",
          "Applebot",
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "anthropic-ai",
          "PerplexityBot",
        ],
        allow: PUBLIC_PATHS,
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
