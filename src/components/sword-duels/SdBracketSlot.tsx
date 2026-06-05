import type { PlayoffSlot } from "@/lib/playoff-map";

export type SdBracketSlotRole = "field" | "spot" | "final" | "champion" | "placeholder";

interface Props {
  slot: PlayoffSlot;
  role: SdBracketSlotRole;
  tvMode?: boolean;
  side?: "a" | "b";
  /** Spot/final node is filled and active in the bracket */
  highlighted?: boolean;
}

function displayName(slot: PlayoffSlot): string {
  if (slot.isPlaceholder) return slot.branch_name;
  return slot.representative_1?.trim() || slot.branch_name;
}

function initials(slot: PlayoffSlot): string {
  const name = displayName(slot);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const ROLE_SHELL: Record<SdBracketSlotRole, string> = {
  field:
    "bg-gradient-to-r from-emerald-950/80 via-emerald-900/50 to-emerald-800/40 ring-1 ring-emerald-500/20",
  spot:
    "bg-gradient-to-r from-lime-500/25 via-emerald-500/30 to-emerald-600/25 ring-1 ring-lime-400/45",
  final:
    "bg-gradient-to-r from-emerald-400/20 via-sd-glow/15 to-lime-400/20 ring-1 ring-sd-glow/50",
  champion:
    "bg-gradient-to-r from-emerald-400/95 via-lime-300/95 to-emerald-400/95 ring-2 ring-lime-400/70 text-sd-deep",
  placeholder:
    "border border-dashed border-emerald-500/25 bg-sd-deep/40 text-sd-muted/55",
};

const SET_WINNER_SHELL =
  "bg-gradient-to-r from-emerald-900/90 via-emerald-800/75 to-lime-900/55 ring-1 ring-lime-400/50";

const LOSER_SHELL = "bg-sd-deep/50 ring-1 ring-emerald-900/20";

export function SdBracketSlot({
  slot,
  role,
  tvMode = false,
  side,
  highlighted = false,
}: Props) {
  const isPlaceholder = slot.isPlaceholder || role === "placeholder";
  const isAreaChampion = !!slot.isChampion;
  const eliminated =
    !isPlaceholder &&
    (slot.status === "eliminated" ||
      (slot.eliminatedInRound != null && !isAreaChampion));
  const isSetWinner =
    !isAreaChampion &&
    !eliminated &&
    (slot.status === "advanced" || (role === "spot" && highlighted));
  const isWinner = isAreaChampion || isSetWinner;

  const display = displayName(slot);
  const shell = isAreaChampion
    ? ROLE_SHELL.champion
    : isSetWinner && role === "field"
      ? SET_WINNER_SHELL
      : eliminated
        ? LOSER_SHELL
        : ROLE_SHELL[role];

  const winnerFx =
    isWinner && !isPlaceholder
      ? isAreaChampion
        ? "sd-bracket-champion-glow overflow-hidden"
        : "sd-bracket-winner-live sd-bracket-winner-shimmer overflow-hidden"
      : "";

  return (
    <div
      data-bracket-slot
      className={`relative flex min-h-[2.5rem] items-center gap-2 rounded-md px-2.5 py-1.5 transition duration-300 ${shell} ${winnerFx} ${
        tvMode ? "min-h-[3rem] px-3 py-2" : ""
      } ${side === "b" ? "flex-row-reverse text-right" : ""} ${
        highlighted && role === "spot" ? "sd-bracket-spot-ready" : ""
      } ${isWinner && !isPlaceholder ? "hover:scale-[1.015]" : ""}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded font-bold tabular-nums ${
          isAreaChampion
            ? "h-7 w-7 bg-sd-deep/20 text-sd-deep text-xs"
            : role === "spot" || role === "final"
              ? "h-6 w-6 bg-emerald-950/40 text-lime-200 text-[10px]"
              : eliminated
                ? "h-6 w-6 bg-zinc-800/60 text-zinc-500 text-[10px]"
                : "h-6 w-6 bg-emerald-950/50 text-emerald-200/90 text-[10px]"
        } ${tvMode ? "h-8 w-8 text-xs" : ""} ${
          isSetWinner ? "ring-1 ring-lime-300/50" : ""
        }`}
      >
        {isAreaChampion ? "★" : initials(slot)}
      </span>
      <div className={`min-w-0 flex-1 ${side === "b" ? "items-end" : ""}`}>
        <p
          className={`truncate font-semibold leading-tight ${
            tvMode ? "text-sm" : "text-xs"
          } ${
            isAreaChampion
              ? "text-sd-deep"
              : eliminated
                ? "text-zinc-500"
                : isSetWinner && role === "spot"
                  ? "text-lime-100"
                  : isSetWinner
                    ? "text-lime-50"
                    : "text-white"
          }`}
        >
          {display}
        </p>
        {!isPlaceholder && role === "field" && (
          <p
            className={`truncate text-[9px] ${
              eliminated ? "text-zinc-600" : "text-emerald-200/55"
            }`}
          >
            {slot.branch_name}
            {slot.branch_code ? ` · ${slot.branch_code}` : ""}
          </p>
        )}
      </div>
      {slot.roundScore != null && !isPlaceholder && (
        <span
          className={`shrink-0 tabular-nums font-bold ${
            tvMode ? "text-sm" : "text-xs"
          } ${
            isAreaChampion
              ? "text-sd-deep"
              : eliminated
                ? "text-zinc-600"
                : "text-lime-300"
          }`}
        >
          {slot.roundScore}
        </span>
      )}
    </div>
  );
}
