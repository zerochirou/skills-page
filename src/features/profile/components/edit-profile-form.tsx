"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckIcon,
  ExternalLinkIcon,
  ImagePlusIcon,
  XIcon,
} from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/features/auth/lib/auth-client";
import { ApiError, fetcher, swrKeys } from "@/lib/swr";
import type { StockImageItem } from "@/app/api/images/search/route";

interface ProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  profile: {
    id: number;
    username: string;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    website: string | null;
    bannerImage: string | null;
    bio: string | null;
  } | null;
}

const MAX_BIO = 200;

function ImageUrlOrStockPopover({
  label,
  onSelect,
  children,
}: {
  label: string;
  onSelect: (url: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("minimal portrait");
  const [activeQuery, setActiveQuery] = useState("minimal portrait");
  const [urlInput, setUrlInput] = useState("");

  const { data } = useSWR<{
    images: StockImageItem[];
    configured: boolean;
  }>(
    open
      ? `/api/images/search?provider=pixabay&q=${encodeURIComponent(activeQuery)}`
      : null,
    { revalidateIfStale: false, dedupingInterval: 60_000 }
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger nativeButton={false} render={<span className="inline-flex" />}>
        {children}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-medium">{label}</span>
          {data?.configured ? (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (query.trim()) setActiveQuery(query.trim());
                }}
                className="flex gap-1.5"
              >
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Pixabay..."
                  className="h-7 text-xs"
                />
                <Button type="submit" size="xs" className="h-7">
                  Go
                </Button>
              </form>
              <div className="grid max-h-36 grid-cols-2 gap-1.5 overflow-y-auto">
                {data.images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      onSelect(img.fullUrl);
                      setOpen(false);
                    }}
                    className="overflow-hidden rounded border border-border hover:border-foreground/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.previewUrl}
                      alt={img.alt}
                      className="h-12 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (urlInput.trim()) {
                onSelect(urlInput.trim());
                setUrlInput("");
                setOpen(false);
              }
            }}
            className="flex gap-1.5"
          >
            <Input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste image URL..."
              className="h-7 text-xs"
            />
            <Button type="submit" variant="outline" size="xs" className="h-7">
              Set
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EditProfileForm({ embedded = false }: { embedded?: boolean }) {
  const { mutate } = useSWRConfig();
  const { data, isLoading } = useSWR<ProfileResponse>(
    swrKeys.user.profile(),
    { revalidateOnFocus: false }
  );

  if (isLoading || !data) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <Skeleton className="h-[540px] w-full rounded-[12px]" />
      </div>
    );
  }

  return (
    <EditProfileFormInner
      key={`${data.user.id}:${data.user.name}:${data.profile?.username ?? ""}:${data.profile?.displayName ?? ""}`}
      initial={data}
      embedded={embedded}
      onSaved={async () => {
        await mutate(swrKeys.user.profile());
        await authClient.getSession();
      }}
    />
  );
}

