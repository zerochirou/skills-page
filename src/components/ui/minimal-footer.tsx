"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { BookOpenIcon, GlobeIcon, MailIcon } from "lucide-react";

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

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  {
    label: "GitHub",
    icon: <GitHubIcon className="size-4" />,
    href: "https://github.com/zerochirou/skills-page",
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
    href: "mailto:zerochirou@gmain.com",
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
    () => null,
  );

  return (
    <footer className="relative border-t border-border bg-canvas text-foreground">
      <div className="mx-auto max-w-7xl border-x border-border">
        <div className="grid grid-cols-6 gap-6 px-4 py-8 sm:px-6 sm:py-10">
          <div className="col-span-6 flex flex-col gap-4 md:col-span-4">
            <div className="inline-flex w-max items-center gap-2 text-lg font-semibold text-primary">
              <Link href="/" className="flex items-center flex-row gap-1">
                <img
                  src="/favicon.ico"
                  alt="Skills Page"
                  className="size-6 rounded-sm"
                />
                <span>Skills Page</span>
              </Link>
              <span className="font-normal text-muted-foreground">×</span>
              <a
                href="https://zerochirou.com"
                className="flex items-center flex-row gap-1"
              >
                <img
                  src="/assets/images/zerochirou-icon.png"
                  alt="Zerochirou"
                  className="size-5 rounded-sm"
                />
                <span>Zerochirou</span>
              </a>
            </div>
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
          <span className="font-serif text-sm text-primary">
            Skills Page × Zerochirou
          </span>
          <span>© {year ?? ""} Skills Page. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
