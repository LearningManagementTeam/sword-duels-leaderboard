import type { WildcardLoser } from "@/lib/products/sword-duels/wildcard-selection";
import { pickWildcardRoundWinner } from "@/lib/products/sword-duels/wildcard-selection";

interface Props {
  candidates: WildcardLoser[];
  scores: Record<string, number>;
  tiedScore: number | null;
  confirmedId?: string;
  tvMode?: boolean;
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function WildcardRoundArena({
  candidates,
  scores,
  tiedScore,
  confirmedId,
  tvMode = false,
}: Props) {
  const ranked = [...candidates]
    .map((c) => ({
      ...c,
      roundScore: scores[c.id] ?? null,
    }))
    .sort((a, b) => {
      const sa = a.roundScore ?? -1;
      const sb = b.roundScore ?? -1;
      if (sb !== sa) return sb - sa;
      return a.area.localeCompare(b.area, undefined, { numeric: true });
    });

  const leader = confirmedId
    ? candidates.find((c) => c.id === confirmedId) ?? null
    : pickWildcardRoundWinner(candidates, scores);

  return (
    <section className="sd-wildcard-arena relative overflow-hidden p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-fuchsia-200/90">
            Wildcard round
          </p>
          <h3
            className={`mt-1 font-bold text-white ${tvMode ? "text-xl" : "text-lg"}`}
          >
            Tiebreak arena
          </h3>
          <p className="mt-1 max-w-md text-xs text-fuchsia-100/55">
            Tied at{" "}
            <span className="font-semibold text-fuchsia-200/90">
              {tiedScore ?? "—"} pts
            </span>{" "}
            in the 2nd-highest loser tier. Highest wildcard-round score claims
            slot 16.
          </p>
        </div>
        <span className="rounded-full bg-purple-500/20 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-purple-100 ring-1 ring-purple-400/35 ring-inset">
          After 15 reps locked
        </span>
      </div>

      <div className="space-y-2">
        {ranked.map((c, index) => {
          const isLeader =
            leader?.id === c.id &&
            c.roundScore != null &&
            c.roundScore >= 0;
          const isConfirmed = confirmedId === c.id;

          return (
            <div
              key={c.id}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ring-inset transition ${
                isConfirmed
                  ? "bg-fuchsia-500/20 ring-fuchsia-400/50 sd-wildcard-slot-live"
                  : isLeader
                    ? "bg-purple-500/12 ring-purple-400/35"
                    : "bg-sd-deep/40 ring-fuchsia-900/30"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded font-black tabular-nums ${
                  index === 0 && c.roundScore != null
                    ? "bg-fuchsia-400/25 text-fuchsia-100"
                    : "bg-purple-950/50 text-purple-200/70 text-xs"
                }`}
              >
                {index + 1}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-fuchsia-950/40 text-[10px] font-bold text-fuchsia-100">
                {initials(c.repName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {c.repName}
                </p>
                <p className="truncate text-[10px] text-fuchsia-200/50">
                  {c.area} · Area-final loss {c.areaFinalScore} pts
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wide text-fuchsia-200/45">
                  Wildcard pts
                </p>
                <p
                  className={`text-lg font-black tabular-nums ${
                    c.roundScore != null
                      ? "text-fuchsia-200"
                      : "text-fuchsia-200/30"
                  }`}
                >
                  {c.roundScore ?? "—"}
                </p>
              </div>
              {isConfirmed && (
                <span className="absolute -top-2 right-2 rounded bg-fuchsia-400 px-1.5 py-px text-[8px] font-black uppercase tracking-wider text-sd-deep">
                  Slot 16
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
