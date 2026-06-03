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
  const progressPct =
    roundCount > 0
      ? Math.min(100, (latestPublishedRound / roundCount) * 100)
      : 0;

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
    <div className="sd-neon-panel p-4">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-sd-muted/70">
        <span>Round progress</span>
        <span className="text-sd-glow">
          R{latestPublishedRound} / R{roundCount}
        </span>
      </div>
      <div className="sd-neon-track mb-4">
        <div
          className="sd-neon-track-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="sd-inset flex flex-wrap items-center gap-2 rounded-xl p-3">
        {rounds.map((n) => {
          const done = latestPublishedRound >= n;
          const current =
            latestPublishedRound === n ||
            (latestPublishedRound === 0 && n === 1);
          const upcoming =
            latestPublishedRound < n - 1 ||
            (latestPublishedRound === 0 && n > 1);

          return (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                  done
                    ? "bg-emerald-600/40 text-emerald-200 ring-2 ring-emerald-400/50"
                    : current && latestPublishedRound > 0
                      ? "bg-sd-lime text-sd-deep ring-2 ring-fuchsia-400/40 shadow-[0_0_12px_rgb(163_230_53/0.4)]"
                      : upcoming
                        ? "bg-slate-900/80 text-slate-500"
                        : "bg-slate-900/80 text-slate-400 ring-1 ring-slate-600"
                }`}
              >
                R{n}
              </div>
              {n < roundCount && (
                <span
                  className={`hidden h-0.5 w-6 sm:block ${
                    latestPublishedRound > n
                      ? "bg-gradient-to-r from-emerald-500 to-fuchsia-500/60"
                      : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-sd-muted">{statusLine}</p>
    </div>
  );
}
