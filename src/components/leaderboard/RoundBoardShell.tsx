"use client";

import {
  advancingZoneCounts,
  heartsCounts,
  sortRowsForRoundView,
  splitHeartsRows,
  splitQualificationRows,
  splitSurvivalRows,
  survivalCounts,
  type RoundViewConfig,
} from "@/lib/leaderboard-display";
import { GamifiedRankList } from "./GamifiedRankList";
import { PodiumTopThree } from "./PodiumTopThree";
import type { StandingRow } from "@/lib/types";
import type { Region, SeasonSlug } from "@/lib/scoring-config";

interface Props {
  rows: StandingRow[];
  view: RoundViewConfig;
  seasonSlug?: SeasonSlug;
  region?: Region;
  advancementCutoff: number;
  cutLineLabel: string;
  highlightCode?: string | null;
  tvMode?: boolean;
  compact?: boolean;
}

export function RoundBoardShell({
  rows,
  view,
  seasonSlug,
  region,
  advancementCutoff,
  cutLineLabel,
  highlightCode,
  tvMode,
  compact,
}: Props) {
  const sorted = sortRowsForRoundView(rows, view);

  if (view.layoutVariant === "hearts_roster") {
    const { standing, fallen } = splitHeartsRows(sorted);
    const counts = heartsCounts(sorted);

    return (
      <div className="space-y-4">
        {!compact && (
          <p className="text-center text-xs text-sd-muted">
            {counts.standing} still fighting · {counts.fallen} eliminated
          </p>
        )}
        <GamifiedRankList
          rows={standing}
          advancementCutoff={advancementCutoff}
          cutLineLabel={cutLineLabel}
          highlightCode={highlightCode}
          tvMode={tvMode}
          view={view}
          seasonSlug={seasonSlug}
          zoneLabel="Still fighting"
        />
        {fallen.length > 0 && (
          <GamifiedRankList
            rows={fallen}
            advancementCutoff={0}
            cutLineLabel=""
            highlightCode={highlightCode}
            tvMode={tvMode}
            view={view}
            seasonSlug={seasonSlug}
            showRank={false}
            zoneLabel="Out of hearts"
          />
        )}
      </div>
    );
  }

  if (view.layoutVariant === "survival_roster") {
    const { standing, fallen } = splitSurvivalRows(sorted);
    const counts = survivalCounts(sorted);

    return (
      <div className="space-y-4">
        {!compact && (
          <p className="text-center text-xs text-sd-muted">
            {counts.standing} standing · {counts.fallen} out
          </p>
        )}
        <GamifiedRankList
          rows={standing}
          advancementCutoff={advancementCutoff}
          cutLineLabel={cutLineLabel}
          highlightCode={highlightCode}
          tvMode={tvMode}
          view={view}
          seasonSlug={seasonSlug}
          zoneLabel="Still standing"
        />
        {fallen.length > 0 && (
          <GamifiedRankList
            rows={fallen}
            advancementCutoff={0}
            cutLineLabel=""
            highlightCode={highlightCode}
            tvMode={tvMode}
            view={view}
            seasonSlug={seasonSlug}
            showRank={false}
            zoneLabel="Fallen"
          />
        )}
      </div>
    );
  }

  if (view.layoutVariant === "finish_order_champions") {
    const { podium, qualifiers, eliminated } = splitQualificationRows(sorted);
    const podiumRows = podium.sort(
      (a, b) => (a.round3_finish_order ?? 99) - (b.round3_finish_order ?? 99)
    );
    podiumRows.forEach((r, i) => {
      r.rank = i + 1;
    });

    return (
      <div className="space-y-4">
        {!compact && podiumRows.length > 0 && (
          <PodiumTopThree
            topThree={podiumRows}
            tvMode={tvMode}
            mode="finish_order"
            seasonSlug={seasonSlug}
            latestPublishedRound={view.latestPublishedRound}
          />
        )}
        {qualifiers.length > 0 && (
          <GamifiedRankList
            rows={qualifiers}
            advancementCutoff={advancementCutoff}
            cutLineLabel={cutLineLabel}
            highlightCode={highlightCode}
            tvMode={tvMode}
            view={view}
            seasonSlug={seasonSlug}
            zoneLabel="Qualifiers"
          />
        )}
        {eliminated.length > 0 && (
          <GamifiedRankList
            rows={eliminated}
            advancementCutoff={0}
            cutLineLabel=""
            highlightCode={highlightCode}
            tvMode={tvMode}
            view={view}
            seasonSlug={seasonSlug}
            zoneLabel="Eliminated"
          />
        )}
      </div>
    );
  }

  if (
    view.layoutVariant === "percentage_score" ||
    view.layoutVariant === "judged_score"
  ) {
    const topThree = sorted.filter((r) => r.rank <= 3);
    const rest = sorted.filter((r) => r.rank > 3);

    return (
      <div className="space-y-4">
        {!compact && (
          <p className="text-center text-xs text-sd-muted">
            Cumulative total shown on each card · Round {view.latestPublishedRound}{" "}
            score in the hero badge
          </p>
        )}
        {!compact && topThree.length > 0 && (
          <PodiumTopThree
            topThree={topThree}
            tvMode={tvMode}
            mode="quiz_score"
            seasonSlug={seasonSlug}
            latestPublishedRound={view.latestPublishedRound}
          />
        )}
        <GamifiedRankList
          rows={rest.length > 0 ? rest : sorted}
          advancementCutoff={advancementCutoff}
          cutLineLabel={cutLineLabel}
          highlightCode={highlightCode}
          tvMode={tvMode}
          view={view}
          seasonSlug={seasonSlug}
          zoneLabel={
            view.layoutVariant === "judged_score"
              ? "Judge scores"
              : "Round scores"
          }
        />
      </div>
    );
  }

  if (view.layoutVariant === "quiz_ladder") {
    const counts = advancingZoneCounts(sorted, advancementCutoff);
    const zoneLabel =
      seasonSlug === "june_area" && view.latestPublishedRound === 1
        ? "Advancing to Last KaBingoPlus Standing"
        : "Advancing to Round 2";

    const advancing = sorted.filter(
      (r) => r.status !== "tie_breaker" && r.status !== "eliminated"
    );
    const tieBreak = sorted.filter((r) => r.status === "tie_breaker");
    const eliminated = sorted.filter((r) => r.status === "eliminated");

    if (tieBreak.length === 0) {
      return (
        <div className="space-y-4">
          {!compact && (
            <p className="text-center text-xs text-sd-muted">
              {counts.advancing} advancing · {counts.eliminated} eliminated
            </p>
          )}
          <GamifiedRankList
            rows={sorted}
            advancementCutoff={advancementCutoff}
            cutLineLabel={cutLineLabel}
            highlightCode={highlightCode}
            tvMode={tvMode}
            view={view}
            seasonSlug={seasonSlug}
            zoneLabel={zoneLabel}
          />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {!compact && (
          <p className="text-center text-xs text-sd-muted">
            {counts.advancing} advancing
            {counts.tieBreaker > 0 && ` · ${counts.tieBreaker} tie breaker`}
            {` · ${counts.eliminated} eliminated`}
          </p>
        )}
        {advancing.length > 0 && (
          <GamifiedRankList
            rows={advancing}
            advancementCutoff={advancementCutoff}
            cutLineLabel={cutLineLabel}
            highlightCode={highlightCode}
            tvMode={tvMode}
            view={view}
            seasonSlug={seasonSlug}
            zoneLabel={zoneLabel}
          />
        )}
        {tieBreak.length > 0 && (
          <GamifiedRankList
            rows={tieBreak}
            advancementCutoff={0}
            cutLineLabel={cutLineLabel}
            highlightCode={highlightCode}
            tvMode={tvMode}
            view={view}
            seasonSlug={seasonSlug}
            zoneLabel="Tie breaker at cut line"
          />
        )}
        {eliminated.length > 0 && (
          <>
            {tieBreak.length > 0 && (
              <div className="sd-cut-shimmer rounded-lg border border-sd-glow/40 bg-emerald-500/10 px-3 py-2 text-center text-xs font-semibold text-sd-glow">
                {cutLineLabel}
              </div>
            )}
            <GamifiedRankList
              rows={eliminated}
              advancementCutoff={0}
              cutLineLabel=""
              highlightCode={highlightCode}
              tvMode={tvMode}
              view={view}
              seasonSlug={seasonSlug}
              zoneLabel="Eliminated"
            />
          </>
        )}
      </div>
    );
  }

  const topThree = sorted.filter((r) => r.rank <= 3);

  return (
    <div className="space-y-4">
      {!compact && view.showPodium && topThree.length > 0 && (
        <PodiumTopThree
          topThree={topThree}
          tvMode={tvMode}
          mode={view.podiumMode === "finish_order" ? "finish_order" : "quiz_score"}
          seasonSlug={seasonSlug}
          latestPublishedRound={view.latestPublishedRound}
        />
      )}
      <GamifiedRankList
        rows={sorted}
        advancementCutoff={advancementCutoff}
        cutLineLabel={cutLineLabel}
        highlightCode={highlightCode}
        tvMode={tvMode}
        view={view}
        seasonSlug={seasonSlug}
      />
    </div>
  );
}
