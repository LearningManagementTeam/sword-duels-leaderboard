import type { ReactNode } from "react";
import Link from "next/link";
import { buildAreaTournamentMap } from "@/lib/products/sword-duels/tournament-map";
import type { SdAreaSchedulesConfig } from "@/lib/products/sword-duels/area-schedules";
import type {
  SdAreaBracket,
  SdAreaSet,
  SdSetScore,
} from "@/lib/products/sword-duels/types";
import { REGION_LABELS } from "@/lib/scoring-config";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { SdMobileBracketJourney } from "./SdMobileBracketJourney";
import { SdBracketFanConnectors, bracketTrackHeight } from "./SdBracketConnectors";
import { SdBracketCenterStage } from "./SdBracketCenterStage";
import { SdSpotPedestal } from "./SdSpotPedestal";
import { SdBracketSlot } from "./SdBracketSlot";
import { SdBattleScheduleMeta } from "./SdBattleScheduleMeta";

interface Props {
  bracket: SdAreaBracket;
  sets: SdAreaSet[];
  scoresBySetId: Map<string, SdSetScore[]>;
  scheduleConfig?: SdAreaSchedulesConfig;
  tvMode?: boolean;
  /** Hide TV link and footer in fullscreen TV shell */
  fullscreen?: boolean;
  /** Minimal chrome when nested inside another section (e.g. full-journey test page). */
  embedded?: boolean;
}

function WingHeader({
  label,
  subtitle,
  align,
  tvMode,
  meta,
}: {
  label: string;
  subtitle: string;
  align: "left" | "right";
  tvMode?: boolean;
  meta?: ReactNode;
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
      {meta}
    </div>
  );
}

function BracketGrid({
  model,
  bracket,
  scheduleConfig,
  tvMode = false,
}: {
  model: ReturnType<typeof buildAreaTournamentMap>;
  bracket: SdAreaBracket;
  scheduleConfig?: SdAreaSchedulesConfig;
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

  const maxFieldCount = Math.max(
    groupAField.slots.length,
    groupBField.slots.length
  );
  const wingTrackHeight = bracketTrackHeight(maxFieldCount);

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
        className={`relative grid grid-cols-1 items-center gap-6 pt-16 lg:grid-cols-[1fr_auto_1fr] lg:gap-4 xl:gap-6 ${
          tvMode ? "px-2 pb-4 pt-20" : "p-3 pb-4"
        }`}
      >
        {/* Group A wing */}
        <div className="flex min-w-0 flex-col justify-center">
          <WingHeader
            label="Set 1 · Group A"
            subtitle={`${bracket.groupA.length} branches → Spot 1`}
            align="left"
            tvMode={tvMode}
            meta={
              <SdBattleScheduleMeta
                area={model.area}
                setType="group_a"
                scheduleConfig={scheduleConfig}
                compact
                align="left"
                className="mt-1.5"
              />
            }
          />
          <div
            className="flex items-center gap-0"
            style={{ minHeight: wingTrackHeight }}
          >
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
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
              trackCount={maxFieldCount}
              side="left"
              accent="a"
              active={spot1Ready}
            />
            <SdSpotPedestal
              spot={1}
              slot={spot1Slot}
              ready={spot1Ready}
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
          scheduleMeta={
            <SdBattleScheduleMeta
              area={model.area}
              setType="area_final"
              scheduleConfig={scheduleConfig}
              compact
              align="center"
              className="mt-2 max-w-[12rem] text-center"
            />
          }
        />

        {/* Group B wing (mirrored) */}
        <div className="flex min-w-0 flex-col justify-center">
          <WingHeader
            label="Set 2 · Group B"
            subtitle={`${bracket.groupB.length} branches → Spot 2`}
            align="right"
            tvMode={tvMode}
            meta={
              <SdBattleScheduleMeta
                area={model.area}
                setType="group_b"
                scheduleConfig={scheduleConfig}
                compact
                align="right"
                className="mt-1.5"
              />
            }
          />
          <div
            className="flex items-center gap-0"
            style={{ minHeight: wingTrackHeight }}
          >
            <SdSpotPedestal
              spot={2}
              slot={spot2Slot}
              ready={spot2Ready}
              side="b"
              tvMode={tvMode}
            />
            <SdBracketFanConnectors
              slotCount={groupBField.slots.length}
              trackCount={maxFieldCount}
              side="right"
              accent="b"
              active={spot2Ready}
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
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
  embedded,
}: {
  children: ReactNode;
  model: ReturnType<typeof buildAreaTournamentMap>;
  bracket: SdAreaBracket;
  tvMode?: boolean;
  fullscreen?: boolean;
  embedded?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden ${
        embedded
          ? ""
          : `sd-neon-panel ${tvMode ? "p-6 sm:p-8" : "p-4 sm:p-6"}`
      } ${fullscreen ? "border-0 shadow-none" : ""}`}
    >
      {!embedded && (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-stretch overflow-hidden rounded-lg shadow-lg">
            <span
              className={`bg-gradient-to-r from-emerald-400 to-lime-400 font-black uppercase tracking-widest text-sd-deep ${
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
      )}
      {children}
      {!fullscreen && !embedded && (
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
  scheduleConfig,
  tvMode = false,
  fullscreen = false,
  embedded = false,
}: Props) {
  const model = buildAreaTournamentMap({ bracket, sets, scoresBySetId });

  if (tvMode) {
    return (
      <MapShell model={model} bracket={bracket} tvMode fullscreen={fullscreen} embedded={embedded}>
        <BracketGrid
          model={model}
          bracket={bracket}
          scheduleConfig={scheduleConfig}
          tvMode
        />
      </MapShell>
    );
  }

  return (
    <MapShell model={model} bracket={bracket} embedded={embedded}>
      <div className="hidden lg:block">
        <BracketGrid
          model={model}
          bracket={bracket}
          scheduleConfig={scheduleConfig}
        />
      </div>
      <SdMobileBracketJourney
        model={model}
        bracket={bracket}
        scheduleConfig={scheduleConfig}
      />
    </MapShell>
  );
}
