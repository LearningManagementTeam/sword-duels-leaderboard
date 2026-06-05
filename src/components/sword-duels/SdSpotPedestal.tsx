import type { PlayoffSlot } from "@/lib/playoff-map";
import {
  SD_BRACKET_COPY,
  spotLabel,
  spotPlaceholder,
} from "@/lib/products/sword-duels/bracket-copy";
import { SdBracketSlot } from "./SdBracketSlot";

interface Props {
  spot: 1 | 2;
  slot: PlayoffSlot | null;
  ready: boolean;
  side: "a" | "b";
  tvMode?: boolean;
}

const SIDE_ACCENT = {
  a: {
    ring: "ring-cyan-400/30",
    label: "text-cyan-200/90",
    pill: "bg-cyan-500/15 text-cyan-100/90 ring-cyan-400/25",
    pillPending: "bg-sd-deep/40 text-sd-muted/60 ring-emerald-800/30",
    hint: "text-cyan-200/55",
  },
  b: {
    ring: "ring-lime-400/30",
    label: "text-lime-200/90",
    pill: "bg-lime-500/15 text-lime-100/90 ring-lime-400/25",
    pillPending: "bg-sd-deep/40 text-sd-muted/60 ring-emerald-800/30",
    hint: "text-lime-200/55",
  },
} as const;

/** Balanced spot holder — fixed width, mirrored for Group A / Group B wings. */
export function SdSpotPedestal({
  spot,
  slot,
  ready,
  side,
  tvMode = false,
}: Props) {
  const accent = SIDE_ACCENT[side];
  const label = spotLabel(spot);
  const align = side === "b" ? "items-end text-right" : "items-start text-left";

  return (
    <div
      className={`flex w-full max-w-[9.25rem] shrink-0 flex-col gap-2 ${align} ${
        ready ? "sd-bracket-reveal" : ""
      } ${tvMode ? "max-w-[10.5rem]" : ""}`}
    >
      <div className="flex w-full flex-col gap-1">
        <p
          className={`font-bold uppercase tracking-[0.14em] ${accent.label} ${
            tvMode ? "text-[11px]" : "text-[10px]"
          }`}
        >
          {label}
        </p>
        <span
          className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider ring-1 ring-inset ${
            ready ? accent.pill : accent.pillPending
          }`}
        >
          {ready ? SD_BRACKET_COPY.spotSecured : SD_BRACKET_COPY.spotPending}
        </span>
      </div>

      <div
        className={`w-full rounded-lg p-1 ring-1 ring-inset ${accent.ring} ${
          ready ? "bg-emerald-950/35" : "bg-sd-deep/25"
        }`}
      >
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
              branch_name: spotPlaceholder(spot),
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

      {ready && (
        <p
          className={`w-full text-[8px] font-medium uppercase tracking-wide ${accent.hint} ${
            side === "b" ? "text-right" : "text-left"
          }`}
        >
          {SD_BRACKET_COPY.spotAdvances}
        </p>
      )}
    </div>
  );
}
