import { Suspense } from "react";
import { getCachedLeaderboardSkills } from "@/features/skills/services/leaderboard.service";
import { EditorialHero } from "./editorial-hero";
import { HomeTemplate } from "./home-template";
import { SkillsExplorer, SkillsExplorerSkeleton } from "./skills-explorer";

async function HomeContent() {
  const { skills, totalCount } = await getCachedLeaderboardSkills();

  return (
    <>
      <EditorialHero recentSkills={skills} />
      <main
        id="leaderboard"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"
      >
        <SkillsExplorer initialSkills={skills} totalCount={totalCount} />
      </main>
    </>
  );
}

export function HomePage() {
  return (
    <HomeTemplate>
      <Suspense
        fallback={
          <>
            <EditorialHero />
            <main
              id="leaderboard"
              className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"
            >
              <SkillsExplorerSkeleton />
            </main>
          </>
        }
      >
        <HomeContent />
      </Suspense>
    </HomeTemplate>
  );
}
