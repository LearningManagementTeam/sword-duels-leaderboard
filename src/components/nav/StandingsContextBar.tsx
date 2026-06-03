import Link from "next/link";
import { PhaseNav } from "@/components/PhaseNav";
import { getRoundViewConfig } from "@/lib/leaderboard-display";
import { REGION_LABELS } from "@/lib/scoring-config";
import type { Region } from "@/lib/scoring-config";
import type { SeasonSlug } from "@/lib/scoring-config";

interface Props {
  phase: "june" | "july" | "august";
  region?: Region;
  latestPublishedRound: number;
  lastPublished: string | null;
  phaseTitle: string;
  seasonSlug: SeasonSlug;
  basePath?: string;
  showRegions: boolean;
}

export function StandingsContextBar({
  phase,
  region,
  latestPublishedRound,
  lastPublished,
  phaseTitle,
  seasonSlug,
  basePath = "",
  showRegions,
}: Props) {
  const roundView = getRoundViewConfig(seasonSlug, latestPublishedRound, region);
  const regionLinks = (["luzon", "ncr", "vismin"] as Region[]).map((r) => ({
    href: `${basePath}/${phase}/${r}`,
    label: REGION_LABELS[r],
  }));

  const roundLine =
    latestPublishedRound > 0
      ? roundView.roundName
      : "Round 1 kicks off soon — ranks appear after publish";

  return (
    <div className="sticky top-0 z-40 -mx-4 border-b border-emerald-500/15 bg-sd-deep/95 px-4 py-3 backdrop-blur-xl md:top-[3.25rem] md:mx-0 md:rounded-xl md:border md:border-emerald-500/20">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-white sm:text-xl">
            {phaseTitle}
          </h1>
          {region && (
            <p className="text-sm text-sd-glow">{REGION_LABELS[region]} region</p>
          )}
          <p className="mt-0.5 text-xs text-sd-muted">{roundLine}</p>
          {lastPublished && (
            <p className="text-[11px] text-sd-muted/60">
              Updated{" "}
              {new Date(lastPublished).toLocaleString("en-PH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <PhaseNav active={phase} basePath={basePath} />
        {showRegions && region && (
          <div className="flex flex-wrap gap-1.5">
            {regionLinks.map((l) => {
              const active = region && l.href.endsWith(`/${region}`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-gradient-to-r from-sd-lime to-emerald-400 text-sd-deep"
                      : "sd-glass text-sd-muted hover:text-sd-glow"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
