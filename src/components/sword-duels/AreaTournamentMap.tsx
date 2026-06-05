import type { ReactNode } from "react";
import Link from "next/link";
import { buildAreaTournamentMap } from "@/lib/products/sword-duels/tournament-map";
import type { SdAreaBracket, SdSet, SdSetScore } from "@/lib/products/sword-duels/types";
import { REGION_LABELS } from "@/lib/scoring-config";
import type { PlayoffSlot } from "@/lib/playoff-map";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { SdMobileBracketJourney } from "./SdMobileBracketJourney";
import { SdBracketFanConnectors } from "./SdBracketConnectors";
import { SdBracketCenterStage } from "./SdBracketCenterStage";
import { SdBracketSlot } from "./SdBracketSlot";

interface Props {
  bracket: SdAreaBracket;
  sets: SdSet[];
  scoresBySetId: Map<string, SdSetScore[]>;
  tvMode?: boolean;
  /** Hide TV link and footer in fullscreen TV shell */
  fullscreen?: boolean;
}

function WingHeader({
  label,
  subtitle,
  align,
  tvMode,
}: {
  label: string;
  subtitle: string;
  align: "left" | "right";
  tvMode?: boolean;
}) {
  return (
    <div className={`mb-3 ${align === "right" ? "text-right" : "text-left"}`}>
      <span
        className={`inline-block rounded bg-emerald-500/20 px-2.5 py-0.5 font-bold uppercase tracking-wider text-emerald-100 ring-1 ring-emerald-400/35 ring-inset ${
          tvMode ? "text-xs" : "text-[10px]"
        }`}
      >
        {label}
      </span>
      <p className={`mt-1 text-sd-muted/65 ${tvMode ? "text-xs" : "text-[10px]"}`}>
        {subtitle}
      </p>
    </div>
  );
}

function SpotBlock({
  label,
  slot,
  ready,
  placeholder,
  side,
  tvMode,
}: {
  label: string;
  slot: PlayoffSlot | null;
  ready: boolean;
  placeholder: string;
  side: "a" | "b";
  tvMode?: boolean;
}) {
  return (
    <div className={`flex min-w-[8.5rem] flex-col gap-1 ${ready ? "sd-bracket-reveal" : ""}`}>
      <p
        className={`font-bold uppercase tracking-wider text-lime-300/80 ${
          side === "b" ? "text-right" : "text-left"
        } ${tvMode ? "text-[10px]" : "text-[9px]"}`}
      >
        {label}
      </p>
      {ready && slot ? (
        <SdBracketSlot
          slot={slot}
          role="spot"
          side={side}
          tvMode={tvMode}
          highlighted
        />
      ) : (
        <SdBracketSlot
          slot={{
            branch_id: null,
            branch_name: placeholder,
            branch_code: "",
            rank: 1,
            status: "placeholder",
            roundScore: null,
            isPlaceholder: true,
          }}
          role="placeholder"
          side={side}
          tvMode={tvMode}
        />
      )}
    </div>
  );
}

