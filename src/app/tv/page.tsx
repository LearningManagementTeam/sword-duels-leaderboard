import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { TvLeaderboardView } from "@/components/tv/TvLeaderboardView";
import {
  getLatestPublishedRoundNumber,
  getLastPublishedAt,
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
  searchParams: Promise<{ phase?: string; region?: string; rotate?: string }>;
}) {
  const { phase = "june", region = "luzon", rotate } = await searchParams;
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
  const reg = region as Region;
  const rows = season
    ? await getPublishedStandings(
        season.id,
        slug === "august_finals" ? undefined : reg
      )
    : [];
  const lastPublished = season ? await getLastPublishedAt(season.id) : null;

  const cutoff =
    slug === "august_finals"
      ? 1
      : latestPublishedRound > 0
        ? getSurvivorCount(slug, latestPublishedRound, reg) ?? 32
        : 32;

  let cutLineLabel: string | undefined;
  if (latestPublishedRound > 0 && slug !== "august_finals") {
    cutLineLabel = `Top ${cutoff} — Round ${latestPublishedRound + 1}`;
  }

  const rotateQuery = rotate ? `&rotate=${rotate}` : "";

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-slate-950 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          {(["june", "july", "august"] as const).map((p) => (
            <Link
              key={p}
              href={`/tv?phase=${p}${p !== "august" ? `&region=${region}` : ""}${rotateQuery}`}
              className={`rounded-lg px-3 py-1 capitalize ${
                p === phase
                  ? "bg-amber-500/20 text-amber-200"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
        {slug !== "august_finals" && (
          <div className="flex flex-wrap items-center gap-2">
            {(["luzon", "ncr", "vismin"] as Region[]).map((r) => (
              <Link
                key={r}
                href={`/tv?phase=${phase}&region=${r}${rotateQuery}`}
                className={`rounded-lg px-3 py-1 ${
                  r === region
                    ? "bg-amber-500/20 text-amber-200"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {REGION_LABELS[r]}
              </Link>
            ))}
            <Link
              href={`/tv?phase=${phase}&region=${region}&rotate=60`}
              className="text-slate-500 hover:text-amber-300"
            >
              Rotate 60s
            </Link>
            {rotate && (
              <Link
                href={`/tv?phase=${phase}&region=${region}`}
                className="text-slate-500 hover:text-amber-300"
              >
                Stop rotate
              </Link>
            )}
          </div>
        )}
        <span className="text-slate-500">Auto-refresh 30s</span>
      </div>

      <Suspense fallback={<p className="text-slate-400">Loading TV view…</p>}>
        <TvLeaderboardView
          phase={phase}
          initialRegion={reg}
          rows={rows}
          seasonSlug={slug}
          latestPublishedRound={latestPublishedRound}
          advancementCutoff={cutoff}
          cutLineLabel={cutLineLabel}
          lastPublished={lastPublished}
          showArea={slug === "june_area"}
        />
      </Suspense>
    </div>
  );
}
