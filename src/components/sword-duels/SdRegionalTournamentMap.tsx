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

function VsBadge({ compact }: { compact?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-0.5">
      <span
        className={`font-black tracking-tighter text-lime-300/90 ${
          compact ? "text-sm" : "text-base"
        }`}
      >
        VS
      </span>
    </div>
  );
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
        compact ? "py-1.5" : "py-2"
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

function WinnerSlot({
  label,
  compact,
  highlight,
}: {
  label?: string;
  compact?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg border border-dashed px-2 text-center ring-1 ring-inset ${
        compact ? "py-1.5" : "py-2"
      } ${
        highlight
          ? "border-lime-400/35 bg-lime-400/8 ring-lime-400/25"
          : "border-emerald-500/20 bg-sd-deep/25 ring-emerald-500/10"
      }`}
    >
      <span
        className={`font-semibold uppercase tracking-wider ${
          highlight ? "text-lime-200/90" : "text-sd-muted/55"
        } ${compact ? "text-[8px]" : "text-[9px]"}`}
      >
        {label ?? "Winner"}
      </span>
    </div>
  );
}

function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-1.5" aria-hidden>
      <div className="h-4 w-px bg-gradient-to-b from-emerald-400/45 to-lime-400/35" />
      {label && (
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-lime-300/45">
          {label}
        </span>
      )}
      <div className="h-3 w-px bg-gradient-to-b from-lime-400/35 to-transparent" />
    </div>
  );
}

function AreaBattleMatch({
  areaA,
  areaB,
  battleNumber,
  compact,
}: {
  areaA: number;
  areaB: number;
  battleNumber: number;
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl sd-inset p-2.5 ring-1 ring-emerald-500/10">
      <p className="mb-2 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-200/75">
        Battle {battleNumber} · {sdAreaShortLabel(areaA)} vs{" "}
        {sdAreaShortLabel(areaB)}
      </p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-1.5">
        <AreaCard areaNumber={areaA} compact={compact} />
        <VsBadge compact={compact} />
        <AreaCard areaNumber={areaB} compact={compact} />
      </div>
      <FlowArrow />
      <WinnerSlot
        label={`Winner ${battleNumber}`}
        compact={compact}
        highlight
      />
    </div>
  );
}

function RegionalRepBattle({
  column,
  compact,
}: {
  column: SdRegionalMapColumn;
  compact?: boolean;
}) {
  const winnerCount = column.pairs.length;
  const accent = REGION_PLAYOFF_ACCENTS[column.region];

  return (
    <div className={`rounded-xl p-3 ${accent.badge}`}>
      <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/85">
        {winnerCount === 3
          ? "3 battle winners fight for the regional rep"
          : "2 battle winners fight for the regional rep"}
      </p>

      {winnerCount === 3 ? (
        <>
          <div className="flex gap-2">
            <WinnerSlot label="W1" compact={compact} />
            <WinnerSlot label="W2" compact={compact} />
            <WinnerSlot label="W3" compact={compact} />
          </div>
          <p className="mt-2 text-center text-[9px] leading-relaxed text-sd-muted/75">
            The three area-battle winners compete in the regional final — one
            branch becomes {column.regionalNode.label} and advances to
            nationals.
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-1.5">
            <WinnerSlot label="Winner 1" compact={compact} />
            <VsBadge compact={compact} />
            <WinnerSlot label="Winner 2" compact={compact} />
          </div>
          <p className="mt-2 text-center text-[9px] leading-relaxed text-sd-muted/75">
            The two area-battle winners face off — one branch becomes{" "}
            {column.regionalNode.label} and advances to nationals.
          </p>
        </>
      )}

      <FlowArrow label="↓" />

      <div className="flex justify-center">
        <RegionalRepCard
          label={column.regionalNode.label}
          region={column.region}
          compact={compact}
        />
      </div>
    </div>
  );
}

function RegionalRepCard({
  label,
  region,
  compact,
}: {
  label: string;
  region: Region;
  compact?: boolean;
}) {
  const regionName =
    region === "luzon" ? "Luzon" : region === "ncr" ? "NCR" : "VisMin";

  return (
    <div
      className={`w-full max-w-[10rem] rounded-xl bg-gradient-to-r from-amber-500/30 via-orange-500/22 to-yellow-500/18 px-3 text-center ring-2 ring-amber-400/45 ${
        compact ? "py-2.5" : "py-3.5"
      }`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-100/90">
        Regional representative
      </p>
      <p
        className={`font-black text-white ${compact ? "text-lg" : "text-xl"}`}
      >
        {label}
      </p>
      <p className="mt-0.5 text-[9px] text-amber-100/70">
        {regionName} → Nationals
      </p>
    </div>
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
    <div className="sd-glass-strong flex flex-col gap-4 rounded-2xl p-4 ring-1 ring-emerald-500/10 sm:p-5">
      <header className="border-b border-emerald-500/10 pb-3 text-center">
        <span
          className={`inline-block rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] ring-1 ring-inset ${accent.badge}`}
        >
          {column.label}
        </span>
        <p className="mt-2 text-[10px] leading-relaxed text-sd-muted/80">
          {column.pairs.length} area battles, then{" "}
          {column.pairs.length === 3 ? "three" : "two"} winners fight for one
          regional slot.
        </p>
      </header>

      <div className="space-y-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-sd-glow">
          Phase 1 — Area battles
        </p>
        <div className="space-y-2">
          {column.pairs.map((pair, i) => (
            <AreaBattleMatch
              key={`${pair[0]}-${pair[1]}`}
              areaA={pair[0]}
              areaB={pair[1]}
              battleNumber={i + 1}
              compact={compact}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-200/80">
          Phase 2 — Regional representative
        </p>
        <RegionalRepBattle column={column} compact={compact} />
      </div>
    </div>
  );
}

function NationalsConvergence({ compact }: { compact?: boolean }) {
  return (
    <div className="mt-8 space-y-5 border-t border-emerald-500/15 pt-8">
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">
        Phase 3 — National knockout
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["R1", "R2", "R3"] as const).map((slot) => (
          <div
            key={slot}
            className="rounded-lg sd-glass px-3 py-2 text-center ring-1 ring-amber-400/25"
          >
            <p className="text-[9px] uppercase tracking-wider text-sd-muted">
              {slot} enters bracket
            </p>
          </div>
        ))}
      </div>

      <svg
        viewBox="0 0 400 56"
        className="mx-auto h-12 w-full max-w-xl"
        aria-hidden
      >
        <path
          d="M 66 4 C 66 28, 200 32, 200 52"
          fill="none"
          stroke="#34d399"
          strokeWidth="2"
          opacity="0.55"
        />
        <path
          d="M 200 4 L 200 52"
          fill="none"
          stroke="#e879f9"
          strokeWidth="2"
          opacity="0.55"
        />
        <path
          d="M 334 4 C 334 28, 200 32, 200 52"
          fill="none"
          stroke="#a3e635"
          strokeWidth="2"
          opacity="0.55"
        />
      </svg>

      <div className="mx-auto max-w-md text-center">
        <div
          className={`sd-neon-panel rounded-xl bg-gradient-to-r from-sd-gold/20 via-amber-400/15 to-yellow-500/10 px-4 ring-1 ring-amber-400/35 ${
            compact ? "py-4" : "py-5"
          }`}
        >
          <p className="text-sm font-semibold text-white">National champion</p>
          <p className="mt-1.5 text-xs leading-relaxed text-sd-muted">
            R1, R2, and R3 join the national knockout — winners advance round
            by round until one branch holds the crown.
          </p>
        </div>
        <Link
          href={`${SWORD_DUELS_PUBLIC}/nationals`}
          className="sd-link mt-3 inline-block text-sm"
        >
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
          Regional tournament map
        </p>
        <h3
          className={`font-bold text-white ${compact ? "text-base" : "text-lg sm:text-xl"}`}
        >
          Area battles → regional rep → nationals
        </h3>
        <p className="text-xs leading-relaxed text-sd-muted sm:text-sm">
          In each region, paired areas fight head-to-head (Area 1 vs 2, 3 vs 4,
          and so on). The battle winners then fight for a single regional
          representative — R1, R2, or R3 — who advances to the national
          knockout.
        </p>
      </header>

      <div className="sd-inset rounded-2xl p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-4">
          {SD_REGIONAL_TOURNAMENT_COLUMNS.map((column) => (
            <RegionalColumn key={column.region} column={column} compact={compact} />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10px] text-sd-muted/80">
          <span className="rounded-md sd-glass px-2 py-1 ring-1 ring-emerald-500/20">
            Phase 1: Area vs Area
          </span>
          <span className="rounded-md sd-glass px-2 py-1 ring-1 ring-amber-500/20">
            Phase 2: Regional rep
          </span>
          <span className="rounded-md sd-glass px-2 py-1 ring-1 ring-cyan-500/20">
            Phase 3: Nationals
          </span>
        </div>

        {showChampion && <NationalsConvergence compact={compact} />}
      </div>
    </section>
  );
}
