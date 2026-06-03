import { redirect } from "next/navigation";
import Link from "next/link";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import {
  getLatestPublishedRoundNumber,
  getPublishedStandings,
  getSeasonBySlug,
} from "@/lib/data/queries";
import {
  getSurvivorCount,
  REGION_LABELS,
  type Region,
} from "@/lib/scoring-config";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const revalidate = 30;

export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string; region?: string }>;
}) {
  const { phase = "june", region = "luzon" } = await searchParams;
  const slugMap = {
    june: "june_area" as const,
    july: "july_region" as const,
    august: "august_finals" as const,
  };
  const slug = slugMap[phase as keyof typeof slugMap] ?? "june_area";

  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const season = await getSeasonBySlug(slug);
  const latestPublishedRound = season
    ? await getLatestPublishedRoundNumber(season.id)
    : 0;
  const rows = season
    ? await getPublishedStandings(
        season.id,
        slug === "august_finals" ? undefined : (region as Region)
      )
    : [];

  const cutoff =
    slug === "august_finals"
      ? 1
      : latestPublishedRound > 0
        ? getSurvivorCount(slug, latestPublishedRound, region as Region) ?? 32
        : 32;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-slate-950 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-amber-400">
            Sword Duels — {phase.toUpperCase()}
            {slug !== "august_finals" && (
              <span className="ml-2 text-xl text-amber-200/80">
                {REGION_LABELS[region as Region]}
              </span>
            )}
          </h1>
          {latestPublishedRound > 0 && (
            <p className="text-sm text-slate-400">
              After Round {latestPublishedRound}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {slug !== "august_finals" &&
            (["luzon", "ncr", "vismin"] as Region[]).map((r) => (
              <Link
                key={r}
                href={`/tv?phase=${phase}&region=${r}`}
                className={`rounded-lg px-3 py-1 ${
                  r === region
                    ? "bg-amber-500/20 text-amber-200"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {REGION_LABELS[r]}
              </Link>
            ))}
          <span className="text-slate-500">Auto-refresh 30s</span>
        </div>
      </div>
      <LeaderboardTable
        rows={rows}
        advancementCutoff={cutoff}
        showArea={slug === "june_area"}
        showRepresentatives
        seasonSlug={slug}
        latestPublishedRound={latestPublishedRound}
        compact
      />
    </div>
  );
}
