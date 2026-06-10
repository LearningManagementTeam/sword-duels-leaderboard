import type { ReactNode } from "react";
import type { PlayoffSlot } from "@/lib/playoff-map";
import type { SdAreaSchedulesConfig } from "@/lib/products/sword-duels/area-schedules";
import type { AreaTournamentMapModel } from "@/lib/products/sword-duels/tournament-map";
import type { SdAreaBracket } from "@/lib/products/sword-duels/types";
import { SdBracketCenterStage } from "./SdBracketCenterStage";
import { SdBracketSlot } from "./SdBracketSlot";
import { SdSpotPedestal } from "./SdSpotPedestal";
import { SdTrophyIcon } from "./SdTrophyIcon";
import { SdBattleScheduleMeta } from "./SdBattleScheduleMeta";

interface Props {
  model: AreaTournamentMapModel;
  bracket: SdAreaBracket;
  scheduleConfig?: SdAreaSchedulesConfig;
}

function StageCard({
  step,
  title,
  subtitle,
  meta,
  children,
  accent,
}: {
  step: number;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  children: ReactNode;
  accent: "a" | "b" | "final" | "gold";
}) {
  const ring = {
    a: "ring-cyan-400/35 bg-cyan-500/10",
    b: "ring-lime-400/35 bg-lime-500/10",
    final: "ring-emerald-400/40 bg-emerald-500/10",
    gold: "ring-sd-gold/45 bg-sd-gold/10",
  }[accent];

  return (
    <section className={`rounded-xl p-4 ring-1 ring-inset ${ring}`}>
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sd-deep/60 text-sm font-black text-sd-glow ring-1 ring-emerald-400/30">
          {step}
        </span>
        <div>
          <h3 className="font-bold text-white">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-sd-muted/75">{subtitle}</p>
          )}
          {meta}
        </div>
      </div>
      {children}
    </section>
  );
}

function FieldList({ slots }: { slots: PlayoffSlot[] }) {
  return (
    <ul className="space-y-2">
      {slots.map((slot) => (
        <li key={slot.branch_id ?? slot.rank}>
          <SdBracketSlot slot={slot} role="field" />
        </li>
      ))}
    </ul>
  );
}

/** Vertical battle-path bracket for mobile — no horizontal cramming. */
export function SdMobileBracketJourney({
  model,
  bracket,
  scheduleConfig,
}: Props) {
  const groupAField = model.columns.find((c) => c.id === "group_a_field")!;
  const groupAWinner = model.columns.find((c) => c.id === "group_a_winner")!;
  const groupBField = model.columns.find((c) => c.id === "group_b_field")!;
  const groupBWinner = model.columns.find((c) => c.id === "group_b_winner")!;
  const areaFinal = model.columns.find((c) => c.id === "area_final")!;

  const spot1Ready = !!model.groupAWinnerId;
  const spot2Ready = !!model.groupBWinnerId;
  const finalReady = spot1Ready && spot2Ready;
  const hasChampion = !!model.areaChampion;

  let step = 1;

  return (
    <div className="space-y-4 lg:hidden">
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <SdTrophyIcon size={36} className="sd-bracket-trophy-float" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sd-glow">
          Battle path
        </p>
        <p className="text-xs text-sd-muted/70">
          Follow the journey from group battles to area champion
        </p>
      </div>

      <StageCard
        step={step++}
        title="Set 1 · Group A"
        subtitle={`${bracket.groupA.length} branches fight for Spot 1`}
        accent="a"
        meta={
          <SdBattleScheduleMeta
            area={model.area}
            setType="group_a"
            scheduleConfig={scheduleConfig}
            compact
            className="mt-2"
          />
        }
      >
        <FieldList slots={groupAField.slots} />
        <div className="mt-4 border-t border-cyan-500/20 pt-3">
          <SdSpotPedestal
            spot={1}
            slot={spot1Ready ? groupAWinner.slots[0] ?? null : null}
            ready={spot1Ready}
            side="a"
          />
        </div>
      </StageCard>

      <StageCard
        step={step++}
        title="Set 2 · Group B"
        subtitle={`${bracket.groupB.length} branches fight for Spot 2`}
        accent="b"
        meta={
          <SdBattleScheduleMeta
            area={model.area}
            setType="group_b"
            scheduleConfig={scheduleConfig}
            compact
            className="mt-2"
          />
        }
      >
        <FieldList slots={groupBField.slots} />
        <div className="mt-4 border-t border-lime-500/20 pt-3">
          <SdSpotPedestal
            spot={2}
            slot={spot2Ready ? groupBWinner.slots[0] ?? null : null}
            ready={spot2Ready}
            side="b"
          />
        </div>
      </StageCard>

      <StageCard
        step={step++}
        title="Area final"
        subtitle="Spot 1 vs Spot 2"
        accent="final"
        meta={
          <SdBattleScheduleMeta
            area={model.area}
            setType="area_final"
            scheduleConfig={scheduleConfig}
            compact
            className="mt-2"
          />
        }
      >
        <SdBracketCenterStage
          finalReady={finalReady}
          hasChampion={hasChampion}
          champion={model.areaChampion}
          finalSlots={areaFinal.slots}
          finalRevealed={areaFinal.isRevealed}
          areaName={model.area}
        />
      </StageCard>
    </div>
  );
}
