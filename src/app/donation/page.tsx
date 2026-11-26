import type { Metadata } from "next";
import Link from "next/link";
import { buildBreadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { DonationPanel } from "@/features/donation/components/donation-panel";
import { HomeTemplate } from "@/features/home/components/home-template";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Donate & Support Skills Page",
  description:
    "Support Skills Page via GoPay to help keep technical knowledge open, fast, and free from ads or paywalls.",
  path: "/donation",
  markdownUrl: "/llms.txt",
  keywords: [
    "donate skills page",
    "support skills page",
    "gopay skills page donation",
  ],
});

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
            paywalls. Community donations via GoPay directly support hosting,
            media delivery, and continued improvements to the editor.
          </p>
        </header>

        <div className="mt-10">
          <DonationPanel />
        </div>

        <section
          aria-label="Other ways to contribute"
          className="mt-8 flex flex-col items-start justify-between gap-6 rounded-[12px] border border-hairline bg-surface-card p-6 sm:flex-row sm:items-center sm:p-8"
        >
          <div className="max-w-xl">
            <h2 className="font-serif text-2xl font-normal tracking-tight text-primary">
              Prefer contributing knowledge instead?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-body">
              Publishing clear, structured public skills helps learners
              everywhere discover better mental models.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              href="/dashboard/skills/new"
              className="inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Create a skill
            </Link>
            <Link
              href="/skills"
              className="inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-full border border-hairline bg-canvas px-5 text-sm font-medium text-ink transition-colors hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Explore skills
            </Link>
          </div>
        </section>
      </main>
    </HomeTemplate>
  );
}
