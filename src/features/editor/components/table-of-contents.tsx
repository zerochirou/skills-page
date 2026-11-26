"use client";

import { useMemo } from "react";
import { ListTreeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface TocHeading {
  index: number;
  level: HeadingLevel;
  text: string;
}

const HEADING_INDENT_CLASSES: Record<HeadingLevel, string> = {
  1: "pl-2.5 font-medium text-foreground/90",
  2: "pl-3.5",
  3: "pl-5 text-[11px]",
  4: "pl-6 text-[11px]",
  5: "pl-7 text-[11px]",
  6: "pl-8 text-[11px]",
};

export function extractMarkdownHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const lines = markdown.split(/\r?\n/);
  let inFence = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (!match) continue;

    const level = match[1].length as HeadingLevel;
    const text = match[2].replace(/[*_`~]/g, "").trim();
    if (!text) continue;

    headings.push({
      index: headings.length,
      level,
      text,
    });
  }

  return headings;
}

export function TableOfContents({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  const headings = useMemo(
    () => extractMarkdownHeadings(markdown),
    [markdown]
  );

  function handleScrollTo(heading: TocHeading) {
    const editorEl = document.querySelector(".tiptap-editor");
    if (!editorEl) return;

    const domHeadings = Array.from(
      editorEl.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    const targetEl =
      domHeadings[heading.index] ??
      domHeadings.find(
        (el) => el.textContent?.trim().toLowerCase() === heading.text.toLowerCase()
      );

    targetEl?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <aside
      aria-label="Table of contents"
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <ListTreeIcon className="size-3.5" />
        <span>On this page</span>
      </div>

      {headings.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Add headings (<code className="font-mono">##</code>) to build a table
          of contents.
        </p>
      ) : (
        <nav className="flex flex-col gap-0.5 border-l border-border">
          {headings.map((heading) => (
            <button
              key={`${heading.index}-${heading.text}`}
              type="button"
              onClick={() => handleScrollTo(heading)}
              className={cn(
                "-ml-px border-l border-transparent py-1 pr-2 text-left text-xs text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground",
                HEADING_INDENT_CLASSES[heading.level]
              )}
            >
              <span className="line-clamp-2">{heading.text}</span>
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}
