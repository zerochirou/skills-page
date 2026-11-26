import type { Metadata } from "next";
import Link from "next/link";
import { buildBreadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { DonationPanel } from "@/features/donation/components/donation-panel";
import { HomeTemplate } from "@/features/home/components/home-template";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Donate & Support Skills Page",
  description:
    "Help keep Skills Page fast, open, and free from ads or paywalls. Support edge hosting, D1 storage, and open technical learning tools.",
  path: "/donation",
  markdownUrl: "/llms.txt",
  keywords: [
    "donate skills page",
    "support skills page",
    "sponsor open technical education",
  ],
});

const ALLOCATIONS = [
  {
    label: "01 / INFRASTRUCTURE",
    title: "Edge compute & storage",
    description:
      "Covers Cloudflare Workers compute, D1 database storage, and CDN bandwidth so reading public skills stays instant globally.",
  },
  {
    label: "02 / MEDIA & MATH",
    title: "Visual & equation tooling",
    description:
      "Sustains ImageKit media optimization pipelines, dynamic OpenGraph rendering, and MathQuill / KaTeX authoring tools.",
  },
  {
    label: "03 / OPEN ACCESS",
    title: "Free workspace forever",
    description:
      "Keeps authoring, public skill publishing, and machine-readable indexing accessible to learners and educators without paywalls.",
  },
] as const;

export default function DonationPage() {
  return (
    <HomeTemplate>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Skills Page", path: "/" },
          { name: "Donate", path: "/donation" },
        ])}
      />
      <main className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <header className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Support Skills Page
          </p>
          <h1 className="mt-4 font-serif text-4xl font-normal tracking-tight text-primary sm:text-5xl">
            Keep technical knowledge open, fast, and calm.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-body">
            Skills Page runs independently without ads, trackers, or reading
            paywalls. Community donations directly support hosting, media
            delivery, and continued improvements to the editor and curriculum
            tools.
          </p>
        </header>

        <section
          aria-label="How contributions help"
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {ALLOCATIONS.map((item) => (
            <div
              key={item.title}
              className="rounded-[12px] border border-hairline bg-surface-card p-6"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {item.label}
              </span>
              <h2 className="mt-3 text-base font-medium text-ink">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {item.description}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-10">
          <DonationPanel />
        </div>

        <section
          aria-label="Other ways to contribute"
          className="mt-10 flex flex-col items-start justify-between gap-6 rounded-[12px] border border-hairline bg-surface-card p-6 sm:flex-row sm:items-center sm:p-8"
        >
          <div>
            <h2 className="font-serif text-2xl font-normal tracking-tight text-primary">
              Prefer contributing knowledge instead?
            </h2>
            <p className="mt-1.5 text-sm text-body">
              Publishing clear, structured public skills helps learners
              everywhere discover better mental models.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/skills/new"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Create a skill
            </Link>
            <Link
              href="/skills"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-hairline bg-canvas px-5 text-sm font-medium text-ink transition-colors hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Explore skills
            </Link>
          </div>
        </section>
      </main>
    </HomeTemplate>
  );
}
