import type { Metadata } from "next";

export const SITE_NAME = "Skills Page";
export const SITE_TAGLINE = "Structured Technical Skills & Learning Repositories";
export const SITE_DESCRIPTION =
  "Discover, author, and share structured technical skills, modular learning units, and curated engineering repositories.";

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://skills.page";

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/+$/, "");
  }

  return `https://${raw.replace(/\/+$/, "")}`;
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
  og?: Partial<OgImageParams>;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
}

export function createMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
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

  return {
    title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
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
