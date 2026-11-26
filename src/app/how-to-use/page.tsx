import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon } from "lucide-react";
import { buildBreadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { HomeTemplate } from "@/features/home";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "How to Use Skills Page",
  description:
    "Visual walkthrough of Skills Page: dashboard, navigation, skill creation, file tree, Markdown editor, MathQuill equations, ImageKit uploads, and profile settings.",
  path: "/how-to-use",
  markdownUrl: "/llms.txt",
  keywords: ["how to use skills page", "skills page guide", "markdown editor guide"],
});

interface GuideSection {
  step: string;
  title: string;
  subtitle: string;
  image: string;
  alt: string;
  points: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    step: "01",
    title: "Dashboard Overview & Top Skills",
    subtitle: "Your central workspace for recently updated repositories.",
    image: "/assets/docs/dashboard.png",
    alt: "skills-page dashboard showing Top Skills and search bar",
    points: [
      "View your most recently updated skills under Top Skills with quick search filtering.",
      "Click View all to open /dashboard/all and browse every repository you own.",
      "Each card shows its last updated date, visibility, sub-skill/unit counts, and opens straight into the editor.",
    ],
  },
  {
    step: "02",
    title: "Platform Navigation",
    subtitle: "Move quickly between workspace views from the left sidebar.",
    image: "/assets/docs/sidebar-navigation.png",
    alt: "Platform sidebar navigation with Dashboard, All Skills, Create Skill, and Profile",
    points: [
      "Dashboard opens your workspace overview (/dashboard).",
      "All Skills lists every repository in your workspace (/dashboard/all).",
      "Create Skill launches the 2-step repository wizard (/dashboard/skills/new).",
      "Profile opens your account and public profile settings.",
    ],
  },
  {
    step: "03",
    title: "Create a New Skill Repository",
    subtitle: "Set up repository metadata and auto-generated URL slugs.",
    image: "/assets/docs/create.png",
    alt: "Create New Skill step 1 form showing Title, auto-slug, Summary, Visibility, and Status",
    points: [
      "Enter a Title and skills-page automatically generates a clean URL slug underneath.",
      "Add a short Markdown Summary that appears on Explorer and Dashboard cards.",
      "Pick Visibility (public or private) and Status (draft or published), then continue to Overview (README.md).",
    ],
  },
  {
    step: "04",
    title: "Organize Files in the Repository Tree",
    subtitle: "Manage README.md, Sub-skills (folders), and Units (pages).",
    image: "/assets/docs/editor-file-tree.png",
    alt: "Editor file tree showing README.md, expandable Sub-skill folders, and Unit pages",
    points: [
      "Click README.md to edit the main repository Overview.",
      "Use the + button to add Sub-skill folders, then add Unit pages inside each folder.",
      "Drag and drop folders or units to reorder them, or use the item menu to rename, duplicate, or delete.",
    ],
  },
  {
    step: "05",
    title: "Write with the Markdown Editor",
    subtitle: "Rich editing with GFM tables, lists, and internal [[wiki-links]].",
    image: "/assets/docs/markdown-editor.png",
    alt: "Tiptap Markdown editor with formatting toolbar and Editor/Markdown toggle",
    points: [
      "Format headings, bold, italic, strikethrough, inline code, blockquotes, links, and tables from the toolbar.",
      "Use Bullet or Ordered lists with Tab / Shift+Tab for indentation.",
      "Type [[ to insert internal wiki-links to other skills, sub-skills, or units, or toggle to raw Markdown anytime.",
    ],
  },
  {
    step: "06",
    title: "Pick an Overview Banner",
    subtitle: "Search Pixabay or Unsplash photos, or paste any image URL.",
    image: "/assets/docs/banner-picker.png",
    alt: "Banner picker popover with Pixabay/Unsplash tabs, search input, image grid, and URL input",
    points: [
      "Switch between Pixabay and Unsplash tabs to search horizontal banner photos.",
      "Click any thumbnail to apply it immediately with a soft editorial fade at the top of Overview.",
      "Alternatively, paste a custom image URL or click Remove Banner to clear it.",
    ],
  },
  {
    step: "07",
    title: "Header Controls & Publishing",
    subtitle: "Manage banner, visibility, publishing status, and settings in one place.",
    image: "/assets/docs/editor-header-controls.png",
    alt: "Editor header controls showing Banner, Public/Private, Published/Draft, and Settings buttons",
    points: [
      "Click Banner to open the Pixabay/Unsplash image selector.",
      "Toggle Visibility between Public and Private.",
      "Switch Status between Draft and Published so your repository appears on your public profile.",
      "Open Settings to update repository metadata or manage advanced options.",
    ],
  },
  {
    step: "08",
    title: "Profile & Workspace Settings",
    subtitle: "Customize your public identity at /{username}.",
    image: "/assets/docs/profile-settings.png",
    alt: "Settings page showing Public profile and Workspace preferences",
    points: [
      "Click Edit profile to set your banner, avatar, first and last name, username, website, and biography.",
      "Your published public skills automatically appear on your public profile page at /{username}.",
    ],
  },
];

const SHORTCUTS = [
  { key: "[[", action: "Open internal Wiki-Link autocomplete" },
  { key: "Tab / Shift+Tab", action: "Indent or outdent list items" },
  { key: "Cmd / Ctrl + S", action: "Save Overview or active Unit" },
  { key: "/", action: "Focus search on the Skills Explorer" },
];

export default function HowToUsePage() {
  return (
    <HomeTemplate>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Skills Page", path: "/" },
          { name: "How to Use", path: "/how-to-use" },
        ])}
      />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <header className="flex flex-col gap-4 border-b border-border pb-8">
          <span className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Visual Guide · Skills Page
          </span>
          <h1 className="max-w-2xl font-serif text-4xl font-normal tracking-tight text-primary sm:text-5xl">
            How to use Skills Page
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            A visual walkthrough of every part of the workspace: creating
            a{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              Skill
            </code>{" "}
            repository, organizing{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              Sub-skills
            </code>{" "}
            &amp;{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              Units
            </code>{" "}
            , and publishing to your profile.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="default"
              nativeButton={false}
              render={<Link href="/dashboard/skills/new" />}
              className="bg-primary text-primary-foreground hover:bg-primary-active"
            >
              Create New Skill
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              <BookOpenIcon data-icon="inline-start" />
              Open Dashboard
            </Button>
          </div>
        </header>

        <div className="flex flex-col gap-10">
          {GUIDE_SECTIONS.map((section) => (
            <section
              key={section.step}
              className="grid items-center gap-6 rounded-[12px] border border-border bg-card p-5 md:grid-cols-[1.15fr_1fr] md:p-6"
            >
              <div className="overflow-hidden rounded-[8px] border border-border bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={section.image}
                  alt={section.alt}
                  className="h-auto w-full object-cover"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="font-mono text-xs text-muted-foreground">
                  STEP {section.step}
                </span>
                <h2 className="text-xl font-normal tracking-tight text-foreground">
                  {section.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {section.subtitle}
                </p>
                <ul className="flex flex-col gap-2 pt-1 text-sm text-muted-foreground">
                  {section.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>

        <section className="rounded-[12px] border border-border bg-card p-6">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-base font-medium text-foreground">
              Keyboard &amp; Editor Shortcuts
            </h2>
            <p className="text-sm text-muted-foreground">
              Speed up writing and navigation inside the workspace.
            </p>
          </div>
          <div className="divide-y divide-border">
            {SHORTCUTS.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="text-sm text-muted-foreground">
                  {item.action}
                </span>
                <kbd className="shrink-0 rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </section>
      </div>
    </HomeTemplate>
  );
}