function EditProfileFormInner({
  initial,
  embedded = false,
  onSaved,
}: {
  initial: ProfileResponse;
  embedded?: boolean;
  onSaved: () => Promise<void>;
}) {
  const nameParts = (initial.profile?.displayName || initial.user.name || "").split(
    /\s+/
  );
  const defaultFirst = initial.profile?.firstName ?? nameParts[0] ?? "";
  const defaultLast =
    initial.profile?.lastName ?? nameParts.slice(1).join(" ") ?? "";

  const [bannerImage, setBannerImage] = useState<string | null>(
    initial.profile?.bannerImage ?? null
  );
  const [avatarImage, setAvatarImage] = useState<string | null>(
    initial.user.image ?? null
  );
  const [firstName, setFirstName] = useState(defaultFirst);
  const [lastName, setLastName] = useState(defaultLast);
  const [username, setUsername] = useState(initial.profile?.username ?? "");
  const [website, setWebsite] = useState(
    (initial.profile?.website ?? "").replace(/^https?:\/\//i, "")
  );
  const [bio, setBio] = useState(initial.profile?.bio ?? "");

  const [checkedUsername, setCheckedUsername] = useState<{
    value: string;
    available: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const normalizedUsername = username.trim().toLowerCase();
  const usernameAvailable: boolean | null =
    !normalizedUsername || normalizedUsername.length < 2
      ? false
      : normalizedUsername === initial.profile?.username
        ? true
        : checkedUsername?.value === normalizedUsername
          ? checkedUsername.available
          : null;

  useEffect(() => {
    if (
      !normalizedUsername ||
      normalizedUsername.length < 2 ||
      normalizedUsername === initial.profile?.username
    ) {
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetcher<{ available: boolean }>(
          `/api/user/profile?checkUsername=${encodeURIComponent(normalizedUsername)}`
        );
        setCheckedUsername({
          value: normalizedUsername,
          available: res.available,
        });
      } catch {
        setCheckedUsername(null);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [normalizedUsername, initial.profile?.username]);

  function handleReset() {
    setBannerImage(initial.profile?.bannerImage ?? null);
    setAvatarImage(initial.user.image ?? null);
    setFirstName(defaultFirst);
    setLastName(defaultLast);
    setUsername(initial.profile?.username ?? "");
    setWebsite((initial.profile?.website ?? "").replace(/^https?:\/\//i, ""));
    setBio(initial.profile?.bio ?? "");
    setErrorMsg(null);
    setSavedNotice(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSavedNotice(false);

    try {
      await fetcher("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({
          firstName,
          lastName,
          username: username.trim().toLowerCase(),
          website,
          bio,
          bannerImage,
          avatarImage,
        }),
      });
      await onSaved();
      setSavedNotice(true);
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError ? err.message : "Failed to save profile."
      );
    } finally {
      setSaving(false);
    }
  }

  const initials =
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "U";
  const charsLeft = Math.max(0, MAX_BIO - bio.length);

  return (
    <form onSubmit={handleSubmit} className={embedded ? "w-full" : "mx-auto w-full max-w-xl"}>
      <div
        className={
          embedded
            ? "flex flex-col overflow-hidden"
            : "flex flex-col overflow-hidden rounded-[12px] border border-border bg-card"
        }
      >
        {!embedded && (
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-medium">Edit profile</CardTitle>
            {initial.profile?.username ? (
              <Button
                variant="ghost"
                size="xs"
                render={<Link href={`/${initial.profile.username}`} />}
              >
                /{initial.profile.username}
                <ExternalLinkIcon data-icon="inline-end" />
              </Button>
            ) : null}
          </CardHeader>
        )}

        <div className={embedded ? "relative h-36 w-full overflow-hidden rounded-[8px] bg-muted" : "relative h-36 w-full bg-muted"}>
          {bannerImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerImage}
                alt="Profile banner"
                className="size-full object-cover"
              />
            </>
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/20">
            <ImageUrlOrStockPopover
              label="Change banner image"
              onSelect={setBannerImage}
            >
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="rounded-full bg-black/55 text-white hover:bg-black/75"
                aria-label="Change banner image"
              >
                <ImagePlusIcon />
              </Button>
            </ImageUrlOrStockPopover>
            {bannerImage ? (
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="rounded-full bg-black/55 text-white hover:bg-black/75"
                aria-label="Remove banner image"
                onClick={() => setBannerImage(null)}
              >
                <XIcon />
              </Button>
            ) : null}
          </div>
        </div>

        <CardContent className="px-5 pb-5 pt-0">
          <div className="relative -mt-10 mb-5 inline-flex">
            <Avatar className="size-20 border-4 border-card">
              {avatarImage ? (
                <AvatarImage src={avatarImage} alt={firstName || "Avatar"} />
              ) : null}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity hover:opacity-100">
              <ImageUrlOrStockPopover
                label="Change avatar image"
                onSelect={setAvatarImage}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full text-white hover:bg-black/40"
                  aria-label="Change avatar image"
                >
                  <ImagePlusIcon />
                </Button>
              </ImageUrlOrStockPopover>
            </div>
          </div>

          {errorMsg ? (
            <Alert variant="error" className="mb-4">
              <AlertTitle>Unable to save</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          ) : null}

          {savedNotice ? (
            <Alert className="mb-4">
              <AlertTitle>Profile updated</AlertTitle>
              <AlertDescription>
                Your public profile is live at{" "}
                <Link href={`/${username}`} className="underline">
                  /{username}
                </Link>
                .
              </AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="profile-first-name">First name</FieldLabel>
                <Input
                  id="profile-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-background"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="profile-last-name">Last name</FieldLabel>
                <Input
                  id="profile-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-background"
                />
              </Field>
            </div>

            <Field data-invalid={usernameAvailable === false}>
              <FieldLabel htmlFor="profile-username">Username</FieldLabel>
              <div className="relative">
                <Input
                  id="profile-username"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                    )
                  }
                  className="bg-background pr-8 font-mono text-sm"
                  required
                />
                {usernameAvailable === true ? (
                  <CheckIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-semantic-success" />
                ) : usernameAvailable === false ? (
                  <XIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-destructive" />
                ) : null}
              </div>
              {usernameAvailable === false ? (
                <FieldError>Username is unavailable or invalid.</FieldError>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-website">Website</FieldLabel>
              <div className="flex items-center overflow-hidden rounded-md border border-input focus-within:border-ring">
                <span className="border-r border-input bg-muted/50 px-3 py-2 text-xs text-muted-foreground select-none">
                  https://
                </span>
                <input
                  id="profile-website"
                  value={website}
                  onChange={(e) =>
                    setWebsite(e.target.value.replace(/^https?:\/\//i, ""))
                  }
                  placeholder="www.example.com"
                  className="h-9 min-w-0 flex-1 bg-background px-3 text-sm outline-none"
                />
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-bio">Biography</FieldLabel>
              <Textarea
                id="profile-bio"
                value={bio}
                maxLength={MAX_BIO}
                onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
                rows={3}
                className="bg-background"
                placeholder="Tell people a bit about yourself..."
              />
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground">
                  {charsLeft} characters left
                </span>
              </div>
            </Field>
          </FieldGroup>
        </CardContent>

        <div
          className={
            embedded
              ? "flex items-center justify-end gap-2 pt-4"
              : "flex items-center justify-end gap-2 border-t border-border px-5 py-3.5"
          }
        >
          <Button type="button" variant="outline" onClick={handleReset}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || usernameAvailable === false}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
