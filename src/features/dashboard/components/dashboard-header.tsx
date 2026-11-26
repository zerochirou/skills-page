"use client";

import { Fragment, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobeIcon, LockIcon, PlusIcon } from "lucide-react";
import { ThemeToggle } from "@/components/commons/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BannerPickerPopover } from "@/features/skills/components/banner-picker-popover";
import { SkillSettingsSheet } from "@/features/skills/components/skill-settings-sheet";
import { useEditorSidebar } from "@/features/skills/context/editor-sidebar-context";

interface Crumb {
  label: string;
  href?: string;
}

function formatSegment(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const emptySubscribe = () => () => {};

export function DashboardHeader() {
  const pathname = usePathname();
  const { config: editorConfig } = useEditorSidebar();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isEditorRoute =
    pathname.startsWith("/dashboard/skills/") &&
    pathname !== "/dashboard/skills/new";
  const currentSlug = isEditorRoute
    ? (pathname.replace("/dashboard/skills/", "").split("/")[0] ?? "")
    : "";
  const activeEditorConfig =
    mounted && isEditorRoute && editorConfig?.skillSlug === currentSlug
      ? editorConfig
      : null;

  const crumbs = buildBreadcrumbs(pathname, activeEditorConfig);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
      <div className="flex shrink-0 items-center gap-2 md:min-w-0 md:flex-1">
        <SidebarTrigger className="-ml-1 min-h-[44px] min-w-[44px] shrink-0 md:min-h-0 md:min-w-0" />
        <Separator
          orientation="vertical"
          className="mr-2 shrink-0 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb className="hidden min-w-0 flex-1 md:block">
          <BreadcrumbList className="flex-nowrap">
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <Fragment key={`${crumb.label}-${index}`}>
                  <BreadcrumbItem
                    className={
                      index === 0 && crumbs.length > 1
                        ? "hidden min-w-0 md:inline-flex"
                        : "min-w-0"
                    }
                  >
                    {isLast || !crumb.href ? (
                      <BreadcrumbPage className="block truncate">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={crumb.href} />}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast ? (
                    <BreadcrumbSeparator
                      className={
                        index === 0 ? "hidden md:inline-flex" : undefined
                      }
                    />
                  ) : null}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 overflow-x-auto md:flex-initial">
        {activeEditorConfig?.headerControls ? (
          <div className="flex shrink-0 items-center gap-2">
            <BannerPickerPopover
              currentBanner={activeEditorConfig.headerControls.bannerImage}
              onSelect={(url) =>
                activeEditorConfig.headerControls!.onUpdateMeta({
                  bannerImage: url,
                })
              }
            />

            <Select
              value={activeEditorConfig.headerControls.visibility}
              onValueChange={(val) => {
                if (val === "public" || val === "private") {
                  void activeEditorConfig.headerControls!.onUpdateMeta({
                    visibility: val,
                  });
                }
              }}
            >
              <SelectTrigger size="sm" className="h-8 w-fit border-border bg-background">
                <SelectValue>
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    {activeEditorConfig.headerControls.visibility === "public" ? (
                      <GlobeIcon className="size-3.5 text-muted-foreground" />
                    ) : (
                      <LockIcon className="size-3.5 text-muted-foreground" />
                    )}
                    {activeEditorConfig.headerControls.visibility}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={activeEditorConfig.headerControls.status}
              onValueChange={(val) => {
                if (
                  val === "draft" ||
                  val === "published" ||
                  val === "archived"
                ) {
                  void activeEditorConfig.headerControls!.onUpdateMeta({
                    status: val,
                  });
                }
              }}
            >
              <SelectTrigger size="sm" className="h-8 w-fit border-border bg-background">
                <SelectValue>
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <span
                      className={
                        activeEditorConfig.headerControls.status === "published"
                          ? "size-1.5 rounded-full bg-semantic-success"
                          : "size-1.5 rounded-full bg-muted-foreground/60"
                      }
                    />
                    {activeEditorConfig.headerControls.status}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <SkillSettingsSheet
              title={activeEditorConfig.headerControls.title}
              summary={activeEditorConfig.headerControls.summary}
              bannerImage={activeEditorConfig.headerControls.bannerImage}
              visibility={activeEditorConfig.headerControls.visibility}
              status={activeEditorConfig.headerControls.status}
              onSave={activeEditorConfig.headerControls.onUpdateMeta}
              onDelete={activeEditorConfig.headerControls.onDeleteSkill}
            />
          </div>
        ) : (
          <>
            <ThemeToggle />
            <Button
              variant="default"
              size="sm"
              render={<Link href="/dashboard/skills/new" />}
              className="bg-primary text-primary-foreground hover:bg-primary-active"
            >
              <PlusIcon data-icon="inline-start" />
              New Skill
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

function buildBreadcrumbs(
  pathname: string,
  editorConfig: ReturnType<typeof useEditorSidebar>["config"]
): Crumb[] {
  if (pathname === "/dashboard") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Overview" },
    ];
  }

  if (pathname === "/dashboard/all") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "All Skills" },
    ];
  }

  if (pathname === "/dashboard/skills/new") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "All Skills", href: "/dashboard/all" },
      { label: "New Skill" },
    ];
  }

  if (pathname.startsWith("/dashboard/skills/")) {
    const slug = pathname.replace("/dashboard/skills/", "").split("/")[0] ?? "";
    const skillLabel = editorConfig?.skillTitle || formatSegment(slug) || "Skill";

    const items: Crumb[] = [
      { label: "Dashboard", href: "/dashboard" },
      { label: "All Skills", href: "/dashboard/all" },
    ];

    if (editorConfig) {
      const { activeTarget, subSkills, units } = editorConfig.treeProps;
      const activeDocTitle =
        activeTarget.kind === "overview"
          ? "README.md"
          : activeTarget.kind === "subSkill"
            ? (subSkills.find((s) => s.id === activeTarget.subSkillId)?.title ??
              "Sub-skill")
            : (units.find((u) => u.id === activeTarget.unitId)?.title ??
              "Unit");

      items.push({ label: skillLabel, href: `/dashboard/skills/${slug}` });
      items.push({ label: activeDocTitle });
      return items;
    }

    items.push({ label: skillLabel });
    return items;
  }

  const segments = pathname.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ label: "Dashboard" }];
  }

  const result: Crumb[] = [{ label: "Dashboard", href: "/dashboard" }];
  segments.forEach((seg, idx) => {
    const isLast = idx === segments.length - 1;
    const href = `/dashboard/${segments.slice(0, idx + 1).join("/")}`;
    result.push({
      label: formatSegment(seg),
      href: isLast ? undefined : href,
    });
  });

  return result;
}
