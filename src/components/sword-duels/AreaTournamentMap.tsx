import type { ReactNode } from "react";
import { buildAreaTournamentMap } from "@/lib/products/sword-duels/tournament-map";
import type { SdAreaBracket, SdSet, SdSetScore } from "@/lib/products/sword-duels/types";
import { PlayoffSlotCard } from "@/components/playoff/PlayoffSlotCard";
import { REGION_LABELS } from "@/lib/scoring-config";

interface Props {
  bracket: SdAreaBracket;
  sets: SdSet[];
  scoresBySetId: Map<string, SdSetScore[]>;
  tvMode?: boolean;
}

function Lane({
  title,
  subtitle,
  children,
  accent,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  accent: "cyan" | "amber" | "emerald";
}) {
  const badge = {
    cyan: "bg-cyan-500/20 text-cyan-100 ring-cyan-400/40",
    amber: "bg-amber-500/20 text-amber-100 ring-amber-400/40",
    emerald: "bg-emerald-500/25 text-emerald-100 ring-emerald-400/40",
  }[accent];

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mb-2 text-center">
        <span
          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${badge}`}
        >
          {title}
        </span>
        <p className="mt-1 text-[10px] text-sd-muted/65">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function AreaTournamentMap({
  bracket,
  sets,
  scoresBySetId,
  tvMode = false,
}: Props) {
  const model = buildAreaTournamentMap({ bracket, sets, scoresBySetId });
  const region = model.region;

  const groupAField = model.columns.find((c) => c.id === "group_a_field")!;
  const groupAWinner = model.columns.find((c) => c.id === "group_a_winner")!;
  const groupBField = model.columns.find((c) => c.id === "group_b_field")!;
  const groupBWinner = model.columns.find((c) => c.id === "group_b_winner")!;
  const areaFinal = model.columns.find((c) => c.id === "area_final")!;

  const spot1Ready = !!model.groupAWinnerId;
  const spot2Ready = !!model.groupBWinnerId;
  const finalReady = spot1Ready && spot2Ready;

  return (
    <section className="sd-neon-panel overflow-hidden p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-stretch overflow-hidden rounded-lg shadow-lg">
            <span className="bg-sd-gold px-4 py-1.5 text-sm font-black uppercase tracking-widest text-sd-deep">
              2 spots → 1 rep
            </span>
            <span className="bg-emerald-500/25 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100 ring-1 ring-inset ring-emerald-400/40">
              {model.badgeLabel}
            </span>
          </div>
          <h2 className={`mt-2 font-bold text-white ${tvMode ? "text-2xl" : "text-lg"}`}>
            {model.area}
          </h2>
          <p className="text-sm text-sd-muted">
            {REGION_LABELS[region]} · {bracket.branchCount} branches · Group battles
            then area final
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Lane title="Set 1 · Group A" subtitle={`${bracket.groupA.length} branches → Spot 1`} accent="cyan">
          <div className="space-y-2">
            {groupAField.slots.map((slot) => (
              <PlayoffSlotCard
                key={slot.branch_id ?? slot.rank}
                slot={slot}
                region={region}
                tvMode={tvMode}
                compact={false}
              />
            ))}
          </div>
          <div className="mt-3 border-t border-cyan-500/20 pt-3">
            <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-cyan-200/80">
              Spot 1
            </p>
            {groupAWinner.isRevealed && spot1Ready ? (
              groupAWinner.slots.map((slot) => (
                <PlayoffSlotCard
                  key={slot.branch_id ?? "spot1"}
                  slot={slot}
                  region={region}
                  tvMode={tvMode}
                  compact
                />
              ))
            ) : (
              <div className="sd-inset rounded-lg border border-dashed border-cyan-500/20 px-2 py-4 text-center text-[10px] text-sd-muted/55">
                Publish Group A battle to fill Spot 1
              </div>
            )}
          </div>
        </Lane>

        <Lane title="Set 2 · Group B" subtitle={`${bracket.groupB.length} branches → Spot 2`} accent="amber">
          <div className="space-y-2">
            {groupBField.slots.map((slot) => (
              <PlayoffSlotCard
                key={slot.branch_id ?? slot.rank}
                slot={slot}
                region={region}
                tvMode={tvMode}
                compact={false}
              />
            ))}
          </div>
          <div className="mt-3 border-t border-amber-500/20 pt-3">
            <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">
              Spot 2
            </p>
            {groupBWinner.isRevealed && spot2Ready ? (
              groupBWinner.slots.map((slot) => (
                <PlayoffSlotCard
                  key={slot.branch_id ?? "spot2"}
                  slot={slot}
                  region={region}
                  tvMode={tvMode}
                  compact
                />
              ))
            ) : (
              <div className="sd-inset rounded-lg border border-dashed border-amber-500/20 px-2 py-4 text-center text-[10px] text-sd-muted/55">
                Publish Group B battle to fill Spot 2
              </div>
            )}
          </div>
        </Lane>
      </div>

      <div className="relative mt-8">
        <svg
          viewBox="0 0 400 48"
          className="mx-auto mb-2 hidden h-10 w-full max-w-md lg:block"
          aria-hidden
        >
          <path
            d="M 80 4 C 80 28, 200 32, 200 44"
            fill="none"
            stroke="rgb(34 211 238 / 0.45)"
            strokeWidth="2"
          />
          <path
            d="M 320 4 C 320 28, 200 32, 200 44"
            fill="none"
            stroke="rgb(251 191 36 / 0.45)"
            strokeWidth="2"
          />
        </svg>

        <Lane
          title="Area final"
          subtitle="Spot 1 vs Spot 2 → area representative"
          accent="emerald"
        >
          {finalReady ? (
            areaFinal.isRevealed ? (
              <div className="mx-auto max-w-sm space-y-2">
                {areaFinal.slots.map((slot) => (
                  <PlayoffSlotCard
                    key={slot.branch_id ?? "final"}
                    slot={slot}
                    region={region}
                    tvMode={tvMode}
                    compact
                  />
                ))}
              </div>
            ) : (
              <div className="sd-inset mx-auto max-w-sm rounded-lg px-2 py-4 text-center text-[10px] text-sd-muted/55">
                Both spots filled — enter area final scores
              </div>
            )
          ) : (
            <div className="sd-inset mx-auto max-w-sm rounded-lg border border-dashed border-emerald-500/20 px-2 py-4 text-center text-[10px] text-sd-muted/55">
              Area final unlocks when Spot 1 and Spot 2 are both published
            </div>
          )}
        </Lane>
      </div>

      <p className="mt-4 text-center text-[10px] text-sd-muted/55">
        High score or best 2 survivors (per set mode) · Representatives shown on
        each card · Map updates when admin publishes each set
      </p>
    </section>
  );
}
