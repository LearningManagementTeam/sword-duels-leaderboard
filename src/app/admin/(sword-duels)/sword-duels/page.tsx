import Link from "next/link";
import { SetupBanner } from "@/components/SetupBanner";
import { SdAreaGroupModeBadge } from "@/components/sword-duels/SdAreaGroupModeBadge";
import { SdGroupSortSettings } from "@/components/sword-duels/SdGroupSortSettings";
import { SdNationalsPhaseStrip } from "@/components/sword-duels/SdNationalsPhaseStrip";
import { SdTournamentFormatSettings } from "@/components/sword-duels/SdTournamentFormatSettings";
import { sdEventHasPublishedScores } from "@/lib/products/sword-duels/format-guards";
import { isRegionalAverageFormat } from "@/lib/products/sword-duels/tournament-format";
import { getSdAreaStatus } from "@/lib/products/sword-duels/area-status";
import { swordDuelsPath, SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { getSdNationalsContext } from "@/lib/products/sword-duels/nationals-queries";
import { countRegionalRoundsPublished } from "@/lib/products/sword-duels/regional-rounds";
import { loadNationalsRoster } from "@/lib/products/sword-duels/nationals-wildcard-data";
import { areaSlug } from "@/lib/products/sword-duels/area-groups";
import {
  getLastSdScoredArea,
  getSdDashboard,
  getSdEvent,
  getSdSetsForEvent,
} from "@/lib/products/sword-duels/queries";
import { loadKnockoutBracketState } from "@/lib/products/sword-duels/knockout-sync";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SwordDuelsDashboardPage() {
  const configured = isSupabaseConfigured();
  const event = configured ? await getSdEvent() : null;

  let areas: Awaited<ReturnType<typeof getSdDashboard>>["areas"] = [];
  let nationalsContext: Awaited<ReturnType<typeof getSdNationalsContext>> | null =
    null;
  let hasPublishedScores = false;
  let regionalProgress = { published: 0, total: 9 };
  let v2KnockoutBracket: Awaited<
    ReturnType<typeof loadKnockoutBracketState>
  >["bracket"] = null;
  let v2AreasDone = 0;
  let v2TotalAreas = 0;
  let lastScoredArea: string | null = null;

  if (event) {
    try {
      const [dash, lastArea] = await Promise.all([
        getSdDashboard(event.id),
        getLastSdScoredArea(event.id).catch(() => null),
      ]);
      areas = dash.areas;
      lastScoredArea = lastArea?.area ?? null;
    } catch {
      areas = [];
    }
    try {
      hasPublishedScores = await sdEventHasPublishedScores(event.id);
    } catch {
      hasPublishedScores = false;
    }

    const isV2 = isRegionalAverageFormat(event.tournament_format);
    if (isV2) {
      try {
        const [roster, sets, ko] = await Promise.all([
          loadNationalsRoster(event.id),
          getSdSetsForEvent(event.id),
          loadKnockoutBracketState(event.id),
        ]);
        regionalProgress = countRegionalRoundsPublished(sets);
        v2KnockoutBracket = ko.bracket;
        v2AreasDone = roster.publishedAreaCount;
        v2TotalAreas = roster.totalAreaCount;
      } catch {
        /* optional */
      }
    } else {
      try {
        nationalsContext = await getSdNationalsContext(event.id);
      } catch {
        nationalsContext = null;
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Sword Duels</h1>
        <p>
          Area group tournaments — branches split into two groups per area. Group
          winners battle for the one area representative spot.
        </p>
      </div>

      <div className="sd-alert-info text-sm">
        <strong className="text-white">Branch import</strong> lives under{" "}
        <Link href="/admin/hris/branches" className="sd-link">
          HRIS → Branches
        </Link>
        . Score area battles here — not on the June/July/August round editor.
        See{" "}
        <code className="text-xs">docs/SD-DAILY-OPERATIONS.md</code> for the full
        operator sequence.
      </div>

      {!configured && <SetupBanner />}

      {configured && event && (
        <>
          <SdTournamentFormatSettings
            currentFormat={event.tournament_format ?? "classic_v1"}
            hasPublishedScores={hasPublishedScores}
          />
          <SdGroupSortSettings
            currentMode={event.group_sort_mode ?? "branch_code"}
            manualAreaCount={(event.manual_area_groups ?? []).length}
          />
        </>
      )}

      {event &&
        (isRegionalAverageFormat(event.tournament_format) ? (
          <SdNationalsPhaseStrip
            format={event.tournament_format}
            areasDone={v2AreasDone}
            totalAreas={v2TotalAreas}
            knockoutBracket={v2KnockoutBracket}
            regionalPublished={regionalProgress.published}
            regionalTotal={regionalProgress.total}
          />
        ) : (
          nationalsContext && (
            <SdNationalsPhaseStrip
              format={event.tournament_format ?? "classic_v1"}
              areasDone={nationalsContext.model.roster.publishedAreaCount}
              totalAreas={nationalsContext.model.roster.totalAreaCount}
              knockoutBracket={nationalsContext.knockoutBracket}
              wildcardModel={nationalsContext.model}
            />
          )
        ))}

      {configured && !event && (
        <div className="sd-neon-panel space-y-2 p-4 text-sm text-amber-100">
          <p>
            Sword Duels could not load the event row. If you already ran{" "}
            <code className="text-xs">016_sword_duels.sql</code> and saw
            &quot;type already exists&quot;, the migration is partially applied —
            that is normal.
          </p>
          <p>
            Run{" "}
            <code className="text-xs">016_sword_duels_repair.sql</code> in
            Supabase SQL Editor (safe to re-run), then refresh this page. The{" "}
            <strong className="text-white">Sync from branches</strong> button
            should appear.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={swordDuelsPath("representatives")}
          className="sd-neon-panel block p-5 transition hover:ring-1 hover:ring-cyan-400/30"
        >
          <h2 className="font-semibold text-white">Representatives</h2>
          <p className="mt-1 text-sm text-sd-muted">
            Enter two representatives per branch before battles run.
          </p>
        </Link>
        <Link
          href={SWORD_DUELS_PUBLIC}
          className="sd-neon-panel block p-5 transition hover:ring-1 hover:ring-cyan-400/30"
        >
          <h2 className="font-semibold text-white">Public leaderboard</h2>
          <p className="mt-1 text-sm text-sd-muted">
            Live tournament maps update as sets are published.
          </p>
        </Link>
        {event && isRegionalAverageFormat(event.tournament_format) ? (
          <Link
            href={swordDuelsPath("regionals")}
            className="sd-neon-panel block p-5 transition hover:ring-1 hover:ring-cyan-400/30"
          >
            <h2 className="font-semibold text-cyan-200">Regional rounds</h2>
            <p className="mt-1 text-sm text-sd-muted">
              Luzon / NCR / VisMin — 3 rounds, highest average wins
            </p>
          </Link>
        ) : (
          <Link
            href={swordDuelsPath("nationals")}
            className="sd-neon-panel block p-5 transition hover:ring-1 hover:ring-fuchsia-400/30"
          >
            <h2 className="font-semibold text-fuchsia-200">Nationals</h2>
            <p className="mt-1 text-sm text-sd-muted">
              Wild card + knockout bracket scoring
            </p>
          </Link>
        )}
        <Link
          href={swordDuelsPath("nationals")}
          className="sd-neon-panel block p-5 transition hover:ring-1 hover:ring-amber-400/25"
        >
          <h2 className="font-semibold text-amber-200">Finals</h2>
          <p className="mt-1 text-sm text-sd-muted">
            National championship bracket
          </p>
        </Link>
      </div>

      <section className="sd-neon-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-white">Area scoring</h2>
            {areas.length === 0 ? (
              <p className="mt-1 text-sm text-sd-muted">
                Import branches in{" "}
                <Link href="/admin/hris/branches" className="sd-link">
                  HRIS → Branches
                </Link>
                , then open Areas and click <strong className="text-white">Sync from branches</strong>.
              </p>
            ) : (
              <p className="mt-1 text-sm text-sd-muted">
                {areas.length} areas ·{" "}
                {areas.filter((a) => a.isManual).length} manual ·{" "}
                {areas.filter((a) => !a.isManual).length} auto ·{" "}
                {
                  areas.filter((a) => getSdAreaStatus(a).phase === "area_champion")
                    .length
                }{" "}
                champions crowned
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {lastScoredArea && (
              <Link
                href={swordDuelsPath("areas", areaSlug(lastScoredArea))}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-cyan-200 ring-1 ring-cyan-400/30 hover:bg-cyan-500/10"
              >
                Resume scoring — {lastScoredArea}
              </Link>
            )}
            <Link
              href={swordDuelsPath("areas")}
              className="sd-link text-sm font-medium"
            >
              Open areas →
            </Link>
          </div>
        </div>
        {areas.length > 0 && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((a) => (
              <li key={a.area}>
                <Link
                  href={swordDuelsPath("areas", areaSlug(a.area))}
                  className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/10 bg-black/20 px-3 py-2 text-sm transition hover:border-cyan-400/25 hover:bg-cyan-500/5"
                >
                  <span className="truncate font-medium text-white">{a.area}</span>
                  <SdAreaGroupModeBadge isManual={a.isManual} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
