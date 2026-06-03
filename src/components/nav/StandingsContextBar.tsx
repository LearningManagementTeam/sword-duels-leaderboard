import Link from "next/link";
import { PhaseNav } from "@/components/PhaseNav";
import { buildBoardContextHeadline } from "@/lib/home-standings-display";
import type { Region } from "@/lib/scoring-config";
import type { SeasonSlug } from "@/lib/scoring-config";

interface Props {
  phase: "june" | "july" | "august";
  region?: Region;
  latestPublishedRound: number;
  lastPublished: string | null;
  seasonSlug: SeasonSlug;
  basePath?: string;
  showRegions: boolean;
  fullBoardActive?: boolean;
}

export function StandingsContextBar({
  phase,
  region,
  latestPublishedRound,
  lastPublished,
  seasonSlug,
  basePath = "",
  showRegions,
  fullBoardActive = false,
}: Props) {
  const headline = buildBoardContextHeadline(
    seasonSlug,
    latestPublishedRound,
    region,
    fullBoardActive
  );
  const regionLinks = (["luzon", "ncr", "vismin"] as Region[]).map((r) => ({
    href: `${basePath}/${phase}/${r}`,
    label: r === "luzon" ? "Luzon" : r === "ncr" ? "NCR" : "VisMin",
  }));

  const pillActive =
    "bg-gradient-to-r from-sd-lime to-emerald-400 text-sd-deep";
  const pillIdle = "sd-glass text-sd-muted hover:text-sd-glow";

  return (
    <div className="sticky top-0 z-40 -mx-4 border-b border-emerald-500/15 bg-sd-deep/95 px-4 py-4 backdrop-blur-xl md:top-[3.25rem] md:mx-0 md:rounded-2xl md:border md:border-emerald-500/20">
      <header className="space-y-2 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <span className="rounded-full bg-gradient-to-r from-sd-lime/20 to-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sd-glow ring-1 ring-emerald-400/30">
            {headline.phaseLabel}
          </span>
          {headline.regionLabel && (
            <span className="rounded-full sd-glass px-3 py-1 text-xs font-semibold text-white ring-1 ring-emerald-400/20">
              {headline.regionLabel}
            </span>
          )}
        </div>
        <p className="text-base font-medium text-white">{headline.roundLine}</p>
        {headline.mechanicsLine && (
          <p className="text-sm text-sd-muted">{headline.mechanicsLine}</p>
        )}
        {headline.scopeLine && (
          <p className="text-xs text-sd-muted/80">{headline.scopeLine}</p>
        )}
        {lastPublished && (
          <p className="text-[11px] text-sd-muted/60">
            Updated{" "}
            {new Date(lastPublished).toLocaleString("en-PH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        )}
      </header>

      <div className="mt-4 space-y-2.5">
        <PhaseNav
          active={phase}
          basePath={basePath}
          defaultRegion={region ?? "luzon"}
          compact
        />
        {showRegions && (
          <div
            className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start"
            role="tablist"
            aria-label="Region"
          >
            {regionLinks.map((l) => {
              const active =
                !fullBoardActive && region && l.href.endsWith(`/${region}`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  role="tab"
                  aria-selected={active}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active ? pillActive : pillIdle
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            {seasonSlug === "june_area" && latestPublishedRound >= 3 && (
              <Link
                href={`${basePath}/june/leaderboard`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  fullBoardActive ? pillActive : pillIdle
                }`}
              >
                Full board
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
