import { getSiteUrl, SITE_ALTERNATE_NAMES, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}

export function buildWebsiteJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: SITE_NAME,
    alternateName: [...SITE_ALTERNATE_NAMES],
    url: siteUrl,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/skills?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildWebApplicationJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${siteUrl}/#webapp`,
    name: SITE_NAME,
    alternateName: [...SITE_ALTERNATE_NAMES],
    url: siteUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    description: SITE_DESCRIPTION,
    featureList: [
      "Structured skill repositories with sub-skills and modular units",
      "Markdown editor with live LaTeX and MathQuill equation editing",
      "Interactive Mermaid diagram rendering",
      "Internal @ and [[ wiki-link cross-referencing",
      "Compressed image uploads and public creator profiles",
    ],
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.path.startsWith("http") ? item.path : `${siteUrl}${item.path}`,
    })),
  };
}

export function buildSkillJsonLd(input: {
  title: string;
  description: string;
  path: string;
  authorName: string;
  authorUsername?: string | null;
  datePublished: string;
  dateModified: string;
  subSkillsCount: number;
  unitsCount: number;
  imageUrl?: string | null;
}) {
  const siteUrl = getSiteUrl();
  const fullUrl = `${siteUrl}${input.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "@id": fullUrl,
    name: input.title,
    headline: input.title,
    description: input.description,
    url: fullUrl,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    inLanguage: "en",
    learningResourceType: "Technical skill repository",
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    author: {
      "@type": "Person",
      name: input.authorName,
      ...(input.authorUsername ? { url: `${siteUrl}/${encodeURIComponent(input.authorUsername)}` } : {}),
    },
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: siteUrl,
    },
    numberOfItems: input.unitsCount,
    educationalLevel: "Technical",
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "subSkillsCount",
        value: input.subSkillsCount,
      },
      {
        "@type": "PropertyValue",
        name: "unitsCount",
        value: input.unitsCount,
      },
    ],
  };
}

export function buildUnitJsonLd(input: {
  title: string;
  description: string;
  path: string;
  skillTitle: string;
  skillPath: string;
  authorName: string;
  authorUsername?: string | null;
  datePublished: string;
  dateModified: string;
  estimatedMinutes?: number | null;
}) {
  const siteUrl = getSiteUrl();
  const fullUrl = `${siteUrl}${input.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": fullUrl,
    headline: input.title,
    name: input.title,
    description: input.description,
    url: fullUrl,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    inLanguage: "en",
    ...(input.estimatedMinutes ? { timeRequired: `PT${input.estimatedMinutes}M` } : {}),
    author: {
      "@type": "Person",
      name: input.authorName,
      ...(input.authorUsername ? { url: `${siteUrl}/${encodeURIComponent(input.authorUsername)}` } : {}),
    },
    isPartOf: {
      "@type": "LearningResource",
      name: input.skillTitle,
      url: `${siteUrl}${input.skillPath}`,
    },
  };
}

export function buildProfileJsonLd(input: {
  name: string;
  username: string;
  bio?: string | null;
  website?: string | null;
  avatarImage?: string | null;
}) {
  const siteUrl = getSiteUrl();
  const profileUrl = `${siteUrl}/${encodeURIComponent(input.username)}`;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: profileUrl,
    mainEntity: {
      "@type": "Person",
      name: input.name,
      alternateName: `@${input.username}`,
      url: profileUrl,
      ...(input.bio ? { description: input.bio } : {}),
      ...(input.avatarImage ? { image: input.avatarImage } : {}),
      ...(input.website ? { sameAs: [input.website] } : {}),
    },
  };
}
