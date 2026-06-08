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
import type { Region } from "@/lib/scoring-config";

interface Props {
  showChampion?: boolean;
  compact?: boolean;
  className?: string;
}

function areaHref(n: number): string {
  if (isSdWildcardSlot(n)) {
    return `${SWORD_DUELS_PUBLIC}/nationals#wildcard`;
  }
  return `${SWORD_DUELS_PUBLIC}/${areaSlug(sdAreaFullName(n))}`;
}

function AreaCard({
  areaNumber,
  compact,
}: {
  areaNumber: number;
  compact?: boolean;
}) {
  const wildcard = isSdWildcardSlot(areaNumber);

  return (
    <Link
      href={areaHref(areaNumber)}
      title={sdAreaFullName(areaNumber)}
      className={`group flex min-w-0 flex-1 flex-col rounded-lg px-2 ring-1 ring-inset transition hover:scale-[1.02] ${
        compact ? "py-1.5" : "py-2.5"
      } ${
        wildcard
          ? "bg-gradient-to-r from-violet-500/20 via-fuchsia-500/15 to-indigo-500/10 ring-fuchsia-400/35 hover:ring-fuchsia-300/50"
          : "sd-glass ring-emerald-500/25 hover:ring-emerald-400/40"
      }`}
    >
      <span
        className={`font-bold tabular-nums text-white ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {sdAreaShortLabel(areaNumber)}
      </span>
      <span
        className={`truncate text-sd-muted transition group-hover:text-white/90 ${
          compact ? "text-[9px]" : "text-[10px]"
        }`}
      >
        {wildcard ? "Wild card" : sdAreaFullName(areaNumber)}
      </span>
    </Link>
  );
}

function RegionalCard({
  label,
  region,
  compact,
}: {
  label: string;
  region: Region;
  compact?: boolean;
}) {
  return (
    <div
      className={`w-full max-w-[9rem] rounded-xl bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-yellow-500/15 px-3 text-center ring-1 ring-amber-400/40 ${
        compact ? "py-2.5" : "py-3.5"
      }`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-200/75">
        Regional
      </p>
      <p
        className={`font-black text-white ${compact ? "text-lg" : "text-xl"}`}
      >
        {label}
      </p>
      <p className="mt-0.5 text-[9px] text-sd-muted/70">
        {region === "luzon" ? "Luzon" : region === "ncr" ? "NCR" : "VisMin"}{" "}
        funnel
      </p>
    </div>
  );
}

function PairMergeConnector({ pairCount }: { pairCount: number }) {
  const width = 200;
  const height = 36;
  const centers =
    pairCount === 3 ? [50, 100, 150] : pairCount === 2 ? [60, 140] : [100];

  const busY = 18;
  const bottomY = 34;

  const parts: string[] = [];
  for (const x of centers) {
    parts.push(`M ${x} 0 L ${x} ${busY}`);
  }
  if (centers.length > 1) {
    parts.push(`M ${centers[0]} ${busY} L ${centers[centers.length - 1]} ${busY}`);
  }
  const midX = (centers[0]! + centers[centers.length - 1]!) / 2;
  parts.push(`M ${midX} ${busY} L ${midX} ${bottomY}`);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto h-9 w-full max-w-[12rem]"
      aria-hidden
    >
      <path
        d={parts.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-emerald-500/45"
      />
    </svg>
  );
}

function RegionalColumn({
  column,
  compact,
}: {
  column: SdRegionalMapColumn;
  compact?: boolean;
}) {
  const accent = REGION_PLAYOFF_ACCENTS[column.region];

  return (
    <div className="sd-glass-strong flex flex-col rounded-2xl p-4 ring-1 ring-emerald-500/10 sm:p-5">
      <header className="mb-4 border-b border-emerald-500/10 pb-3 text-center">
        <span
          className={`inline-block rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] ring-1 ring-inset ${accent.badge}`}
        >
          {column.label}
        </span>
      </header>

      <div className="flex flex-col gap-2">
        {column.pairs.map((pair) => (
          <div key={`${pair[0]}-${pair[1]}`} className="flex gap-2">
            <AreaCard areaNumber={pair[0]} compact={compact} />
            <AreaCard areaNumber={pair[1]} compact={compact} />
          </div>
        ))}
      </div>

      <PairMergeConnector pairCount={column.pairs.length} />

      <div className="flex justify-center">
        <RegionalCard
          label={column.regionalNode.label}
          region={column.region}
          compact={compact}
        />
      </div>
    </div>
  );
}

function ChampionConvergence({ compact }: { compact?: boolean }) {
  return (
    <div className="mt-8 space-y-5 border-t border-emerald-500/15 pt-8">
      <svg
        viewBox="0 0 400 72"
        className="mx-auto h-14 w-full max-w-xl text-emerald-500/50"
        aria-hidden
      >
        <path
          d="M 66 8 C 66 40, 200 44, 200 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-emerald-400/55"
        />
        <path
          d="M 200 8 L 200 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-fuchsia-400/55"
        />
        <path
          d="M 334 8 C 334 40, 200 44, 200 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-lime-400/55"
        />
      </svg>

      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80">
          National finals
        </p>
        <div
          className={`sd-neon-panel w-full rounded-xl bg-gradient-to-r from-sd-gold/20 via-amber-400/15 to-yellow-500/10 px-4 ring-1 ring-amber-400/35 ${
            compact ? "py-4" : "py-5"
          }`}
        >
          <span className="text-2xl" aria-hidden>
            ★
          </span>
          <p className="mt-2 text-sm font-semibold text-white">
            National champion
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-sd-muted">
            R1, R2, and R3 feed the knockout bracket — Area 1 vs Area 2 through
            Area 15 vs Wild card — until one branch holds the crown.
          </p>
        </div>
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

      <div className="sd-inset rounded-2xl p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-3">
          {SD_REGIONAL_TOURNAMENT_COLUMNS.map((column) => (
            <RegionalColumn key={column.region} column={column} compact={compact} />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-3 text-[10px] text-sd-muted/80">
          <span className="inline-flex items-center gap-1.5 rounded-md sd-glass px-2 py-1 ring-1 ring-emerald-500/20">
            <span className="h-2.5 w-4 rounded-sm bg-emerald-500/40" />
            Area rep
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md sd-glass px-2 py-1 ring-1 ring-fuchsia-500/20">
            <span className="h-2.5 w-4 rounded-sm bg-fuchsia-500/40" />
            Wild card (A16)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md sd-glass px-2 py-1 ring-1 ring-amber-500/20">
            <span className="h-2.5 w-4 rounded-sm bg-amber-500/40" />
            Regional node
          </span>
        </div>

        {showChampion && <ChampionConvergence compact={compact} />}
      </div>
    </section>
  );
}
