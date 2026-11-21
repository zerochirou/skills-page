"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon, MoonIcon, SunIcon } from "lucide-react";

export interface TocItem {
  id: string;
  label: string;
  level?: 2 | 3;
}

export interface GlossaryItem {
  term: string;
  definition: string;
}

export function ArticleLayout({
  eyebrow,
  title,
  readingTime,
  backHref = "/",
  backLabel = "Back to home",
  toc,
  glossary,
  children,
}: {
  eyebrow?: string;
  title: string;
  readingTime?: string;
  backHref?: string;
  backLabel?: string;
  toc: TocItem[];
  glossary: GlossaryItem[];
  children: ReactNode;
}) {
  const [darkReadingMode, setDarkReadingMode] = useState(false);

  return (
    <div
      className={
        darkReadingMode
          ? "dark learning-surface min-h-screen"
          : "learning-surface min-h-screen"
      }
    >
      <header className="sticky top-0 z-20 border-b border-(--learn-border) bg-(--learn-bg)/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href={backHref}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-2 text-sm font-medium text-(--learn-fg) transition-colors hover:bg-(--learn-surface) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--learn-accent)"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>

          <button
            type="button"
            onClick={() => setDarkReadingMode((prev) => !prev)}
            aria-pressed={darkReadingMode}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-(--learn-border) bg-(--learn-surface) px-3.5 text-sm font-medium text-(--learn-fg) transition-colors hover:bg-(--learn-surface-elevated) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--learn-accent)"
          >
            {darkReadingMode ? (
              <>
                <SunIcon className="size-4" aria-hidden="true" />
                <span>Light Anti-Halation</span>
              </>
            ) : (
              <>
                <MoonIcon className="size-4" aria-hidden="true" />
                <span>Dark Anti-Halation</span>
              </>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[220px_minmax(0,65ch)_260px] xl:justify-between">
        {/* Left: Table of Contents */}
        <nav
          aria-label="Table of Contents"
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--learn-fg-muted)">
            On this page
          </p>
          <ul className="space-y-1 border-l border-(--learn-border) pl-3">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`block rounded-md py-1.5 text-left text-sm leading-[1.4] text-(--learn-fg-muted) transition-colors hover:text-(--learn-fg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--learn-accent) ${
                    item.level === 3 ? "pl-3 text-[0.84rem]" : "font-medium"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Center: Optimal 65ch Reading Column */}
        <main id="main-content" className="min-w-0">
          <article className="learning-prose mx-auto w-full">
            <div className="mb-8 border-b border-(--learn-border) pb-6 text-left">
              {eyebrow ? (
                <p className="mb-2 font-(family-name:--font-jetbrains-mono) text-xs font-semibold uppercase tracking-wider text-(--learn-accent)">
                  {eyebrow}
                </p>
              ) : null}
              <h1>{title}</h1>
              {readingTime ? (
                <p className="mb-0 text-sm text-(--learn-fg-muted)">
                  {readingTime}
                </p>
              ) : null}
            </div>

            {children}
          </article>
        </main>

        {/* Right: Contextual Glossary & Notes */}
        <aside
          aria-label="Contextual Glossary"
          className="xl:sticky xl:top-24 xl:self-start"
        >
          <section className="rounded-lg border border-(--learn-border) bg-(--learn-surface) p-5 text-left">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-(--learn-fg)">
              Glossary & Notes
            </h2>
            <dl className="space-y-4">
              {glossary.map((entry) => (
                <div
                  key={entry.term}
                  className="border-b border-(--learn-border) pb-3 last:border-b-0 last:pb-0"
                >
                  <dt className="text-sm font-semibold text-(--learn-fg)">
                    {entry.term}
                  </dt>
                  <dd className="mt-1 text-sm leading-[1.55] text-(--learn-fg-muted)">
                    {entry.definition}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
