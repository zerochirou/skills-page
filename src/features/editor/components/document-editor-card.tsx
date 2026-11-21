"use client";

import { CheckIcon, FileTextIcon, Share2Icon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WikiLinkItem, WikiLinkTargetType } from "../types";
import { MarkdownEditor } from "./markdown-editor";

export interface DocumentEditorCardProps {
  section?: string;
  title: string;
  bannerImage?: string | null;
  value: string;
  onChange: (markdown: string) => void;
  wikiLinkItems?: WikiLinkItem[];
  onWikiLinkClick?: (target: {
    targetType: WikiLinkTargetType;
    targetId: number;
    label: string;
  }) => void;
  saveState?: "saved" | "saving" | "unsaved";
  lastEditedBy?: string;
  lastEditedAt?: string;
  collaborators?: string[];
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  actionDisabled?: boolean;
  onAction?: () => void;
  onShare?: () => void;
  secondaryActions?: React.ReactNode;
  className?: string;
}

export function DocumentEditorCard({
  section = "Workspace",
  title,
  bannerImage,
  value,
  onChange,
  wikiLinkItems = [],
  onWikiLinkClick,
  saveState = "saved",
  lastEditedBy = "You",
  lastEditedAt = "just now",
  collaborators = [],
  actionLabel = "Share",
  actionIcon,
  actionDisabled = false,
  onAction,
  onShare,
  secondaryActions,
  className,
}: DocumentEditorCardProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <header className="flex flex-wrap items-center justify-end gap-3 py-1 md:justify-between">
        <div className="hidden min-w-0 items-center gap-2 text-sm md:flex">
          <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">{section}</span>
          <span className="text-muted-foreground/60">/</span>
          <span className="truncate font-medium text-foreground">{title}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {saveState === "saved" ? (
              <>
                <CheckIcon className="size-3.5" />
                Saved
              </>
            ) : saveState === "saving" ? (
              "Saving..."
            ) : (
              "Unsaved"
            )}
          </span>

          {collaborators.length > 0 ? (
            <div className="hidden items-center -space-x-1.5 sm:flex">
              {collaborators.slice(0, 3).map((initials) => (
                <Avatar
                  key={initials}
                  className="size-6 border border-card text-[10px]"
                >
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          ) : null}

          {secondaryActions}

          <Button
            type="button"
            size="sm"
            disabled={actionDisabled}
            onClick={onAction ?? onShare}
          >
            {actionIcon ?? <Share2Icon data-icon="inline-start" />}
            {actionLabel}
          </Button>
        </div>
      </header>

      {bannerImage ? (
        <div className="relative h-44 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerImage}
            alt={`${title} banner`}
            className="size-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent via-card/65 to-card" />
        </div>
      ) : null}

      <MarkdownEditor
        value={value}
        onChange={onChange}
        wikiLinkItems={wikiLinkItems}
        onWikiLinkClick={onWikiLinkClick}
        className="rounded-lg"
      />

      <footer className="py-1 text-xs text-muted-foreground">
        Last edited by {lastEditedBy} · {lastEditedAt}
      </footer>
    </section>
  );
}
