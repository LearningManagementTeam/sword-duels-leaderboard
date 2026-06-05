import type { PlayoffSlot } from "@/lib/playoff-map";
import { SD_BRACKET_COPY, spotLabel } from "@/lib/products/sword-duels/bracket-copy";
import { SdBracketSlot } from "./SdBracketSlot";

interface Props {
  slots: PlayoffSlot[];
  tvMode?: boolean;
  /** Shown when scores exist but no champion yet */
  live?: boolean;
}

/** Symmetrical Spot 1 vs Spot 2 layout for the area final. */
export function SdFinalDuelFaceoff({ slots, tvMode = false, live = false }: Props) {
  const left = slots[0];
  const right = slots[1];

  if (!left || !right) {
    return (
      <div className="sd-inset w-full rounded-lg px-3 py-4 text-center text-[10px] text-sd-muted/60">
        {SD_BRACKET_COPY.areaFinalPending}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[15rem] space-y-2">
      <div className="flex items-center justify-center gap-2">
        <p
          className={`font-bold uppercase tracking-[0.16em] text-sd-glow ${
            tvMode ? "text-[11px]" : "text-[10px]"
          }`}
        >
          {SD_BRACKET_COPY.areaFinal}
        </p>
        {live && (
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-emerald-100/90 ring-1 ring-emerald-400/30 ring-inset">
            {SD_BRACKET_COPY.areaFinalLive}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-1.5">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-center text-[8px] font-semibold uppercase tracking-wider text-cyan-200/75">
            {spotLabel(1)}
          </p>
          <SdBracketSlot slot={left} role="final" side="a" tvMode={tvMode} />
        </div>

        <div className="flex flex-col items-center justify-center px-0.5">
          <span
            className={`font-black tracking-tighter text-lime-300/85 ${
              tvMode ? "text-xl" : "text-lg"
            } ${live ? "sd-bracket-vs-pulse" : ""}`}
          >
            VS
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-center text-[8px] font-semibold uppercase tracking-wider text-lime-200/75">
            {spotLabel(2)}
          </p>
          <SdBracketSlot slot={right} role="final" side="b" tvMode={tvMode} />
        </div>
      </div>

      <p className="text-center text-[8px] text-sd-muted/60">
        One rep advances · highest score wins
      </p>
    </div>
  );
}
