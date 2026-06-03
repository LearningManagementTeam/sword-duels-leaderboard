import Link from "next/link";
import { LeaderboardTable } from "./LeaderboardTable";
import { PhaseNav } from "./PhaseNav";
import { PreviewBanner } from "./PreviewBanner";
import { SetupBanner } from "./SetupBanner";
import {
  getLatestPublishedRoundNumber,
  getLastPublishedAt,
  getPublishedStandings,
  getSeasonBySlug,
} from "@/lib/data/queries";
import {
  getSurvivorCount,
  SCORING_CONFIG,
  REGION_LABELS,
  usesPerRoundElimination,
} from "@/lib/scoring-config";
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
  const latestPublishedRound =
    season && configured && !isPreview
      ? await getLatestPublishedRoundNumber(season.id)
      : demoRows?.[0]?.latest_published_round ?? 3;

  const rows =
    isPreview && demoRows
      ? demoRows
      : season && configured && region
        ? await getPublishedStandings(season.id, region)
        : [];
  const lastPublished =
    !isPreview && season && configured
      ? await getLastPublishedAt(season.id)
      : null;

  const config = SCORING_CONFIG[slug];
  const perRound = usesPerRoundElimination(slug);

  let cutoff = 24;
  let cutLineLabel: string | undefined;

  if (perRound && region && latestPublishedRound > 0) {
    cutoff =
      getSurvivorCount(slug, latestPublishedRound, region) ??
      (slug === "june_area" ? 32 : 4);
    if (latestPublishedRound < config.roundCount) {
      cutLineLabel = `Cut line — top ${cutoff} advance to Round ${latestPublishedRound + 1}`;
    } else if (slug === "june_area") {
      cutLineLabel = `Cut line — top ${cutoff} advance to July`;
    } else {
      cutLineLabel = `Cut line — top ${cutoff} advance to August`;
    }
  } else if (slug === "august_finals") {
    cutoff = 1;
  }

  const basePath = isPreview ? "/preview" : "";
  const exportPath =
    (phase === "june" || phase === "july") && region
      ? `/api/export/${phase}?region=${region}`
      : `/api/export/${phase}`;

  const regionLinks = (["luzon", "ncr", "vismin"] as Region[]).map((r) => ({
    href: `${basePath}/${phase}/${r}`,
    label: REGION_LABELS[r],
  }));

  const needsRegion = (phase === "june" || phase === "july") && perRound;

  return (
    <div className="space-y-6">
      {isPreview && <PreviewBanner />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{config.name}</h2>
          {region && (
            <p className="text-amber-300">{REGION_LABELS[region]} region</p>
          )}
          {perRound && latestPublishedRound > 0 && (
            <p className="mt-1 text-sm text-slate-400">
              Standings after Round {latestPublishedRound}
            </p>
          )}
          {isPreview ? (
            <p className="mt-1 text-xs text-slate-500">
              Sample data · {rows.length} branches
              {region ? ` · ${REGION_LABELS[region]}` : ""}
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
        {!isPreview && region && (
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
        <PhaseNav active={phase} basePath="/preview" />
      ) : (
        <PhaseNav active={phase} />
      )}

      {needsRegion && !region && (
        <div className="flex flex-wrap gap-2">
          {regionLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              {l.label}
            </Link>
          ))}
          <p className="w-full text-xs text-slate-500">
            Select a region to view its leaderboard and cut lines.
          </p>
        </div>
      )}

      {needsRegion && !region ? null : (
        <LeaderboardTable
          rows={rows}
          advancementCutoff={cutoff}
          cutLineLabel={cutLineLabel}
          showArea={slug === "june_area"}
          showRegion={false}
          showRepresentatives
          seasonSlug={slug}
          latestPublishedRound={latestPublishedRound}
        />
      )}
    </div>
  );
}