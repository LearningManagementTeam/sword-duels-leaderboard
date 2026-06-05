import type { NationalsKnockoutModel } from "@/lib/products/sword-duels/nationals-knockout-bracket";
import { NationalsChampionPedestal } from "./NationalsChampionPedestal";
import { NationalsKnockoutJourney } from "./NationalsKnockoutJourney";
import { SdTrophyIcon } from "./SdTrophyIcon";

interface Props {
  model: NationalsKnockoutModel;
  preview?: boolean;
  tvMode?: boolean;
}

export function NationalsKnockoutMap({ model, preview = false, tvMode = false }: Props) {
  return (
    <div className="space-y-6">
      {/* Arena shell — matches area bracket energy */}
      <div className="sd-nationals-knockout-arena relative overflow-hidden rounded-2xl">
        <div className="sd-bracket-arena-glow" aria-hidden />
        <div className="sd-nationals-knockout-arena-shimmer pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative p-4 sm:p-6">
          {/* Header + floating trophy */}
          <div className="mb-6 flex flex-col items-center gap-3 text-center sm:mb-8">
            <SdTrophyIcon
              size={tvMode ? 52 : 44}
              className="sd-bracket-trophy-float"
            />
            <div className="inline-flex items-stretch overflow-hidden rounded-lg shadow-lg">
              <span className="bg-gradient-to-r from-emerald-400 to-lime-400 px-4 py-1.5 text-sm font-black uppercase tracking-widest text-sd-deep">
                Sword Duels
              </span>
              <span className="bg-amber-500/25 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-100 ring-1 ring-inset ring-amber-400/40">
                Nationals
              </span>
            </div>
            <div>
              <h2
                className={`font-black tracking-tight text-white ${
                  tvMode ? "text-3xl" : "text-xl sm:text-2xl"
                }`}
              >
                Battle path to champion
              </h2>
              <p className={`mt-1 text-sd-muted ${tvMode ? "text-base" : "text-sm"}`}>
                {model.fieldSize} area reps · one national crown
                {preview ? " · Preview" : ""}
              </p>
            </div>
            {preview && (
              <span className="rounded-full bg-lime-400/15 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-lime-100 ring-1 ring-lime-400/35 ring-inset">
                All clashes ready · scores coming soon
              </span>
            )}
          </div>

          {/* Floating title banner like area tournament */}
          <div className="pointer-events-none absolute left-1/2 top-3 z-10 hidden -translate-x-1/2 lg:block">
            <div className="sd-glass-strong rounded-lg px-5 py-1.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sd-glow">
                National tournament
              </p>
            </div>
          </div>

          <NationalsKnockoutJourney
            rounds={model.rounds}
            preview={preview}
            tvMode={tvMode}
          />

          <div className="mt-6">
            <FlowConnectorFinal />
            <NationalsChampionPedestal champion={model.champion} tvMode={tvMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowConnectorFinal() {
  return (
    <div className="flex justify-center py-4" aria-hidden>
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-px bg-gradient-to-b from-lime-400/50 to-amber-400/50 sd-knockout-flow-line" />
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-200/70">
          Champion rises
        </span>
        <div className="h-8 w-px bg-gradient-to-b from-amber-400/50 to-transparent sd-knockout-flow-line" />
      </div>
    </div>
  );
}
