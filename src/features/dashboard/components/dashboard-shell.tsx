"use client";

import { authClient } from "@/features/auth/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { UserSkillsGrid } from "./user-skills-grid";

export function DashboardShell() {
  const { data: session, isPending } = authClient.useSession();

  const editorName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "User";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-normal tracking-tight">
          {isPending ? (
            <Skeleton className="h-8 w-56" />
          ) : (
            `Welcome back, ${editorName}`
          )}
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your skill repositories, sub-skills, and Markdown units.
        </p>
      </div>

      <UserSkillsGrid
        title="Top Skills"
        description="Your most recently updated repositories."
        limit={3}
        showSearch
        showViewAll
      />
    </div>
  );
}
