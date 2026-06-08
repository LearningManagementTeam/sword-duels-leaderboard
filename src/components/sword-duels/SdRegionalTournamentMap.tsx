"use client";

import Link from "next/link";
import { REGION_PLAYOFF_ACCENTS } from "@/lib/playoff-map";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { areaSlug } from "@/lib/products/sword-duels/area-groups";
import {
  SD_REGIONAL_TOURNAMENT_COLUMNS,
  isSdWildcardSlot,
  sdAreaFullName,
  sdAreaShortLabel,
  type SdRegionalMapColumn,
} from "@/lib/products/sword-duels/regional-tournament-map";

interface Props {
  /** Show R1 · R2 · R3 converging to national champion below the regional columns. */
  showChampion?: boolean;
  compact?: boolean;
  className?: string;
}

const REGION_TITLE_GRADIENT: Record<
  SdRegionalMapColumn["region"],
  string
> = {
  luzon: "from-emerald-400 via-teal-300 to-cyan-400",
  ncr: "from-cyan-400 via-sky-300 to-fuchsia-400",
  vismin: "from-lime-400 via-emerald-300 to-violet-400",
};

function areaHref(n: number): string {
  if (isSdWildcardSlot(n)) {
    return `${SWORD_DUELS_PUBLIC}/nationals#wildcard`;
  }
  return `${SWORD_DUELS_PUBLIC}/${areaSlug(sdAreaFullName(n))}`;
}

function AreaNode({
  areaNumber,
  compact,
}: {
  areaNumber: number;
  compact?: boolean;
}) {
  const wildcard = isSdWildcardSlot(areaNumber);
  const size = compact ? "h-11 w-11 text-xs" : "h-12 w-12 text-sm";

  return (
    <Link
      href={areaHref(areaNumber)}
      title={sdAreaFullName(areaNumber)}
      className={`flex ${size} shrink-0 items-center justify-center rounded-full font-bold text-sd-deep shadow-md ring-2 transition hover:scale-105 ${
        wildcard
          ? "bg-gradient-to-br from-violet-400 via-fuchsia-400 to-indigo-500 text-white ring-fuchsia-300/50 shadow-[0_0_16px_rgb(192_132_252/0.45)]"
          : "bg-gradient-to-br from-emerald-300 via-teal-300 to-cyan-400 ring-emerald-200/40 shadow-[0_0_12px_rgb(52_211_153/0.35)]"
      }`}
    >
      {sdAreaShortLabel(areaNumber)}
    </Link>
  );
}

function RegionalNode({
  label,
  compact,
}: {
  label: string;
  compact?: boolean;
}) {
  const size = compact ? "h-16 w-16 text-lg" : "h-[4.5rem] w-[4.5rem] text-xl";
  return (
    <div
      className={`flex ${size} items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-yellow-500 font-black text-sd-deep shadow-[0_0_24px_rgb(251_191_36/0.4)] ring-2 ring-amber-200/50`}
    >
      {label}
    </div>
  );
}

function bracketPaths(column: SdRegionalMapColumn, width: number, height: number): string {
  const pairCount = column.pairs.length;
  const pairTop = 36;
  const pairStep = pairCount === 3 ? 76 : 88;
  const nodeY = (i: number) => pairTop + i * pairStep;
  const leftX = width * 0.22;
  const rightX = width * 0.78;
  const busY = height - (compactHeightOffset(pairCount) + 56);
  const regionalY = height - 28;
  const centerX = width / 2;

  const mids = column.pairs.map((_, i) => ({
    x: centerX,
    y: nodeY(i) + 18,
    top: nodeY(i),
  }));

  const parts: string[] = [];

  for (const mid of mids) {
    parts.push(`M ${leftX} ${mid.top} L ${rightX} ${mid.top}`);
    parts.push(`M ${mid.x} ${mid.top} L ${mid.x} ${mid.y}`);
    parts.push(`M ${mid.x} ${mid.y} L ${mid.x} ${busY}`);
  }

  if (mids.length > 1) {
    const leftBus = Math.min(...mids.map((m) => m.x));
    const rightBus = Math.max(...mids.map((m) => m.x));
    parts.push(`M ${leftBus} ${busY} L ${rightBus} ${busY}`);
  }

  parts.push(`M ${centerX} ${busY} L ${centerX} ${regionalY}`);

  return parts.join(" ");
}

function compactHeightOffset(pairCount: number): number {
  return pairCount === 3 ? 72 : 64;
}

function columnHeight(pairCount: number, compact?: boolean): number {
  const base = pairCount === 3 ? 300 : 260;
  return compact ? base - 24 : base;
}

