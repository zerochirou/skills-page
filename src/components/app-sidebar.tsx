"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftIcon,
  CompassIcon,
  Folder,
  HashIcon,
  LayoutDashboardIcon,
  PlusIcon,
  UserIcon,
} from "lucide-react";
import useSWR from "swr";
import { authClient } from "@/features/auth/lib/auth-client";
import { RepositoryTree } from "@/features/skills/components/repository-tree";
import { useEditorSidebar } from "@/features/skills/context/editor-sidebar-context";
import { swrKeys } from "@/lib/swr";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "All Skills",
      url: "/dashboard/all",
      icon: <Folder />,
    },
    {
      title: "Create Skill",
      url: "/dashboard/skills/new",
      icon: <PlusIcon />,
    },
    {
      title: "Profile",
      url: "/dashboard/settings",
      icon: <UserIcon />,
    },
  ],
  navSecondary: [
    {
      title: "How to Use",
      url: "/how-to-use",
      icon: <CompassIcon />,
    },
    {
      title: "Explore Skills",
      url: "/",
      icon: <LayoutDashboardIcon />,
    },
  ],
};

interface SidebarSkillSummary {
  id: number;
  slug: string;
  title: string;
}

const emptySubscribe = () => () => {};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { config: editorConfig } = useEditorSidebar();
  const { data: session } = authClient.useSession();
  const { isMobile, setOpenMobile } = useSidebar();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const isEditorRoute =
    pathname.startsWith("/dashboard/skills/") &&
    pathname !== "/dashboard/skills/new";

  const { data: skillsData, isLoading } = useSWR<{
    skills: SidebarSkillSummary[];
  }>(session?.user && !isEditorRoute ? swrKeys.skills.list() : null);

  const skillItems = (skillsData?.skills ?? []).map((skill) => ({
    id: skill.id,
    slug: skill.slug,
    name: skill.title,
    url: `/dashboard/skills/${skill.slug}`,
    icon: <HashIcon />,
  }));

  if (mounted && isEditorRoute && editorConfig) {
    return (
      <Sidebar variant="inset" {...props}>
        <SidebarHeader>
          <div className="flex items-center justify-between gap-2 px-1 py-1">
            <div className="flex min-w-0 items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon.ico"
                alt="skills-page"
                className="size-7 shrink-0 rounded-lg object-cover"
              />
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                Skill Page
              </span>
            </div>
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              title="Back to dashboard"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <ArrowLeftIcon className="size-4" />
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <RepositoryTree
            embedded
            {...editorConfig.treeProps}
            onSelectOverview={() => {
              if (isMobile) setOpenMobile(false);
              editorConfig.treeProps.onSelectOverview();
            }}
            onSelectSubSkill={(subSkillId) => {
              if (isMobile) setOpenMobile(false);
              editorConfig.treeProps.onSelectSubSkill?.(subSkillId);
            }}
            onSelectUnit={(unitId) => {
              if (isMobile) setOpenMobile(false);
              editorConfig.treeProps.onSelectUnit(unitId);
            }}
          />
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon.ico"
                alt="skills-page"
                className="size-8 shrink-0 rounded-lg object-cover"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Skills Page</span>
                <span className="truncate text-xs text-muted-foreground">
                  Workspace
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
        <NavProjects projects={skillItems} isLoading={isLoading} />
        <NavSecondary items={navData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
