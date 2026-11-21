import { Suspense } from "react";
import ElsewhereHero from "@/components/ui/elsewhere-hero";
import { getCachedLeaderboardSkills } from "@/features/skills/services/leaderboard.service";
import { HomeTemplate } from "./home-template";
import { SkillsExplorer, SkillsExplorerSkeleton } from "./skills-explorer";

async function LeaderboardSection() {
  const { skills, totalCount } = await getCachedLeaderboardSkills();
  return <SkillsExplorer initialSkills={skills} totalCount={totalCount} />;
}

export function HomePage() {
  return (
    <HomeTemplate>
      <ElsewhereHero
        hideNav
        brand="skills-page"
        links={[
          { label: "Preview", href: "#preview" },
          { label: "Capabilities", href: "#capabilities" },
          { label: "Dashboard", href: "/dashboard" },
        ]}
        navCta={{ label: "Sign in", href: "/signin" }}
        headline="The Best Way to Increase Skills."
        subline="Keep markdown notes, technical references, and reusable snippets in a clean repository interface."
        primaryCta={{ label: "Search Skills", href: "/skills" }}
        signature={false}
      />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <Suspense fallback={<SkillsExplorerSkeleton />}>
          <LeaderboardSection />
        </Suspense>
      </main>
    </HomeTemplate>
  );
}
