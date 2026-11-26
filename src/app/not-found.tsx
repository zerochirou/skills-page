import Link from "next/link";
import { HomeTemplate } from "@/features/home/components/home-template";

export default function NotFound() {
  return (
    <HomeTemplate>
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center px-6 py-20">
        <div className="w-full rounded-xl border border-border bg-card p-8 sm:p-10">
          <p className="font-mono text-xs font-medium tracking-wider text-primary uppercase">
            404 · Not Found
          </p>
          <h1 className="mt-3 font-serif text-3xl font-normal tracking-[-0.02em] text-primary sm:text-4xl">
            This page could not be found.
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            The skill, unit, or profile you requested does not exist, has been
            moved, or is not publicly visible.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-active"
            >
              Back to home
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </div>
    </HomeTemplate>
  );
}
