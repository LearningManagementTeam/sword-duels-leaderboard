import type { PlayoffSlot } from "@/lib/playoff-map";
import { REGION_PLAYOFF_ACCENTS } from "@/lib/playoff-map";
import type { Region } from "@/lib/scoring-config";

interface Props {
  slot: PlayoffSlot;
  region: Region;
  tvMode?: boolean;
  compact?: boolean;
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

function scoreLabel(slot: PlayoffSlot): string | null {
  if (slot.isPlaceholder || slot.roundScore === null) return null;
  return String(slot.roundScore);
}

export function PlayoffSlotCard({
  slot,
  region,
  tvMode = false,
  compact = false,
}: Props) {
  const accent = REGION_PLAYOFF_ACCENTS[region];
  const eliminated =
    slot.status === "eliminated" ||
    (slot.eliminatedInRound != null && !slot.isChampion);
  const tieBreaker = slot.status === "tie_breaker" || slot.tieBreakerInRound != null;
  const display = displayName(slot);
  const slotInitials = initials(slot);

  const shell = slot.isChampion
    ? `bg-sd-surface text-sd-deep ring-2 ${accent.glow}`
    : slot.isPlaceholder
      ? "border border-dashed border-emerald-500/20 bg-sd-deep/30 text-sd-muted/50"
      : eliminated
        ? "bg-sd-deep/50 text-sd-muted/45 opacity-60"
        : tieBreaker
          ? "bg-sd-surface text-sd-deep ring-1 ring-fuchsia-400/50"
          : "bg-sd-surface text-sd-deep ring-1 ring-emerald-500/25";

  return (
    <div
      className={`flex min-h-[2.75rem] items-center gap-2 rounded-lg px-2.5 py-2 transition ${shell} ${
        tvMode ? "min-h-[3.25rem] px-3 py-2.5" : ""
      } ${compact ? "min-h-[2.25rem] py-1.5" : ""}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-md font-bold tabular-nums ${
          slot.isChampion
            ? "h-8 w-8 bg-gradient-to-br from-sd-gold to-amber-400 text-sd-deep text-xs"
            : tvMode
              ? "h-9 w-9 bg-emerald-900/30 text-emerald-200 text-sm"
              : "h-7 w-7 bg-emerald-900/25 text-emerald-200 text-xs"
        }`}
      >
        {slot.isChampion ? "★" : slotInitials}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-semibold leading-tight ${
            tvMode ? "text-base" : "text-sm"
          } ${eliminated && !slot.isPlaceholder ? "line-through" : ""}`}
        >
          {display}
        </p>
        {!slot.isPlaceholder && !compact && (
          <p className="truncate text-[10px] text-emerald-900/70">
            {slot.branch_name}
            {slot.branch_code ? ` · ${slot.branch_code}` : ""}
          </p>
        )}
      </div>
      {scoreLabel(slot) != null && (
        <span
          className={`shrink-0 tabular-nums font-semibold ${
            tvMode ? "text-sm" : "text-xs"
          } ${eliminated ? "text-sd-muted/50" : "text-emerald-800"}`}
        >
          {scoreLabel(slot)}
        </span>
      )}
      {eliminated && slot.eliminatedInRound != null && !slot.isPlaceholder && (
        <span className="shrink-0 text-[10px] font-medium uppercase text-red-400/90">
          Out R{slot.eliminatedInRound}
        </span>
      )}
      {tieBreaker && !eliminated && !slot.isChampion && (
        <span className="shrink-0 text-[10px] font-medium text-fuchsia-600">
          Tie
        </span>
      )}
    </div>
  );
}
