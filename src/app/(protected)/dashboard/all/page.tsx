import { UserSkillsGrid } from "@/features/dashboard/components/user-skills-grid";

export default function AllSkillsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-normal tracking-tight">All Skills</h1>
        <p className="text-sm text-muted-foreground">
          Browse and search every skill repository in your workspace.
        </p>
      </div>

      <UserSkillsGrid />
    </div>
  );
}
