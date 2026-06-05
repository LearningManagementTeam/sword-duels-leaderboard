import type { NationalsEntrant } from "@/lib/products/sword-duels/nationals-entrant";
import { NationalsParticipantCard } from "./NationalsParticipantCard";
import { SdTrophyIcon } from "./SdTrophyIcon";

interface Props {
  champion: NationalsEntrant | null;
  tvMode?: boolean;
}

export function NationalsChampionPedestal({ champion, tvMode = false }: Props) {
  const trophySize = tvMode ? 56 : 48;

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="pointer-events-none absolute -inset-4 rounded-2xl bg-lime-400/15 blur-2xl" aria-hidden />
      <div className="sd-knockout-champion-pedestal relative overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-emerald-400 via-lime-300 to-emerald-400 px-4 py-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sd-deep">
            National champion
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 px-4 py-6">
          <SdTrophyIcon
            size={trophySize}
            className={`sd-bracket-trophy-float ${
              champion ? "opacity-100" : "opacity-70"
            }`}
          />
          {champion ? (
            <div className="sd-bracket-champion-glow w-full rounded-xl p-1">
              <NationalsParticipantCard entrant={champion} tvMode={tvMode} highlight />
            </div>
          ) : (
            <div className="sd-inset w-full rounded-xl px-4 py-8 text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-lime-200/80">
                Crown awaits
              </p>
              <p className="mt-2 text-[10px] text-sd-muted/60">
                One survivor from the final clash
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
