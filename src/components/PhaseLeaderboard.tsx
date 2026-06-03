import Link from "next/link";
import { LeaderboardTable } from "./LeaderboardTable";
import { PhaseNav } from "./PhaseNav";
import { PreviewBanner } from "./PreviewBanner";
import { SetupBanner } from "./SetupBanner";
import {
  getLastPublishedAt,
  getPublishedStandings,
  getSeasonBySlug,
} from "@/lib/data/queries";
import { SCORING_CONFIG, REGION_LABELS } from "@/lib/scoring-config";
import type { Region, SeasonSlug } from "@/lib/scoring-config";
import type { StandingRow } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

interface Props {
  phase: "june" | "july" | "august";
  slug: SeasonSlug;
  region?: Region;
  demoRows?: StandingRow[];
  isPreview?: boolean;
}

export async function PhaseLeaderboard({
  phase,
  slug,
  region,
  demoRows,
  isPreview = false,
}: Props) {
  const configured = isSupabaseConfigured();
  const season =
    !isPreview && configured ? await getSeasonBySlug(slug) : null;
  const rows =
    isPreview && demoRows
      ? demoRows
      : season && configured
        ? await getPublishedStandings(season.id, region)
        : [];
  const lastPublished =
    !isPreview && season && configured
      ? await getLastPublishedAt(season.id)
      : null;

  const config = SCORING_CONFIG[slug];
  const cutoff =
    slug === "july_region"
      ? SCORING_CONFIG.july_region.advancementPerRegion
      : "advancementCount" in config
        ? (config.advancementCount ?? 1)
        : 1;

  const basePath = isPreview ? "/preview" : "";
  const exportPath =
    phase === "july" && region
      ? `/api/export/july?region=${region}`
      : `/api/export/${phase}`;

  const navPhase = phase;
  const julyRegionLinks = (["luzon", "ncr", "vismin"] as Region[]).map(
    (r) => ({
      href: `${basePath}/july/${r}`,
      label: REGION_LABELS[r],
    })
  );

  return (
    <div className="space-y-6">
      {isPreview && <PreviewBanner />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{config.name}</h2>
          {region && (
            <p className="text-amber-300">{REGION_LABELS[region]} region</p>
          )}
          {isPreview ? (
            <p className="mt-1 text-xs text-slate-500">
              Sample data · {rows.length} branches
            </p>
          ) : (
            lastPublished && (
              <p className="mt-1 text-xs text-slate-500">
                Last updated:{" "}
                {new Date(lastPublished).toLocaleString("en-PH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )
          )}
        </div>
        {!isPreview && (
          <div className="flex flex-wrap gap-2">
            <a
              href={exportPath}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              Export CSV
            </a>
          </div>
        )}
      </div>

      {!isPreview && !configured && <SetupBanner />}

      {isPreview ? (
        <PhaseNav active={navPhase} basePath="/preview" />
      ) : (
        <PhaseNav active={navPhase} />
      )}

      {phase === "july" && !region && (
        <div className="flex flex-wrap gap-2">
          {julyRegionLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              {l.label}
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
          showRepresentatives
        />
      )}
    </div>
  );
}
