"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
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

  async function handleAction(action?: () => void | Promise<void>) {
    if (!action || isPending) return;
    setIsPending(true);
    try {
      await action();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="gap-5 rounded-[12px] border-border bg-card py-5 transition-colors hover:border-hairline-strong">
      <CardHeader className="px-5">
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
                          disabled={isPending}
                          onClick={() => void handleAction(onDelete)}
                          className="gap-2 text-destructive focus:text-destructive"
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

        <Link href={href} className="mt-2 block text-left">
          <CardTitle className="line-clamp-2 text-lg font-normal leading-snug tracking-tight text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="mt-1 truncate text-sm text-muted-foreground">
            {subtitle}
          </CardDescription>
        </Link>
      </CardHeader>

      <CardFooter className="justify-between border-t border-border/60 px-5 pt-4">
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
  );
}
