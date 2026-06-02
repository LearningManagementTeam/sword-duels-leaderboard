import Link from "next/link";
import { LeaderboardTable } from "./LeaderboardTable";
import { PhaseNav } from "./PhaseNav";
import { SetupBanner } from "./SetupBanner";
import {
  getLastPublishedAt,
  getPublishedStandings,
  getSeasonBySlug,
} from "@/lib/data/queries";
import { SCORING_CONFIG, REGION_LABELS } from "@/lib/scoring-config";
import type { Region, SeasonSlug } from "@/lib/scoring-config";
import { isSupabaseConfigured } from "@/lib/supabase/server";

interface Props {
  phase: "june" | "july" | "august";
  slug: SeasonSlug;
  region?: Region;
}

export async function PhaseLeaderboard({ phase, slug, region }: Props) {
  const configured = isSupabaseConfigured();
  const season = configured ? await getSeasonBySlug(slug) : null;
  const rows =
    season && configured
      ? await getPublishedStandings(season.id, region)
      : [];
  const lastPublished =
    season && configured ? await getLastPublishedAt(season.id) : null;

  const config = SCORING_CONFIG[slug];
  const cutoff =
    slug === "july_region"
      ? SCORING_CONFIG.july_region.advancementPerRegion
      : "advancementCount" in config
        ? (config.advancementCount ?? 1)
        : 1;

  const exportPath =
    phase === "july" && region
      ? `/api/export/july?region=${region}`
      : `/api/export/${phase}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{config.name}</h2>
          {region && (
            <p className="text-amber-300">{REGION_LABELS[region]} region</p>
          )}
          {lastPublished && (
            <p className="mt-1 text-xs text-slate-500">
              Last updated:{" "}
              {new Date(lastPublished).toLocaleString("en-PH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={exportPath}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            Export CSV
          </a>
        </div>
      </div>

      {!configured && <SetupBanner />}

      <PhaseNav active={phase} />

      {phase === "july" && !region && (
        <div className="flex flex-wrap gap-2">
          {(["luzon", "ncr", "vismin"] as Region[]).map((r) => (
            <Link
              key={r}
              href={`/july/${r}`}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              {REGION_LABELS[r]}
            </Link>
          ))}
          <p className="w-full text-xs text-slate-500">
            Select a region to view its leaderboard.
          </p>
        </div>
      )}

      {phase === "july" && !region ? null : (
        <LeaderboardTable
          rows={rows}
          advancementCutoff={cutoff ?? 24}
          showArea={slug === "june_area"}
          showRegion={slug === "july_region" && !region}
        />
      )}
    </div>
  );
}