function BracketGrid({
  model,
  bracket,
  tvMode = false,
}: {
  model: ReturnType<typeof buildAreaTournamentMap>;
  bracket: SdAreaBracket;
  tvMode?: boolean;
}) {
  const groupAField = model.columns.find((c) => c.id === "group_a_field")!;
  const groupAWinner = model.columns.find((c) => c.id === "group_a_winner")!;
  const groupBField = model.columns.find((c) => c.id === "group_b_field")!;
  const groupBWinner = model.columns.find((c) => c.id === "group_b_winner")!;
  const areaFinal = model.columns.find((c) => c.id === "area_final")!;

  const spot1Ready = !!model.groupAWinnerId;
  const spot2Ready = !!model.groupBWinnerId;
  const finalReady = spot1Ready && spot2Ready;
  const hasChampion = !!model.areaChampion;
  const spot1Slot = groupAWinner.slots[0] ?? null;
  const spot2Slot = groupBWinner.slots[0] ?? null;
  const champion = model.areaChampion;

  return (
    <div className="sd-bracket-arena relative overflow-hidden rounded-xl">
      <div className="sd-bracket-arena-glow" aria-hidden />
      {/* Title banner */}
      <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2">
        <div className="sd-glass-strong rounded-lg px-5 py-2 text-center">
          <p
            className={`font-bold uppercase tracking-[0.2em] text-sd-glow ${
              tvMode ? "text-xs" : "text-[10px]"
            }`}
          >
            Area tournament
          </p>
          <p className={`text-sd-muted/70 ${tvMode ? "text-[10px]" : "text-[9px]"}`}>
            2 spots → 1 representative
          </p>
        </div>
      </div>

      <div
        className={`relative grid grid-cols-1 items-stretch gap-6 pt-16 lg:grid-cols-[1fr_auto_1fr] lg:gap-4 xl:gap-6 ${
          tvMode ? "px-2 pb-4 pt-20" : "p-3 pb-4"
        }`}
      >
        {/* Group A wing */}
        <div className="min-w-0">
          <WingHeader
            label="Set 1 · Group A"
            subtitle={`${bracket.groupA.length} branches → Spot 1`}
            align="left"
            tvMode={tvMode}
          />
          <div className="flex items-center gap-0">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {groupAField.slots.map((slot) => (
                <SdBracketSlot
                  key={slot.branch_id ?? slot.rank}
                  slot={slot}
                  role="field"
                  side="a"
                  tvMode={tvMode}
                  highlighted={slot.branch_id === model.groupAWinnerId}
                />
              ))}
            </div>
            <SdBracketFanConnectors
              slotCount={groupAField.slots.length}
              side="left"
              accent="a"
              active={spot1Ready}
            />
            <SpotBlock
              label="Spot 1"
              slot={spot1Slot}
              ready={spot1Ready}
              placeholder="Group A winner"
              side="a"
              tvMode={tvMode}
            />
          </div>
        </div>

        <SdBracketCenterStage
          finalReady={finalReady}
          hasChampion={hasChampion}
          champion={champion}
          finalSlots={areaFinal.slots}
          finalRevealed={areaFinal.isRevealed}
          areaName={model.area}
          tvMode={tvMode}
        />

        {/* Group B wing (mirrored) */}
        <div className="min-w-0">
          <WingHeader
            label="Set 2 · Group B"
            subtitle={`${bracket.groupB.length} branches → Spot 2`}
            align="right"
            tvMode={tvMode}
          />
          <div className="flex items-center gap-0">
            <SpotBlock
              label="Spot 2"
              slot={spot2Slot}
              ready={spot2Ready}
              placeholder="Group B winner"
              side="b"
              tvMode={tvMode}
            />
            <SdBracketFanConnectors
              slotCount={groupBField.slots.length}
              side="right"
              accent="b"
              active={spot2Ready}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {groupBField.slots.map((slot) => (
                <SdBracketSlot
                  key={slot.branch_id ?? slot.rank}
                  slot={slot}
                  role="field"
                  side="b"
                  tvMode={tvMode}
                  highlighted={slot.branch_id === model.groupBWinnerId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapShell({
  children,
  model,
  bracket,
  tvMode,
  fullscreen,
}: {
  children: ReactNode;
  model: ReturnType<typeof buildAreaTournamentMap>;
  bracket: SdAreaBracket;
  tvMode?: boolean;
  fullscreen?: boolean;
}) {
  return (
    <section
      className={`sd-neon-panel overflow-hidden ${
        tvMode ? "p-6 sm:p-8" : "p-4 sm:p-6"
      } ${fullscreen ? "border-0 shadow-none" : ""}`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-stretch overflow-hidden rounded-lg shadow-lg">
            <span
              className={`bg-sd-gold font-black uppercase tracking-widest text-sd-deep ${
                tvMode ? "px-5 py-2 text-base" : "px-4 py-1.5 text-sm"
              }`}
            >
              Sword Duels
            </span>
            <span
              className={`bg-emerald-500/25 font-bold uppercase tracking-wider text-emerald-100 ring-1 ring-inset ring-emerald-400/40 ${
                tvMode ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"
              }`}
            >
              {model.badgeLabel}
            </span>
          </div>
          <h2 className={`mt-2 font-bold text-white ${tvMode ? "text-3xl" : "text-lg"}`}>
            {model.area}
          </h2>
          <p className={`text-sd-muted ${tvMode ? "text-base" : "text-sm"}`}>
            {REGION_LABELS[model.region]} · {bracket.branchCount} branches · Group
            battles converge to one area rep
          </p>
        </div>
        {!fullscreen && !tvMode && (
          <Link
            href={`${SWORD_DUELS_PUBLIC}/tv?area=${encodeURIComponent(model.area)}`}
            className="sd-btn-ghost rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            Open TV view
          </Link>
        )}
      </div>
      {children}
      {!fullscreen && (
        <p className="mt-5 text-center text-[10px] text-sd-muted/55">
          High score or best 2 survivors per set · Map updates when admin publishes
          each battle
        </p>
      )}
    </section>
  );
}

export function AreaTournamentMap({
  bracket,
  sets,
  scoresBySetId,
  tvMode = false,
  fullscreen = false,
}: Props) {
  const model = buildAreaTournamentMap({ bracket, sets, scoresBySetId });

  if (tvMode) {
    return (
      <MapShell model={model} bracket={bracket} tvMode fullscreen={fullscreen}>
        <BracketGrid model={model} bracket={bracket} tvMode />
      </MapShell>
    );
  }

  return (
    <MapShell model={model} bracket={bracket}>
      <div className="hidden lg:block">
        <BracketGrid model={model} bracket={bracket} />
      </div>
      <SdMobileBracketJourney model={model} bracket={bracket} />
    </MapShell>
  );
}
