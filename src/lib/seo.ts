import type { Metadata } from "next";

export const SITE_NAME = "Skills Page";
export const SITE_ALTERNATE_NAMES = [
  "skills page",
  "skills-page",
  "SkillsPage",
] as const;
export const SITE_TAGLINE =
  "Structured Technical Skills & Learning Repositories";
export const SITE_DESCRIPTION =
  "Skills Page is an editorial repository workspace to write, organize, and share structured technical skills, sub-skills, Markdown learning units, equations, and diagrams.";

export const SITE_KEYWORDS = [
  "skills page",
  "skills-page",
  "technical skills repository",
  "markdown knowledge base",
  "structured learning units",
  "mathquill equations",
  "developer documentation workspace",
];

export function getSiteUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.BETTER_AUTH_URL &&
    !process.env.BETTER_AUTH_URL.includes("localhost")
      ? process.env.BETTER_AUTH_URL
      : "");

  const raw = envUrl || "https://skills.zerochirou.com";

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/+$/, "");
  }

  return `https://${raw.replace(/\/+$/, "")}`;
}

export function getSiteHost(): string {
  try {
    return new URL(getSiteUrl()).hostname;
  } catch {
    return "skills.zerochirou.com";
  }
}

export type OgKind = "default" | "skill" | "unit" | "profile";

export interface OgImageParams {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  kind?: OgKind;
}

export function buildOgImageUrl({
  title,
  subtitle,
  eyebrow,
  kind = "default",
}: OgImageParams): string {
  const params = new URLSearchParams();
  params.set("title", title.slice(0, 110));
  if (subtitle) {
    params.set("subtitle", subtitle.slice(0, 180));
  }
  if (eyebrow) {
    params.set("eyebrow", eyebrow.slice(0, 60));
  }
  if (kind !== "default") {
    params.set("kind", kind);
  }
  return `/api/og?${params.toString()}`;
}

export interface CreateMetadataInput {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
  markdownUrl?: string;
  og?: Partial<OgImageParams>;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
}

export function createMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
  keywords,
  markdownUrl,
  og,
  type = "website",
  noIndex = false,
}: CreateMetadataInput): Metadata {
  const ogImageUrl = buildOgImageUrl({
    title: og?.title ?? title,
    subtitle: og?.subtitle ?? description,
    eyebrow: og?.eyebrow,
    kind: og?.kind ?? "default",
  });

  const images = [
    {
      url: ogImageUrl,
      width: 1200,
      height: 630,
      alt: og?.title ?? title,
    },
  ];

  const mergedKeywords = keywords
    ? Array.from(new Set([...SITE_KEYWORDS, ...keywords]))
    : SITE_KEYWORDS;

  return {
    title,
    description,
    keywords: mergedKeywords,
    ...(path || markdownUrl
      ? {
          alternates: {
            ...(path ? { canonical: path } : {}),
            ...(markdownUrl
              ? {
                  types: {
                    "text/markdown": markdownUrl,
                  },
                }
              : {}),
          },
        }
      : {}),
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type,
      ...(path ? { url: path } : {}),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}
