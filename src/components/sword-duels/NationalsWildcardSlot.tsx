import type { WildcardLoser } from "@/lib/products/sword-duels/wildcard-selection";

interface Props {
  rep: WildcardLoser | null;
  phase: "pending" | "auto" | "resolved" | "empty";
  tiedScore?: number | null;
  tvMode?: boolean;
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function NationalsWildcardSlot({
  rep,
  phase,
  tiedScore,
  tvMode = false,
}: Props) {
  const filled = rep != null && (phase === "auto" || phase === "resolved");

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="sd-wildcard-badge-float flex items-center gap-2">
        <span className="rounded-lg bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgb(217_70_239/0.45)]">
          Wild card
        </span>
        <span className="text-lg" aria-hidden>
          🃏
        </span>
      </div>

      <div
        className={`relative w-full max-w-[14rem] overflow-hidden rounded-xl p-3 ${
          filled
            ? "sd-wildcard-arena sd-wildcard-slot-live sd-wildcard-shimmer"
            : phase === "pending"
              ? "sd-wildcard-arena border border-dashed border-fuchsia-400/40"
              : "sd-inset border border-dashed border-fuchsia-500/20"
        }`}
      >
        {filled && rep ? (
          <div className="relative flex items-center gap-3">
            <span
              className={`flex shrink-0 items-center justify-center rounded-lg bg-fuchsia-950/50 font-black text-fuchsia-100 ring-1 ring-fuchsia-400/40 ${
                tvMode ? "h-10 w-10 text-sm" : "h-9 w-9 text-xs"
              }`}
            >
              {initials(rep.repName)}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`truncate font-bold text-fuchsia-50 ${
                  tvMode ? "text-base" : "text-sm"
                }`}
              >
                {rep.repName}
              </p>
              <p className="text-[10px] text-fuchsia-200/60">
                {rep.area} · Slot 16
              </p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-fuchsia-300/80">
                {phase === "auto"
                  ? "Auto-selected · 2nd-best loser score"
                  : "Wildcard round winner"}
              </p>
            </div>
            <span className="text-xl text-fuchsia-300/90" aria-hidden>
              ★
            </span>
          </div>
        ) : phase === "pending" ? (
          <div className="py-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-fuchsia-200/90">
              Tiebreak required
            </p>
            <p className="mt-2 text-[10px] leading-relaxed text-fuchsia-100/55">
              {tiedScore != null
                ? `${tiedScore} pts — shared 2nd-highest among area-final losers`
                : "Multiple runners-up tied for wildcard eligibility"}
            </p>
            <p className="mt-2 text-[9px] text-fuchsia-200/45">
              Wildcard round runs after all 15 area reps are locked
            </p>
          </div>
        ) : (
          <div className="py-4 text-center text-[10px] text-sd-muted/60">
            Awaiting wildcard selection
          </div>
        )}
      </div>
    </div>
  );
}
