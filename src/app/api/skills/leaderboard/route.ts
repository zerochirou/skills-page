import { NextResponse } from "next/server";
import { queryPublicSkills } from "@/features/skills/services/leaderboard.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;
  const rawLimit = searchParams.get("limit");
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
  const limit =
    parsedLimit !== undefined && Number.isFinite(parsedLimit)
      ? parsedLimit
      : undefined;

  const result = await queryPublicSkills({ query, limit });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