function RegionalColumn({
  column,
  compact,
}: {
  column: SdRegionalMapColumn;
  compact?: boolean;
}) {
  const accent = REGION_PLAYOFF_ACCENTS[column.region];
  const height = columnHeight(column.pairs.length, compact);
  const width = 176;
  const pairTop = 36;
  const pairStep = column.pairs.length === 3 ? 76 : 88;

  return (
    <div className="flex flex-col items-center">
      <h3
        className={`mb-4 bg-gradient-to-r ${REGION_TITLE_GRADIENT[column.region]} bg-clip-text text-center font-black tracking-wide text-transparent ${
          compact ? "text-lg" : "text-xl sm:text-2xl"
        }`}
      >
        {column.label}
      </h3>

      <div className="relative w-full max-w-[11rem]" style={{ height }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <path
            d={bracketPaths(column, width, height)}
            fill="none"
            className={accent.connector}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.75"
          />
        </svg>

        {column.pairs.map((pair, i) => (
          <div
            key={`${pair[0]}-${pair[1]}`}
            className="absolute left-0 right-0 flex items-center justify-center gap-5 sm:gap-6"
            style={{ top: pairTop + i * pairStep }}
          >
            <AreaNode areaNumber={pair[0]} compact={compact} />
            <AreaNode areaNumber={pair[1]} compact={compact} />
          </div>
        ))}

        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: 0 }}
        >
          <RegionalNode label={column.regionalNode.label} compact={compact} />
        </div>
      </div>
    </div>
  );
}

function ChampionConvergence({ compact }: { compact?: boolean }) {
  return (
    <div className="mt-8 space-y-5 border-t border-emerald-500/15 pt-8">
      <svg
        viewBox="0 0 400 72"
        className="mx-auto h-14 w-full max-w-xl"
        aria-hidden
      >
        <path
          d="M 66 8 C 66 40, 200 44, 200 64"
          fill="none"
          stroke="#34d399"
          strokeWidth="2"
          opacity="0.6"
        />
        <path
          d="M 200 8 L 200 64"
          fill="none"
          stroke="#e879f9"
          strokeWidth="2"
          opacity="0.6"
        />
        <path
          d="M 334 8 C 334 40, 200 44, 200 64"
          fill="none"
          stroke="#a3e635"
          strokeWidth="2"
          opacity="0.6"
        />
      </svg>

      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80">
          National finals
        </p>
        <div
          className={`flex items-center justify-center rounded-full bg-gradient-to-br from-sd-gold via-amber-300 to-yellow-400 font-black text-sd-deep shadow-[0_0_32px_rgb(250_204_21/0.45)] ring-2 ring-amber-200/60 ${
            compact ? "h-20 w-20 text-base" : "h-24 w-24 text-lg"
          }`}
        >
          ★
        </div>
        <p className="max-w-md text-sm font-semibold text-white">
          National champion
        </p>
        <p className="max-w-lg text-xs text-sd-muted">
          R1, R2, and R3 winners join the knockout bracket — Area 1 vs Area 2
          through Area 15 vs Wild card — until one branch holds the crown.
        </p>
        <Link href={`${SWORD_DUELS_PUBLIC}/nationals`} className="sd-link text-sm">
          View nationals bracket →
        </Link>
      </div>
    </div>
  );
}

export function SdRegionalTournamentMap({
  showChampion = true,
  compact = false,
  className = "",
}: Props) {
  return (
    <section className={`space-y-5 ${className}`}>
      <header className="space-y-1 text-center sm:text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/80">
          Regional funnel
        </p>
        <h3
          className={`font-bold text-white ${compact ? "text-base" : "text-lg sm:text-xl"}`}
        >
          Areas by region → regional finals
        </h3>
        <p className="text-xs leading-relaxed text-sd-muted sm:text-sm">
          Fifteen area representatives plus the wild card (A16). Each region
          pairs its areas; winners converge to R1, R2, and R3 before the
          national knockout.
        </p>
      </header>

      <div className="rounded-2xl bg-gradient-to-b from-sd-deep/30 to-sd-panel/40 p-4 ring-1 ring-emerald-500/10 sm:p-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
          {SD_REGIONAL_TOURNAMENT_COLUMNS.map((column) => (
            <RegionalColumn key={column.region} column={column} compact={compact} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-4 text-[10px] text-sd-muted/80">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-400" />
            Area rep
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500" />
            Wild card (A16)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-gradient-to-br from-amber-300 to-orange-400" />
            Regional node
          </span>
        </div>

        {showChampion && <ChampionConvergence compact={compact} />}
      </div>
    </section>
  );
}
