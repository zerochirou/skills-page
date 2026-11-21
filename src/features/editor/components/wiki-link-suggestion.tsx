"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { FileTextIcon, FolderIcon, BookOpenIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WikiLinkItem, WikiLinkTargetType } from "../types";

export interface WikiLinkSuggestionHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface WikiLinkSuggestionProps {
  items: WikiLinkItem[];
  command: (item: WikiLinkItem) => void;
}

const TARGET_LABEL: Record<WikiLinkTargetType, string> = {
  skill: "Skill",
  sub_skill: "Sub-skill",
  unit: "Unit",
};

function TargetIcon({ type }: { type: WikiLinkTargetType }) {
  if (type === "skill") {
    return <BookOpenIcon className="size-3.5 shrink-0 text-muted-foreground" />;
  }
  if (type === "sub_skill") {
    return <FolderIcon className="size-3.5 shrink-0 text-muted-foreground" />;
  }
  return <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />;
}

export const WikiLinkSuggestionList = forwardRef<
  WikiLinkSuggestionHandle,
  WikiLinkSuggestionProps
>(function WikiLinkSuggestionList({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeIndex = selectedIndex < items.length ? selectedIndex : 0;

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }) {
      if (items.length === 0) {
        return false;
      }
      if (event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        const chosen = items[activeIndex];
        if (chosen) {
          command(chosen);
        }
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="z-50 w-72 overflow-hidden rounded-[12px] border border-border bg-popover p-1.5 text-popover-foreground">
      <div className="px-2 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Internal Wiki-Link
      </div>
      {items.length === 0 ? (
        <div className="px-2 py-3 text-xs text-muted-foreground">
          No matching skill, sub-skill, or unit.
        </div>
      ) : (
        <div className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
          {items.map((item, index) => (
            <button
              key={`${item.targetType}-${item.targetId}`}
              type="button"
              onClick={() => command(item)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                index === activeIndex
                  ? "bg-muted text-foreground"
                  : "text-foreground/80 hover:bg-muted/60"
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <TargetIcon type={item.targetType} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{item.label}</span>
                  {item.subtitle ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {item.subtitle}
                    </span>
                  ) : null}
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {TARGET_LABEL[item.targetType]}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
