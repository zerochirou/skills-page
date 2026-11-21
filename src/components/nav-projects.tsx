"use client";

import Link from "next/link";
import { preload } from "swr";
import { fetcher, swrKeys } from "@/lib/swr";
import {
  FolderIcon,
  MoreHorizontalIcon,
  PlusIcon,
  ShareIcon,
  Trash2Icon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export interface SidebarSkillItem {
  id: number;
  slug: string;
  name: string;
  url: string;
  icon: React.ReactNode;
}

export function NavProjects({
  projects,
  isLoading = false,
}: {
  projects: SidebarSkillItem[];
  isLoading?: boolean;
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Skills</SidebarGroupLabel>
      <SidebarMenu>
        {isLoading ? (
          <SidebarMenuItem>
            <div className="flex flex-col gap-1.5 px-2 py-1">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </SidebarMenuItem>
        ) : projects.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard/skills/new" />}>
              <PlusIcon />
              <span className="text-muted-foreground">Create first skill</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          projects.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                render={
                  <Link
                    href={item.url}
                    onMouseEnter={() =>
                      void preload(swrKeys.skills.detail(item.slug), fetcher)
                    }
                  />
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuAction
                      showOnHover
                      className="aria-expanded:bg-muted"
                    />
                  }
                >
                  <MoreHorizontalIcon />
                  <span className="sr-only">More</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      render={<Link href={item.url} />}
                    >
                      <span>View Skill</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ShareIcon className="text-muted-foreground" />
                      <span>Share Skill</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <Trash2Icon className="text-muted-foreground" />
                      <span>Delete Skill</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))
        )}
        {projects.length > 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard/skills/new" />}>
              <PlusIcon />
              <span>New Skill</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : null}
      </SidebarMenu>
    </SidebarGroup>
  );
}
