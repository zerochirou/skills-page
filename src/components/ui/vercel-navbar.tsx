"use client";

import * as React from "react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const SUB_NAV_LINKS = [
  { label: "Explore Skills", href: "/skills" },
  { label: "How to Use", href: "/how-to-use" },
  { label: "Leaderboard", href: "/skills" },
  { label: "About", href: "/about" },
  { label: "Donate", href: "/donation" },
] as const;

const WORKSPACE_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "All Skills", href: "/dashboard/all" },
  { label: "Create Skill", href: "/dashboard/skills/new" },
  { label: "Settings", href: "/dashboard/settings" },
] as const;

function FaviconBrandMark({ className }: { className?: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/favicon.ico"
      alt=""
      aria-hidden="true"
      className={cn("size-7 rounded-sm object-contain", className)}
    />
  );
}

const emptySubscribe = () => () => {};

function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="size-10 rounded-full text-body hover:bg-accent hover:text-primary sm:size-9"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export function Header() {
  const { data: session } = authClient.useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-canvas/95 text-foreground backdrop-blur-sm">
      {/* Primary header bar */}
      <div className="border-b border-hairline">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            aria-label="Skills Page Home"
            className="inline-flex items-center gap-2.5 text-primary transition-opacity hover:opacity-80 focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <FaviconBrandMark />
            <span className="font-serif text-lg font-semibold text-primary">
              Skills Page
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggleButton />

            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden min-h-[44px] items-center px-3 text-sm font-medium text-body transition-colors hover:text-primary sm:inline-flex"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/skills/new"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-hairline-strong bg-surface-card px-4 text-sm font-medium text-primary transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  New Skill
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="hidden min-h-[44px] items-center px-3 text-sm font-medium text-body transition-colors hover:text-primary sm:inline-flex"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-hairline-strong bg-surface-card px-4 text-sm font-medium text-primary transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Sign Up
                </Link>
              </>
            )}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Open navigation menu"
                    className="size-11 md:hidden"
                  />
                }
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[min(85vw,320px)] border-hairline bg-canvas text-ink"
              >
                <SheetHeader className="border-b border-hairline pb-4 text-left">
                  <SheetTitle className="flex items-center gap-2 font-serif text-lg font-normal text-primary">
                    <FaviconBrandMark className="size-6" />
                    <span>Skills Page</span>
                  </SheetTitle>
                </SheetHeader>

                <nav
                  aria-label="Mobile navigation"
                  className="flex flex-col gap-1 px-4 py-4"
                >
                  {SUB_NAV_LINKS.map((item) => (
                    <Link
                      key={`${item.label}-${item.href}`}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-[44px] items-center rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      {item.label}
                    </Link>
                  ))}

                  <div className="my-2 border-t border-hairline" />

                  <span className="px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {session?.user ? "Workspace" : "Account"}
                  </span>

                  {session?.user ? (
                    WORKSPACE_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex min-h-[44px] items-center rounded-md px-3 text-sm text-foreground transition-colors hover:bg-accent"
                      >
                        {item.label}
                      </Link>
                    ))
                  ) : (
                    <>
                      <Link
                        href="/signin"
                        onClick={() => setMobileOpen(false)}
                        className="flex min-h-[44px] items-center rounded-md px-3 text-sm text-foreground transition-colors hover:bg-accent"
                      >
                        Log in
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setMobileOpen(false)}
                        className="flex min-h-[44px] items-center rounded-md px-3 text-sm font-medium text-primary transition-colors hover:bg-accent"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Secondary editorial sub-bar */}
      <div className="hidden border-b border-hairline md:block">
        <nav
          aria-label="Primary sections"
          className="mx-auto flex h-11 max-w-7xl items-center justify-between px-4 text-sm sm:px-6"
        >
          <div className="flex items-center gap-4">
            {SUB_NAV_LINKS.map((item, idx) => (
              <React.Fragment key={`${item.label}-${item.href}`}>
                {idx > 0 ? (
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-px bg-hairline-strong"
                  />
                ) : null}
                <Link
                  href={item.href}
                  className="font-medium text-body transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  {item.label}
                </Link>
              </React.Fragment>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
