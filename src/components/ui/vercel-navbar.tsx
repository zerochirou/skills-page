"use client";

import * as React from "react";
import Link from "next/link";
import type { ReactElement } from "react";
import { useTheme } from "next-themes";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  BookText,
  LayoutGrid,
  Menu,
  Monitor,
  Moon,
  PenTool,
  Smile,
  Sun,
} from "@aliimam/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useCallback, useEffect, useSyncExternalStore } from "react";

const workspaceLinks: {
  title: string;
  icon: ReactElement;
  href: string;
  description: string;
}[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutGrid strokeWidth={2} />,
    description: "Top skills and workspace overview",
  },
  {
    title: "All Skills",
    href: "/dashboard/all",
    icon: <BookText strokeWidth={2} />,
    description: "Browse and search all your skills",
  },
  {
    title: "Create Skill",
    href: "/dashboard/skills/new",
    icon: <PenTool strokeWidth={2} />,
    description: "Start a new skill repository",
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: <Smile strokeWidth={2} />,
    description: "Edit your public profile and bio",
  },
];

export function Header() {
  const { data: session } = authClient.useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const navTriggerClass = cn(
    navigationMenuTriggerStyle(),
    "h-7.5 rounded-full bg-transparent font-normal",
    scrolled
      ? "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-foreground data-[state=open]:bg-accent",
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-between px-4 transition-colors duration-300",
        scrolled
          ? "border-b border-border bg-background/90 text-foreground backdrop-blur-md"
          : "border-b border-hairline bg-background/85 text-foreground backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <div className="flex h-14 items-center">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2.5 font-mono text-sm font-medium tracking-tight transition-colors",
              "text-foreground",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon.ico"
              alt="skills-page"
              className="size-6 rounded-sm"
            />
            <span>skills-page</span>
          </Link>
          <NavigationMenu className="ml-8 hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navTriggerClass}>
                  <Link href="/skills">Explore</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className={navTriggerClass}>
                  Workspace
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background">
                  <ul className="grid w-[460px] grid-cols-2 gap-1 p-2">
                    {workspaceLinks.map((item) => (
                      <ListItem
                        key={item.title}
                        title={item.title}
                        icon={item.icon}
                        href={item.href}
                      >
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navTriggerClass}>
                  <Link href="/how-to-use">How to Use</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navTriggerClass}>
                  <Link href="/dashboard/all">All Skills</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navTriggerClass}>
                  <Link href="/dashboard/skills/new">New Skill</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle scrolled={scrolled} />
          <Link
            href={session?.user ? "/dashboard" : "/signin"}
            className={cn(
              buttonVariants({ size: "sm" }),
              "min-h-[44px] px-4 lg:min-h-0 lg:px-3"
            )}
          >
            {session?.user ? "Dashboard" : "Sign In"}
          </Link>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation menu"
                  className="min-h-[44px] min-w-[44px] lg:hidden"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(85vw,320px)] bg-canvas text-ink">
              <SheetHeader className="border-b border-border pb-4 text-left">
                <SheetTitle className="font-mono text-sm font-medium">
                  skills-page
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile navigation" className="flex flex-col gap-1 px-4 py-4">
                <Link
                  href="/skills"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[44px] items-center rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Explore
                </Link>
                <Link
                  href="/how-to-use"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[44px] items-center rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  How to Use
                </Link>
                <div className="my-2 border-t border-border" />
                <span className="px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Workspace
                </span>
                {workspaceLinks.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <span className="text-muted-foreground">{item.icon}</span>
                    <span>{item.title}</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function ListItem({
  title,
  icon,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string;
  icon: ReactElement;
}) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild className="hover:bg-transparent">
        <Link href={href}>
          <div className="flex gap-3 items-start rounded-md p-2">
            <div className="rounded-sm border border-border/50 bg-muted/40 p-2 icon-container">
              {icon}
            </div>
            <div className="text-container">
              <div className="text-sm font-medium leading-none">{title}</div>
              <p className="text-muted-foreground line-clamp-2 pt-1 text-xs leading-snug">
                {children}
              </p>
            </div>
          </div>
        </Link>
      </NavigationMenuLink>

      <style jsx>{`
        li:hover .icon-container {
          background-color: var(--foreground);
          color: var(--background);
          transform: scale(1.05);
          transition: all 0.2s ease;
        }

        li:hover .text-container .text-sm {
          color: var(--foreground); /* Change title color on hover */
          transition: color 0.2s ease;
        }

        li:hover .text-container p {
          color: var(--foreground); /* Change description color on hover */
          transition: color 0.2s ease;
        }
      `}</style>
    </li>
  );
}

const themes = [
  {
    key: "system",
    icon: Monitor,
    label: "System theme",
  },
  {
    key: "light",
    icon: Sun,
    label: "Light theme",
  },
  {
    key: "dark",
    icon: Moon,
    label: "Dark theme",
  },
];

export type ThemeSwitcherProps = {
  value?: "light" | "dark" | "system";
  onChange?: (theme: "light" | "dark" | "system") => void;
  defaultValue?: "light" | "dark" | "system";
  className?: string;
};

const emptySubscribe = () => () => {};

function ThemeToggle({ scrolled }: { scrolled: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "size-8 rounded-full",
        !scrolled && "text-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const handleThemeClick = useCallback(
    (themeKey: "light" | "dark" | "system") => {
      setTheme(themeKey);
    },
    [setTheme],
  );

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative isolate flex h-7 rounded-full bg-background p-1 ring-1 ring-border",
        className,
      )}
    >
      {themes.map(({ key, icon: Icon, label }) => {
        const isActive = theme === key;

        return (
          <button
            aria-label={label}
            className="relative h-5 w-6 rounded-full"
            key={key}
            onClick={() => handleThemeClick(key as "light" | "dark" | "system")}
            type="button"
          >
            {isActive && (
              <div className="absolute inset-0 rounded-full bg-secondary" />
            )}
            <Icon
              className={cn(
                "relative z-10 m-auto h-3.5 w-3.5",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
