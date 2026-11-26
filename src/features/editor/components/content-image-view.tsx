"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { AlertCircleIcon, ImageIcon, RotateCcwIcon } from "lucide-react";
import RefineFrame, { type RefineFrameStatus } from "@/components/RefineFrame";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchAndCacheImageUrl,
  getCachedImageUrl,
} from "../lib/image-cache";

function parsePositiveInt(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null;
  }
  if (typeof raw === "string") {
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function getDisplayLabel(alt: string, src: string): string {
  if (alt.trim()) return alt.trim();
  try {
    const url = new URL(src, "https://example.com");
    const lastSegment = url.pathname.split("/").filter(Boolean).pop();
    return lastSegment || "Image";
  } catch {
    return "Image";
  }
}

export function ContentImageView({ node, selected, editor }: NodeViewProps) {
  const src = String(node.attrs.src ?? "");
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
  const title = typeof node.attrs.title === "string" ? node.attrs.title : "";
  const attrWidth = parsePositiveInt(node.attrs.width);

  return (
    <ContentImageInner
      key={src}
      src={src}
      alt={alt}
      title={title}
      attrWidth={attrWidth}
      isSelected={editor.isEditable && selected}
    />
  );
}

function ContentImageInner({
  src,
  alt,
  title,
  attrWidth,
  isSelected,
}: {
  src: string;
  alt: string;
  title: string;
  attrWidth: number | null;
  isSelected: boolean;
}) {
  const [activated, setActivated] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [status, setStatus] = useState<RefineFrameStatus>("queued");
  const [aspectRatio, setAspectRatio] = useState<string>("16 / 10");
  const [fromCache, setFromCache] = useState(false);
  const refineTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  useEffect(() => {
    let cancelled = false;
    if (!src) return undefined;

    void getCachedImageUrl(src).then((cachedUrl) => {
      if (cancelled || !cachedUrl) return;
      setResolvedSrc(cachedUrl);
      setFromCache(true);
      setImgLoaded(true);
      setActivated(true);
      setStatus("complete");
    });

    return () => {
      cancelled = true;
      clearTimeout(refineTimerRef.current);
    };
  }, [src]);

  const loadImage = useCallback(async () => {
    if (!src) return;
    clearTimeout(refineTimerRef.current);
    setActivated(true);
    setImgLoaded(false);
    setStatus("generating");

    try {
      const result = await fetchAndCacheImageUrl(src);
      setResolvedSrc(result.url);
      setFromCache(false);
      setStatus("refining");
      refineTimerRef.current = setTimeout(() => {
        setStatus("complete");
      }, 400);
    } catch {
      setStatus("error");
    }
  }, [src]);

  const targetWidth = attrWidth ?? 640;
  const label = getDisplayLabel(alt, src);

  return (
    <NodeViewWrapper
      className="my-4"
      contentEditable={false}
      data-drag-handle
    >
      <div
        className={cn(
          "inline-block max-w-full rounded-[12px] transition-shadow",
          isSelected && "ring-2 ring-ring ring-offset-2"
        )}
        style={{ width: `min(${targetWidth}px, 100%)` }}
      >
        {!activated ? (
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              void loadImage();
            }}
            className="group flex w-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[12px] border border-dashed border-border bg-muted/40 px-4 py-10 text-center transition-colors hover:border-foreground/30 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ aspectRatio }}
          >
            <span className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-transform group-hover:scale-105 group-hover:text-foreground">
              <ImageIcon className="size-4" />
            </span>
            <div className="space-y-0.5">
              <p className="line-clamp-1 text-sm font-medium text-foreground">
                {label}
              </p>
              <p className="text-xs text-muted-foreground">
                Click to load image
              </p>
            </div>
          </button>
        ) : status === "error" ? (
          <div
            role="alert"
            className="flex w-full flex-col items-center justify-center gap-3 rounded-[12px] border border-destructive/30 bg-destructive/5 px-4 py-10 text-center"
            style={{ aspectRatio }}
          >
            <span className="flex size-10 items-center justify-center rounded-full border border-destructive/25 bg-card text-destructive">
              <AlertCircleIcon className="size-4" />
            </span>
            <div className="space-y-0.5">
              <p className="line-clamp-1 text-sm font-medium text-foreground">
                {label}
              </p>
              <p className="text-xs text-destructive">
                Failed to load image. Check the URL or your connection.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                void loadImage();
              }}
            >
              <RotateCcwIcon data-icon="inline-start" />
              Retry
            </Button>
          </div>
        ) : status === "complete" && imgLoaded && resolvedSrc ? (
          <div className="overflow-hidden rounded-[12px] border border-border/60 bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedSrc}
              alt={alt}
              title={title || undefined}
              decoding="async"
              className="m-0! block! h-auto! w-full! rounded-none! border-0! object-cover"
              onError={() => setStatus("error")}
            />
          </div>
        ) : (
          <RefineFrame
            status={status}
            width={targetWidth}
            aspectRatio={aspectRatio}
            radius={12}
            background="var(--muted)"
            color="var(--foreground)"
            stageDuration={220}
            showStatus={!fromCache}
            hideAfter={1000}
            onRetry={() => void loadImage()}
            className="w-full! border border-border/60"
          >
            {resolvedSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolvedSrc}
                alt={alt}
                title={title || undefined}
                decoding="async"
                className="m-0! h-full! w-full! rounded-none! border-0! object-cover"
                onError={() => setStatus("error")}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
                  }
                  setImgLoaded(true);
                }}
              />
            ) : null}
          </RefineFrame>
        )}
      </div>
    </NodeViewWrapper>
  );
}
