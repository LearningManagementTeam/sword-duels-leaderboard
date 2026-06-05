import type { PlayoffSlot } from "@/lib/playoff-map";
import { SdBracketConvergeConnectors } from "./SdBracketConnectors";
import { SdBracketSlot } from "./SdBracketSlot";
import { SdTrophyIcon } from "./SdTrophyIcon";

interface Props {
  finalReady: boolean;
  hasChampion: boolean;
  champion: PlayoffSlot | null;
  finalSlots: PlayoffSlot[];
  finalRevealed: boolean;
  areaName: string;
  tvMode?: boolean;
}

export function SdBracketCenterStage({
  finalReady,
  hasChampion,
  champion,
  finalSlots,
  finalRevealed,
  areaName,
  tvMode = false,
}: Props) {
  const trophySize = tvMode ? 56 : 44;
  const vsSize = tvMode ? "text-4xl" : "text-3xl";

  return (
    <div className="flex min-w-[9rem] flex-col items-center justify-center gap-2 px-1">
      <div
        className={`flex w-full flex-col items-center gap-2 ${
          finalReady ? "" : "opacity-65"
        }`}
      >
        {/* Trophy + VS battle stage */}
        <div className="relative flex flex-col items-center">
          <SdTrophyIcon
            size={trophySize}
            className={`sd-bracket-trophy-float ${
              hasChampion ? "opacity-100" : finalReady ? "opacity-90" : "opacity-40"
            }`}
          />
          <span
            className={`${vsSize} sd-bracket-vs-pulse mt-1 font-black tracking-tighter text-sd-gold ${
              finalReady ? "" : "!animate-none text-sd-gold/30"
            }`}
          >
            VS
          </span>
          {finalReady && !hasChampion && (
            <span className="mt-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-100 ring-1 ring-emerald-400/35 ring-inset">
              Battle live
            </span>
          )}
        </div>

        {finalReady ? (
          <>
            <SdBracketConvergeConnectors active={finalReady} />
            {hasChampion && champion ? (
              <div className="sd-bracket-reveal w-full max-w-[12rem]">
                <div className="relative">
                  <div
                    className="pointer-events-none absolute -inset-2 rounded-xl bg-sd-gold/25 blur-lg"
                    aria-hidden
                  />
                  <div className="relative overflow-hidden rounded-xl">
                    <div className="bg-gradient-to-r from-sd-gold via-amber-300 to-sd-gold px-3 py-1 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sd-deep">
                        Area champion
                      </p>
                    </div>
                    <div className="sd-bracket-champion-glow rounded-b-xl p-1">
                      <SdBracketSlot slot={champion} role="champion" tvMode={tvMode} />
                    </div>
                    <p className="mt-1.5 text-center text-[9px] text-sd-muted/70">
                      {areaName} representative
                    </p>
                  </div>
                </div>
              </div>
            ) : finalRevealed ? (
              <div className="w-full max-w-[12rem] space-y-1.5">
                <p className="text-center text-[9px] font-bold uppercase tracking-wider text-sd-glow">
                  Area final
                </p>
                {finalSlots.map((slot) => (
                  <SdBracketSlot
                    key={slot.branch_id ?? "final"}
                    slot={slot}
                    role="final"
                    tvMode={tvMode}
                  />
                ))}
              </div>
            ) : (
              <div className="sd-inset w-full max-w-[12rem] rounded-lg px-3 py-4 text-center text-[10px] text-sd-muted/60">
                Awaiting area final scores…
              </div>
            )}
          </>
        ) : (
          <div className="sd-inset w-full max-w-[12rem] rounded-xl px-4 py-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sd-muted/70">
              Final locked
            </p>
            <p className="mt-2 text-[10px] text-sd-muted/55">
              Publish both group battles to unlock Spot 1 vs Spot 2
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
