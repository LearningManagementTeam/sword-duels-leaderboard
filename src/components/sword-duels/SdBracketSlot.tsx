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
    "bg-gradient-to-r from-sd-gold/90 via-amber-300/90 to-sd-gold/90 ring-2 ring-sd-gold/70 text-sd-deep",
  placeholder:
    "border border-dashed border-emerald-500/25 bg-sd-deep/40 text-sd-muted/55",
};

export function SdBracketSlot({
  slot,
  role,
  tvMode = false,
  side,
  highlighted = false,
}: Props) {
  const eliminated =
    slot.status === "eliminated" ||
    (slot.eliminatedInRound != null && !slot.isChampion);
  const isPlaceholder = slot.isPlaceholder || role === "placeholder";
  const isWinner =
    slot.isChampion ||
    slot.status === "advanced" ||
    (role === "spot" && highlighted);
  const display = displayName(slot);
  const shell = slot.isChampion ? ROLE_SHELL.champion : ROLE_SHELL[role];

  return (
    <div
      data-bracket-slot
      className={`relative flex min-h-[2.5rem] items-center gap-2 rounded-md px-2.5 py-1.5 transition ${shell} ${
        tvMode ? "min-h-[3rem] px-3 py-2" : ""
      } ${eliminated && !isPlaceholder ? "opacity-55" : ""} ${
        side === "b" ? "flex-row-reverse text-right" : ""
      } ${highlighted && role === "spot" ? "sd-bracket-spot-ready" : ""} ${
        isWinner && role === "field" ? "ring-1 ring-lime-400/40" : ""
      }`}
    >
      {isWinner && role === "spot" && (
        <span
          className={`absolute -top-2 rounded bg-sd-gold px-1.5 py-px text-[8px] font-black uppercase tracking-wider text-sd-deep ${
            side === "b" ? "right-1" : "left-1"
          }`}
        >
          Winner
        </span>
      )}
      <span
        className={`flex shrink-0 items-center justify-center rounded font-bold tabular-nums ${
          slot.isChampion
            ? "h-7 w-7 bg-sd-deep/20 text-sd-deep text-xs"
            : role === "spot" || role === "final"
              ? "h-6 w-6 bg-emerald-950/40 text-lime-200 text-[10px]"
              : "h-6 w-6 bg-emerald-950/50 text-emerald-200/90 text-[10px]"
        } ${tvMode ? "h-8 w-8 text-xs" : ""} ${
          isWinner && !slot.isChampion ? "ring-1 ring-lime-300/50" : ""
        }`}
      >
        {slot.isChampion ? "★" : initials(slot)}
      </span>
      <div className={`min-w-0 flex-1 ${side === "b" ? "items-end" : ""}`}>
        <p
          className={`truncate font-semibold leading-tight ${
            tvMode ? "text-sm" : "text-xs"
          } ${slot.isChampion ? "text-sd-deep" : "text-white"} ${
            eliminated && !isPlaceholder ? "line-through" : ""
          } ${isWinner && role === "spot" ? "text-lime-100" : ""}`}
        >
          {display}
        </p>
        {!isPlaceholder && role === "field" && (
          <p className="truncate text-[9px] text-emerald-200/55">
            {slot.branch_name}
            {slot.branch_code ? ` · ${slot.branch_code}` : ""}
          </p>
        )}
      </div>
      {slot.roundScore != null && !isPlaceholder && (
        <span
          className={`shrink-0 tabular-nums font-bold ${
            tvMode ? "text-sm" : "text-xs"
          } ${slot.isChampion ? "text-sd-deep" : "text-lime-300"}`}
        >
          {slot.roundScore}
        </span>
      )}
    </div>
  );
}
