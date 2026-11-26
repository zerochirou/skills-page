import type { Metadata } from "next";
import Link from "next/link";
import { buildBreadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { HomeTemplate } from "@/features/home/components/home-template";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "About Skills Page",
  description:
    "Learn about Skills Page, an editorial repository workspace for organizing Markdown notes, technical references, equations, and reusable skills.",
  path: "/about",
  markdownUrl: "/llms.txt",
  keywords: ["about skills page", "markdown repository", "technical knowledge base"],
});

const PRINCIPLES = [
  {
    label: "01 / STRUCTURE",
    title: "Repository-first organization",
    description:
      "Every skill, note, and reference lives in a clean file hierarchy. No nested folders hidden behind proprietary databases.",
  },
  {
    label: "02 / CLARITY",
    title: "Editorial reading experience",
    description:
      "Warm canvas, high-contrast ink, and monospace paths keep your attention on the material rather than the interface.",
  },
  {
    label: "03 / OWNERSHIP",
    title: "Portable by default",
    description:
      "Write in plain markdown and code snippets that remain easy to read, share, and version across any workflow.",
  },
] as const;

export default function AboutPage() {
  return (
    <HomeTemplate>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Skills Page", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <main className="mx-auto max-w-5xl px-6 py-20">
        <header className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            About skills-page
          </p>
          <h1 className="mt-4 text-4xl font-normal tracking-tight text-ink sm:text-5xl">
            A calm workspace for technical knowledge.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-body">
            skills-page is built for developers and teams who want a focused
            place to write, organize, and share markdown skills, architectural
            notes, and reusable snippets without visual noise.
          </p>
        </header>

        <section
          aria-label="Core principles"
          className="mt-16 grid gap-6 md:grid-cols-3"
        >
          {PRINCIPLES.map((item) => (
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

        <section
          aria-label="Get started"
          className="mt-16 flex flex-col items-start justify-between gap-6 rounded-[12px] border border-hairline bg-surface-card p-8 sm:flex-row sm:items-center"
        >
          <div>
            <h2 className="text-xl font-normal tracking-tight text-ink">
              Start building your skills repository
            </h2>
            <p className="mt-1.5 text-sm text-body">
              Create a workspace or browse the public skills leaderboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded-[8px] bg-[#f54e00] px-4 text-sm font-medium text-white transition-colors hover:bg-[#d04200] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f54e00] focus-visible:ring-offset-2"
            >
              Create workspace
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-[8px] border border-hairline bg-canvas px-4 text-sm font-medium text-ink transition-colors hover:bg-canvas-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
            >
              Explore skills
            </Link>
          </div>
        </section>
      </main>
    </HomeTemplate>
  );
}
