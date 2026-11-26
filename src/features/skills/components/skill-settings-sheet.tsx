"use client";

import { useState } from "react";
import { SettingsIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter, CardPanel } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  FramedDialogContent,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { BannerPickerPopover } from "./banner-picker-popover";

export interface SkillSettingsPatch {
  title?: string;
  summary?: string | null;
  bannerImage?: string | null;
  visibility?: "public" | "private";
  status?: "draft" | "published" | "archived";
}

interface SkillSettingsSheetProps {
  title: string;
  summary: string | null;
  bannerImage: string | null;
  visibility: "public" | "private";
  status: "draft" | "published" | "archived";
  onSave: (patch: SkillSettingsPatch) => Promise<boolean | void>;
  onDelete: () => Promise<void>;
}

export function SkillSettingsSheet({
  title,
  summary,
  bannerImage,
  visibility,
  status,
  onSave,
  onDelete,
}: SkillSettingsSheetProps) {
  const [open, setOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftSummary, setDraftSummary] = useState(summary ?? "");
  const [draftBanner, setDraftBanner] = useState(bannerImage ?? "");
  const [draftVisibility, setDraftVisibility] = useState(visibility);
  const [draftStatus, setDraftStatus] = useState(status);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setDraftTitle(title);
      setDraftSummary(summary ?? "");
      setDraftBanner(bannerImage ?? "");
      setDraftVisibility(visibility);
      setDraftStatus(status);
      setConfirmDelete(false);
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = draftTitle.trim();
    if (trimmedTitle.length < 2) {
      setError("Title must be at least 2 characters.");
      return;
    }

    const trimmedBanner = draftBanner.trim();
    if (trimmedBanner) {
      try {
        new URL(trimmedBanner);
      } catch {
        setError("Banner URL must be a valid URL.");
        return;
      }
    }

    setError(null);
    setIsSaving(true);
    try {
      const ok = await onSave({
        title: trimmedTitle,
        summary: draftSummary.trim() || null,
        bannerImage: trimmedBanner || null,
        visibility: draftVisibility,
        status: draftStatus,
      });
      if (ok === false) {
        setIsSaving(false);
        setError("Failed to save settings. Please try again.");
        return;
      }
      setIsSaving(false);
      setOpen(false);
    } catch (err) {
      setIsSaving(false);
      setError(
        err instanceof Error ? err.message : "Failed to save settings."
      );
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await onDelete();
      setIsDeleting(false);
      setOpen(false);
    } catch (err) {
      setIsDeleting(false);
      throw err;
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            aria-label="Skill settings"
          />
        }
      >
        <SettingsIcon data-icon="inline-start" />
        Settings
      </DialogTrigger>

      <FramedDialogContent
        className="sm:max-w-xl"
        title="Skill Settings"
        description="Update repository title, summary, banner, visibility, and status."
      >
        <form onSubmit={handleSubmit}>
          <CardPanel className="flex max-h-[75vh] flex-col gap-5 overflow-y-auto">
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="settings-title">Title</FieldLabel>
              <Input
                id="settings-title"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                maxLength={120}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="settings-summary">Summary</FieldLabel>
              <Textarea
                id="settings-summary"
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                placeholder="Short overview of this skill repository..."
                maxLength={280}
                rows={3}
              />
            </Field>

            <Field>
              <FieldLabel>Banner Image</FieldLabel>
              <div className="flex flex-col gap-2">
                {draftBanner ? (
                  <div className="overflow-hidden rounded-md border border-border bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={draftBanner}
                      alt="Selected banner"
                      referrerPolicy="no-referrer"
                      className="h-24 w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <BannerPickerPopover
                    currentBanner={draftBanner || null}
                    onSelect={async (url) => setDraftBanner(url ?? "")}
                  />
                  {draftBanner ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground"
                      onClick={() => setDraftBanner("")}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="settings-visibility">Visibility</FieldLabel>
                <Select
                  value={draftVisibility}
                  onValueChange={(val) => {
                    if (val === "public" || val === "private") {
                      setDraftVisibility(val);
                    }
                  }}
                >
                  <SelectTrigger id="settings-visibility" className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="settings-status">Status</FieldLabel>
                <Select
                  value={draftStatus}
                  onValueChange={(val) => {
                    if (
                      val === "draft" ||
                      val === "published" ||
                      val === "archived"
                    ) {
                      setDraftStatus(val);
                    }
                  }}
                >
                  <SelectTrigger id="settings-status" className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {error ? <FieldError>{error}</FieldError> : null}

            <Separator />

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
              <div className="text-[11px] font-semibold tracking-[0.08em] text-destructive uppercase">
                Danger Zone
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Deleting this skill permanently removes all sub-skills and units.
              </p>
              {confirmDelete ? (
                <div className="flex items-center gap-2 pt-0.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90"
                    disabled={isDeleting}
                    onClick={() => void handleDelete()}
                  >
                    {isDeleting ? "Deleting..." : "Confirm delete"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isDeleting}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2Icon data-icon="inline-start" />
                    Delete skill
                  </Button>
                </div>
              )}
            </div>
          </CardPanel>

          <CardFooter className="justify-end gap-2 border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </CardFooter>
        </form>
      </FramedDialogContent>
    </Dialog>
  );
}
