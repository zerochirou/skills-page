"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Copy,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, FramedDialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SkillCardMember {
  name: string;
  avatar?: string;
  initials: string;
}

export interface SkillCardProps {
  date: string;
  title: string;
  subtitle: string;
  progress?: number;
  timeLeft: string;
  bannerImage?: string | null;
  showHeaderBanner?: boolean;
  members?: SkillCardMember[];
  href?: string;
  isOwner?: boolean;
  editHref?: string;
  onDuplicate?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onSeeAuthor?: () => void;
}

export function SkillCard({
  date,
  title,
  subtitle,
  timeLeft,
  bannerImage,
  showHeaderBanner = false,
  members = [
    { name: "Alex", initials: "AL" },
    { name: "Sam", initials: "SM" },
  ],
  href = "/dashboard",
  isOwner = false,
  editHref,
  onDuplicate,
  onDelete,
  onSeeAuthor,
}: SkillCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  async function handleAction(action?: () => void | Promise<void>) {
    if (!action || isPending) return;
    setIsPending(true);
    try {
      await action();
      setIsPending(false);
    } catch (error) {
      setIsPending(false);
      throw error;
    }
  }

  return (
    <>
      <Card
        className={
          showHeaderBanner
            ? "gap-2 overflow-hidden rounded-[12px] border-border bg-card pt-0 pb-3.5 transition-colors hover:border-hairline-strong"
            : "gap-2 rounded-[12px] border-border bg-card py-3.5 transition-colors hover:border-hairline-strong"
        }
      >
        {showHeaderBanner ? (
          <Link
            href={href}
            className="relative block h-32 w-full overflow-hidden bg-muted/60"
          >
            {bannerImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bannerImage}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-muted/80 via-background to-accent/60">
                <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground">
                  <BookOpen className="size-3.5" />
                  <span className="font-mono">{title.slice(0, 1).toUpperCase() || "S"}</span>
                </div>
              </div>
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-card via-card/55 to-transparent"
            />
          </Link>
        ) : null}

        <CardHeader className="px-5 pt-1 pb-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {date}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isPending}
                  aria-label={`More options for ${title}`}
                  className="size-7 text-muted-foreground hover:text-foreground"
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 border border-border"
            >
              {isOwner ? (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      render={<Link href={href} className="gap-2" />}
                    >
                      <ArrowUpRight className="size-3.5" />
                      <span>Open</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={
                        <Link href={editHref ?? href} className="gap-2" />
                      }
                    >
                      <Pencil className="size-3.5" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    {onDuplicate ? (
                      <DropdownMenuItem
                        disabled={isPending}
                        onClick={() => void handleAction(onDuplicate)}
                        className="gap-2"
                      >
                        <Copy className="size-3.5" />
                        <span>Duplicate</span>
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuGroup>
                  {onDelete ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => setConfirmDeleteOpen(true)}
                          className="gap-2"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </>
                  ) : null}
                </>
              ) : (
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    render={<Link href={href} className="gap-2" />}
                  >
                    <ArrowUpRight className="size-3.5" />
                    <span>Go to skill</span>
                  </DropdownMenuItem>
                  {onSeeAuthor ? (
                    <DropdownMenuItem
                      onClick={onSeeAuthor}
                      className="gap-2"
                    >
                      <UserIcon className="size-3.5" />
                      <span>See author</span>
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link href={href} className="mt-1 block text-left">
          <CardTitle className="line-clamp-2 text-lg font-normal leading-snug tracking-tight text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="mt-1 truncate text-sm text-muted-foreground">
            {subtitle}
          </CardDescription>
        </Link>
      </CardHeader>

      <CardFooter className="justify-between border-t border-border/60 px-5 pt-2.5 pb-0">
        <div className="flex items-center -space-x-2">
          {members.map((member) => (
            <Avatar
              key={member.name}
              className="size-7 border-2 border-card"
            >
              {member.avatar && (
                <AvatarImage src={member.avatar} alt={member.name} />
              )}
              <AvatarFallback className="text-[10px]">
                {member.initials}
              </AvatarFallback>
            </Avatar>
          ))}
          <span className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
            <Plus className="size-3.5" />
          </span>
        </div>

        <Badge variant="secondary" className="font-mono text-xs font-normal">
          {timeLeft}
        </Badge>
      </CardFooter>
    </Card>

    <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
      <FramedDialogContent
        className="sm:max-w-md"
        title="Delete skill"
        description={
          <>
            Are you sure you want to delete &ldquo;{title}&rdquo;? This action
            cannot be undone.
          </>
        }
      >
        <CardFooter className="justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmDeleteOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              setConfirmDeleteOpen(false);
              void handleAction(onDelete);
            }}
          >
            Delete
          </Button>
        </CardFooter>
      </FramedDialogContent>
    </Dialog>
  </>
  );
}
