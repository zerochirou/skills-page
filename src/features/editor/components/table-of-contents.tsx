"use client";

import { useMemo } from "react";
import { ListTreeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TocHeading {
  index: number;
  level: 1 | 2 | 3;
  text: string;
}

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

    const match = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (!match) continue;

    const level = match[1].length as 1 | 2 | 3;
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

    const domHeadings = Array.from(editorEl.querySelectorAll("h1, h2, h3"));
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
                heading.level === 1 && "pl-2.5 font-medium text-foreground/90",
                heading.level === 2 && "pl-3.5",
                heading.level === 3 && "pl-5 text-[11px]"
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
