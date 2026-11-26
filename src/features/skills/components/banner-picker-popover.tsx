"use client";

import { useState } from "react";
import { ImageIcon, SearchIcon, Trash2Icon } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ImageProvider,
  StockImageItem,
} from "@/app/api/images/search/route";

interface BannerPickerPopoverProps {
  currentBanner: string | null;
  onSelect: (url: string | null) => Promise<boolean | void>;
}

export function BannerPickerPopover({
  currentBanner,
  onSelect,
}: BannerPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<ImageProvider>("unsplash");
  const [queryInput, setQueryInput] = useState("math");
  const [activeQuery, setActiveQuery] = useState("math");
  const [customUrl, setCustomUrl] = useState("");

  const { data, error, isLoading } = useSWR<{
    images: StockImageItem[];
    configured: boolean;
    provider: ImageProvider;
  }>(
    open
      ? `/api/images/search?provider=${provider}&q=${encodeURIComponent(activeQuery)}`
      : null,
    {
      revalidateIfStale: false,
      dedupingInterval: 60_000,
    }
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = queryInput.trim();
    if (trimmed) {
      setActiveQuery(trimmed);
    }
  }

  async function handlePick(url: string | null): Promise<boolean> {
    try {
      const ok = await onSelect(url);
      if (ok === false) return false;
      setOpen(false);
      return true;
    } catch {
      return false;
    }
  }

  const missingKeyName =
    provider === "unsplash" ? "UNSPLASH_ACCESS_KEY" : "PIXABAY_API_KEY";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="h-8" />
        }
      >
        <ImageIcon data-icon="inline-start" />
        {currentBanner ? "Banner" : "Add Banner"}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-1 rounded-md border border-border p-0.5">
            <Button
              type="button"
              variant={provider === "pixabay" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setProvider("pixabay")}
            >
              Pixabay
            </Button>
            <Button
              type="button"
              variant={provider === "unsplash" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setProvider("unsplash")}
            >
              Unsplash
            </Button>
          </div>

          <form
            onSubmit={(e) => {
              e.stopPropagation();
              handleSearch(e);
            }}
            className="flex items-center gap-1.5"
          >
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={`Search ${provider === "unsplash" ? "Unsplash" : "Pixabay"}...`}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button type="submit" size="xs" className="h-8 px-2.5">
              Search
            </Button>
          </form>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-28 rounded-md" />
              <Skeleton className="h-28 rounded-md" />
              <Skeleton className="h-28 rounded-md" />
              <Skeleton className="h-28 rounded-md" />
            </div>
          ) : error ? (
            <p className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive">
              Failed to load {provider === "unsplash" ? "Unsplash" : "Pixabay"}{" "}
              images. Check your API key in{" "}
              <code className="font-mono">.env</code>.
            </p>
          ) : data && !data.configured ? (
            <p className="rounded-md border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
              Add <code className="font-mono">{missingKeyName}</code> in{" "}
              <code className="font-mono">.env</code> to search{" "}
              {provider === "unsplash" ? "Unsplash" : "Pixabay"} photos, or
              paste an image URL below.
            </p>
          ) : data?.images.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No images found for &ldquo;{activeQuery}&rdquo;.
            </p>
          ) : (
            <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-0.5">
              {(data?.images ?? []).map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => void handlePick(img.fullUrl)}
                  className="group overflow-hidden rounded-md border border-border transition-colors hover:border-foreground/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.previewUrl}
                    alt={img.alt}
                    referrerPolicy="no-referrer"
                    className="h-28 w-full object-cover transition-transform group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (customUrl.trim()) {
                const ok = await handlePick(customUrl.trim());
                if (ok) setCustomUrl("");
              }
            }}
            className="flex items-center gap-1.5 border-t border-border pt-2.5"
          >
            <Input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Or paste image URL..."
              className="h-8 text-xs"
            />
            <Button type="submit" variant="outline" size="xs" className="h-8">
              Set
            </Button>
          </form>

          {currentBanner ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => void handlePick(null)}
              className="w-full justify-center text-destructive hover:text-destructive"
            >
              <Trash2Icon data-icon="inline-start" />
              Remove Banner
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
