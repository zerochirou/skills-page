"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  BookOpenIcon,
  Code2Icon,
  GlobeIcon,
  MailIcon,
} from "lucide-react";

export interface FooterLink {
  title: string;
  href: string;
}

export interface MinimalFooterProps {
  description?: string;
  resources?: FooterLink[];
  company?: FooterLink[];
}

const DEFAULT_RESOURCES: FooterLink[] = [
  { title: "Explore Skills", href: "/skills" },
  { title: "Dashboard", href: "/dashboard" },
  { title: "Create Skill", href: "/dashboard/skills/new" },
];

const DEFAULT_COMPANY: FooterLink[] = [
  { title: "Home", href: "/" },
  { title: "Sign In", href: "/signin" },
  { title: "Sign Up", href: "/signup" },
];

const SOCIAL_LINKS = [
  {
    label: "GitHub",
    icon: <Code2Icon className="size-4" />,
    href: "https://github.com",
  },
  {
    label: "Documentation",
    icon: <BookOpenIcon className="size-4" />,
    href: "/skills",
  },
  {
    label: "Website",
    icon: <GlobeIcon className="size-4" />,
    href: "/",
  },
  {
    label: "Contact",
    icon: <MailIcon className="size-4" />,
    href: "mailto:hello@skills-page.dev",
  },
];

const emptySubscribe = () => () => {};

export function MinimalFooter({
  description = "Editorial repository workspace for structured learning skills, sub-skills, and units.",
  resources = DEFAULT_RESOURCES,
  company = DEFAULT_COMPANY,
}: MinimalFooterProps) {
  const year = useSyncExternalStore(
    emptySubscribe,
    () => new Date().getFullYear(),
    () => null
  );

  return (
    <footer className="relative border-t border-border bg-canvas text-foreground">
      <div className="mx-auto max-w-5xl border-x border-border">
        <div className="grid grid-cols-6 gap-6 px-4 py-8 sm:px-6 sm:py-10">
          <div className="col-span-6 flex flex-col gap-4 md:col-span-4">
            <Link
              href="/"
              className="inline-flex w-max items-center gap-2 font-mono text-sm font-medium text-foreground"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon.ico"
                alt="skills-page"
                className="size-6 rounded-sm"
              />
              <span>skills-page</span>
            </Link>
            <p className="max-w-sm font-mono text-xs leading-relaxed text-muted-foreground text-balance">
              {description}
            </p>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="inline-flex size-11 items-center justify-center rounded-[8px] border border-border bg-card text-muted-foreground transition-colors hover:border-hairline-strong hover:text-foreground sm:size-9"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="col-span-3 flex flex-col gap-2 md:col-span-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Resources
            </span>
            <div className="flex flex-col gap-1">
              {resources.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="w-max py-1 text-sm text-foreground/80 transition-colors hover:text-foreground hover:underline"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="col-span-3 flex flex-col gap-2 md:col-span-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Workspace
            </span>
            <div className="flex flex-col gap-1">
              {company.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="w-max py-1 text-sm text-foreground/80 transition-colors hover:text-foreground hover:underline"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-border px-6 py-4 text-xs text-muted-foreground sm:flex-row">
          <span className="font-mono">skills-page</span>
          <span>© {year ?? ""} skills-page. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
