import type { PlayoffSlot } from "@/lib/playoff-map";
import { SD_BRACKET_COPY } from "@/lib/products/sword-duels/bracket-copy";
import { SdBracketConvergeConnectors } from "./SdBracketConnectors";
import { SdBracketSlot } from "./SdBracketSlot";
import { SdFinalDuelFaceoff } from "./SdFinalDuelFaceoff";
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
    <div className="flex min-w-[10rem] flex-col items-center justify-center gap-2 self-center px-1">
      <div
        className={`flex w-full flex-col items-center gap-2 ${
          finalReady ? "" : "opacity-65"
        }`}
      >
        <div className="relative flex flex-col items-center">
          <SdTrophyIcon
            size={trophySize}
            className={`sd-bracket-trophy-float ${
              hasChampion ? "opacity-100" : finalReady ? "opacity-90" : "opacity-40"
            }`}
          />
          <span
            className={`${vsSize} sd-bracket-vs-pulse mt-1 font-black tracking-tighter text-lime-300 ${
              finalReady && !hasChampion ? "" : "!animate-none text-lime-300/30"
            }`}
          >
            VS
          </span>
          {finalReady && !hasChampion && (
            <span className="mt-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-100/90 ring-1 ring-emerald-400/35 ring-inset">
              {SD_BRACKET_COPY.battleLive}
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
                    className="pointer-events-none absolute -inset-2 rounded-xl bg-lime-400/20 blur-lg"
                    aria-hidden
                  />
                  <div className="relative overflow-hidden rounded-xl">
                    <div className="bg-gradient-to-r from-emerald-400 via-lime-300 to-emerald-400 px-3 py-1 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sd-deep">
                        {SD_BRACKET_COPY.areaChampion}
                      </p>
                    </div>
                    <div className="sd-bracket-champion-glow rounded-b-xl p-1">
                      <SdBracketSlot slot={champion} role="champion" tvMode={tvMode} />
                    </div>
                    <p className="mt-1.5 text-center text-[9px] text-sd-muted/70">
                      {SD_BRACKET_COPY.areaRep(areaName)}
                    </p>
                  </div>
                </div>
              </div>
            ) : finalRevealed ? (
              <SdFinalDuelFaceoff
                slots={finalSlots}
                tvMode={tvMode}
                live
              />
            ) : (
              <div className="sd-inset w-full max-w-[12rem] rounded-lg px-3 py-4 text-center text-[10px] text-sd-muted/60">
                {SD_BRACKET_COPY.areaFinalPending}
              </div>
            )}
          </>
        ) : (
          <div className="sd-inset w-full max-w-[12rem] rounded-xl px-4 py-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sd-muted/70">
              {SD_BRACKET_COPY.finalLocked}
            </p>
            <p className="mt-2 text-[10px] text-sd-muted/55">
              {SD_BRACKET_COPY.finalLockedHint}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
