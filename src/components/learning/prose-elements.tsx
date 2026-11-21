"use client";

import { useState, type ReactNode } from "react";
import {
  AlertTriangleIcon,
  BookOpenIcon,
  CheckIcon,
  CopyIcon,
  LightbulbIcon,
  SigmaIcon,
} from "lucide-react";

type CalloutVariant = "note" | "formula" | "warning" | "tip";

const CALLOUT_STYLES: Record<
  CalloutVariant,
  { label: string; border: string; icon: typeof BookOpenIcon }
> = {
  note: {
    label: "Key Concept",
    border: "border-l-(--learn-accent)",
    icon: BookOpenIcon,
  },
  formula: {
    label: "Core Formula",
    border: "border-l-[#0F766E] dark:border-l-[#5EEAD4]",
    icon: SigmaIcon,
  },
  tip: {
    label: "Cognitive Tip",
    border: "border-l-[#15803D] dark:border-l-[#86EFAC]",
    icon: LightbulbIcon,
  },
  warning: {
    label: "Common Pitfall",
    border: "border-l-[#B45309] dark:border-l-[#FCD34D]",
    icon: AlertTriangleIcon,
  },
};

export function CalloutBox({
  variant = "note",
  title,
  children,
}: {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}) {
  const config = CALLOUT_STYLES[variant];
  const Icon = config.icon;

  return (
    <aside
      role="note"
      aria-label={title ?? config.label}
      className={`my-7 rounded-lg border border-(--learn-border) border-l-4 ${config.border} bg-(--learn-surface) px-5 py-4 text-left`}
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-tight text-(--learn-fg)">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span>{title ?? config.label}</span>
      </div>
      <div className="text-[0.95em] leading-[1.55] text-(--learn-fg) [&>*:last-child]:mb-0">
        {children}
      </div>
    </aside>
  );
}

export function CodeBlock({
  code,
  language = "ts",
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <figure className="my-7 overflow-hidden rounded-lg border border-(--learn-border) bg-(--learn-code-bg) text-left">
      <figcaption className="flex items-center justify-between gap-3 border-b border-(--learn-border) px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-(family-name:--font-jetbrains-mono) text-xs font-medium uppercase tracking-wider text-(--learn-fg-muted)">
            {language}
          </span>
          {title ? (
            <span className="truncate text-xs font-medium text-(--learn-fg)">
              {title}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Code copied" : "Copy code snippet"}
          className="inline-flex min-h-11-min-w-11ms-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-(--learn-fg) transition-colors hover:bg-(--learn-surface-elevated) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--learn-accent) sm:min-h-8 sm:min-w-0"
        >
          {copied ? (
            <>
              <CheckIcon className="size-3.5" aria-hidden="true" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <CopyIcon className="size-3.5" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </figcaption>
      <pre className="overflow-x-auto p-4 font-(family-name:--font-jetbrains-mono) text-[0.9rem] leading-[1.6] text-(--learn-fg)">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

export function ComparisonTable({
  caption,
  headers,
  rows,
}: {
  caption?: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="my-7 w-full overflow-x-auto rounded-lg border border-(--learn-border) bg-(--learn-bg)">
      <table className="w-full border-collapse text-left text-[0.95rem] leading-[1.55]">
        {caption ? (
          <caption className="border-b border-(--learn-border) bg-(--learn-surface) px-4 py-2.5 text-left text-sm font-semibold text-(--learn-fg)">
            {caption}
          </caption>
        ) : null}
        <thead>
          <tr className="border-b border-(--learn-border) bg-(--learn-surface)">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 text-left text-sm font-semibold text-(--learn-fg)"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-(--learn-border) last:border-b-0"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3 align-top text-left text-(--learn-fg)"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
