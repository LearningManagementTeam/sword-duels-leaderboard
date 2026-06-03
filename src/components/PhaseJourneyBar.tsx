"use client";

import type { SeasonSlug } from "@/lib/scoring-config";
import { getSurvivorCount, SCORING_CONFIG } from "@/lib/scoring-config";
import type { Region } from "@/lib/scoring-config";

interface Props {
  seasonSlug: SeasonSlug;
  latestPublishedRound: number;
  region?: Region;
}

export function PhaseJourneyBar({
  seasonSlug,
  latestPublishedRound,
  region,
}: Props) {
  const config = SCORING_CONFIG[seasonSlug];
  const roundCount = config.roundCount;
  const rounds = Array.from({ length: roundCount }, (_, i) => i + 1);

  let statusLine = "No rounds published yet.";
  if (latestPublishedRound > 0 && region && "survivorsPerRound" in config) {
    const survivors = getSurvivorCount(
      seasonSlug,
      latestPublishedRound,
      region
    );
    if (latestPublishedRound < roundCount) {
      statusLine = `You are here: after Round ${latestPublishedRound} — top ${survivors ?? "?"} advance to Round ${latestPublishedRound + 1}`;
    } else if (seasonSlug === "june_area") {
      statusLine = `You are here: after Round ${latestPublishedRound} — top ${survivors ?? 8} per region advance to July`;
    } else if (seasonSlug === "july_region") {
      statusLine = `You are here: after Round ${latestPublishedRound} — regional champions advance to August`;
    }
  } else if (latestPublishedRound > 0) {
    statusLine = `Standings after Round ${latestPublishedRound}`;
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {rounds.map((n) => {
          const done = latestPublishedRound >= n;
          const current =
            latestPublishedRound === n ||
            (latestPublishedRound === 0 && n === 1);
          const upcoming = latestPublishedRound < n - 1 || (latestPublishedRound === 0 && n > 1);

          return (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                  done
                    ? "bg-emerald-600/30 text-emerald-300 ring-2 ring-emerald-500/50"
                    : current && latestPublishedRound > 0
                      ? "bg-amber-500 text-slate-900 ring-2 ring-amber-400"
                      : upcoming
                        ? "bg-slate-800 text-slate-500"
                        : "bg-slate-800 text-slate-400 ring-1 ring-slate-600"
                }`}
              >
                R{n}
              </div>
              {n < roundCount && (
                <span
                  className={`hidden h-0.5 w-6 sm:block ${
                    latestPublishedRound > n ? "bg-emerald-500/60" : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-slate-300">{statusLine}</p>
    </div>
  );
}
