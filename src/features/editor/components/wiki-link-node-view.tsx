"use client";

import type { MouseEvent } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { BookOpen, FileText, Folder } from "lucide-react";
import type { WikiLinkTargetType } from "../types";

function WikiLinkIcon({ type }: { type: WikiLinkTargetType }) {
  switch (type) {
    case "skill":
      return <BookOpen className="size-3 shrink-0 text-primary" aria-hidden="true" />;
    case "sub_skill":
      return <Folder className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />;
    case "unit":
      return <FileText className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />;
  }
}

export function WikiLinkNodeView({ node, extension }: NodeViewProps) {
  const targetType = (node.attrs.targetType as WikiLinkTargetType) ?? "unit";
  const targetId = Number(node.attrs.targetId ?? 0);
  const label = String(node.attrs.label ?? "");

  const onWikiLinkClick = extension.options.onWikiLinkClick as
    | ((target: {
        targetType: WikiLinkTargetType;
        targetId: number;
        label: string;
      }) => void)
    | undefined;

  const isClickable = Boolean(onWikiLinkClick) && (targetType === "skill" || targetId > 0);

  function handleClick(e: MouseEvent<HTMLSpanElement>) {
    if (!isClickable) return;
    e.preventDefault();
    e.stopPropagation();
    onWikiLinkClick?.({ targetType, targetId, label });
  }

  return (
    <NodeViewWrapper
      as="span"
      data-wiki-link=""
      data-target-type={targetType}
      data-target-id={String(targetId)}
      data-label={label}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onWikiLinkClick?.({ targetType, targetId, label });
        }
      }}
      className={[
        "inline-flex items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 align-baseline text-xs font-medium text-foreground transition-colors",
        isClickable
          ? "cursor-pointer hover:border-primary/40 hover:bg-accent"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <WikiLinkIcon type={targetType} />
      <span>{label}</span>
    </NodeViewWrapper>
  );
}
