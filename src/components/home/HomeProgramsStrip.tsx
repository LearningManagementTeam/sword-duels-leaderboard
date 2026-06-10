import Link from "next/link";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import type { CompetitionMapConfig } from "@/lib/competition-map";
import { sdProgressLine } from "@/lib/products/sword-duels/journey-copy";
import type { SdPublicJourneyState } from "@/lib/products/sword-duels/public-journey";
import { resolvePublicStandingsHref } from "@/lib/public-standings-route";
import type { ResolvedFeaturedProgram } from "@/lib/site-home-config";

interface Props {
  featured: ResolvedFeaturedProgram;
  mapConfig: CompetitionMapConfig;
  sdJourney?: SdPublicJourneyState | null;
  ncStatusLine?: string;
}

function ProgramCard({
  href,
  title,
  subtitle,
  featured,
  progress,
}: {
  href: string;
  title: string;
  subtitle: string;
  featured: boolean;
  progress?: number | null;
}) {
  return (
    <Link
      href={href}
      className={`sd-inset block rounded-lg p-4 transition ${
        featured
          ? "ring-2 ring-cyan-400/40 hover:ring-cyan-400/55"
          : "hover:ring-1 hover:ring-emerald-400/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-white">{title}</p>
        {featured && (
          <span className="shrink-0 rounded-full bg-cyan-400/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-100 ring-1 ring-cyan-400/35">
            Live
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-sd-muted">{subtitle}</p>
      {progress != null && (
        <div className="sd-neon-track mt-2.5 h-1 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </Link>
  );
}

export function HomeProgramsStrip({
  featured,
  mapConfig,
  sdJourney,
  ncStatusLine = "June area-wide → July regional → The Nationals",
}: Props) {
  const ncHref = resolvePublicStandingsHref(mapConfig);
  const sdSubtitle =
    sdJourney && sdJourney.totalAreas > 0
      ? sdProgressLine(sdJourney)
      : "Area group battles — 2 spots fight for 1 area representative";

  const sdProgress =
    sdJourney &&
    !sdJourney.areasComplete &&
    sdJourney.totalAreas > 0 &&
    featured !== "sword_duels"
      ? Math.round((sdJourney.areasPublished / sdJourney.totalAreas) * 100)
      : featured === "sword_duels" &&
          sdJourney &&
          !sdJourney.areasComplete &&
          sdJourney.totalAreas > 0
        ? Math.round((sdJourney.areasPublished / sdJourney.totalAreas) * 100)
        : null;

  return (
    <section className="sd-neon-panel mx-auto max-w-3xl p-5">
      <h2 className="text-base font-semibold text-white">Programs</h2>
      <p className="mt-1 text-xs text-sd-muted">
        {featured === "sword_duels"
          ? "Sword Duels is featured above — National Competitions continues in parallel."
          : "National Competitions is featured above — follow Sword Duels area battles below."}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ProgramCard
          href={ncHref}
          title="National Competitions"
          subtitle={ncStatusLine}
          featured={featured === "national_competitions"}
        />
        <ProgramCard
          href={SWORD_DUELS_PUBLIC}
          title="Sword Duels"
          subtitle={sdSubtitle}
          featured={featured === "sword_duels"}
          progress={sdProgress}
        />
      </div>
    </section>
  );
}
