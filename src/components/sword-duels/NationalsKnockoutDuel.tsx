import type { KnockoutMatch } from "@/lib/products/sword-duels/nationals-knockout-bracket";
import { NationalsParticipantCard } from "./NationalsParticipantCard";

interface Props {
  match: KnockoutMatch;
  featured?: boolean;
  preview?: boolean;
  tvMode?: boolean;
  index?: number;
}

export function NationalsKnockoutDuel({
  match,
  featured = false,
  preview = false,
  tvMode = false,
  index,
}: Props) {
  const isFinal = match.round === "final";
  const isReady = !!(match.entrantA && match.entrantB);
  const isLive = isReady && (preview || !!match.winnerId);

  return (
    <article
      className={`group relative overflow-hidden rounded-xl transition duration-300 ${
        isFinal
          ? "sd-knockout-duel-final sd-knockout-duel-live"
          : featured
            ? "sd-knockout-duel-featured"
            : "sd-knockout-duel-card"
      } ${isLive ? "hover:scale-[1.01]" : ""}`}
    >
      {isLive && (
        <div className="pointer-events-none absolute inset-0 sd-knockout-duel-shimmer rounded-xl" aria-hidden />
      )}

      <div className="relative px-3 pb-3 pt-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-100/90 ring-1 ring-emerald-400/25 ring-inset">
            {match.label}
          </span>
          {index != null && (
            <span className="text-[8px] font-bold tabular-nums text-sd-muted/45">
              #{index + 1}
            </span>
          )}
          {isLive && (
            <span className="rounded-full bg-lime-400/15 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-lime-100 ring-1 ring-lime-400/30 ring-inset">
              Clash ready
            </span>
          )}
        </div>

        <div
          className={`grid items-stretch gap-2 ${
            tvMode
              ? "grid-cols-[1fr_auto_1fr]"
              : "grid-cols-[1fr_auto_1fr] sm:gap-3"
          }`}
        >
          <div className="min-w-0">
            {match.entrantA ? (
              <NationalsParticipantCard
                entrant={match.entrantA}
                tvMode={tvMode}
                wildcard={match.entrantA.isWildcard}
                interactive
                highlight={match.winnerId === match.entrantA.id}
                muted={!!match.winnerId && match.winnerId !== match.entrantA.id}
              />
            ) : (
              <div className="flex h-full min-h-[4.5rem] items-center justify-center rounded-lg border border-dashed border-emerald-500/20 bg-sd-deep/30 px-2 text-center text-[10px] text-sd-muted/50">
                Awaiting winner
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center px-0.5">
            <span
              className={`font-black tracking-tighter text-lime-300 ${
                tvMode ? "text-2xl" : "text-lg"
              } ${isLive || isFinal ? "sd-bracket-vs-pulse" : "text-lime-300/50"}`}
            >
              VS
            </span>
            {(isFinal || featured) && (
              <span className="mt-1 text-[7px] font-bold uppercase tracking-widest text-sd-gold/80">
                {isFinal ? "Final" : "Semis"}
              </span>
            )}
          </div>

          <div className="min-w-0">
            {match.entrantB ? (
              <NationalsParticipantCard
                entrant={match.entrantB}
                tvMode={tvMode}
                wildcard={match.entrantB.isWildcard}
                interactive
                highlight={match.winnerId === match.entrantB.id}
                muted={!!match.winnerId && match.winnerId !== match.entrantB.id}
              />
            ) : (
              <div className="flex h-full min-h-[4.5rem] items-center justify-center rounded-lg border border-dashed border-emerald-500/20 bg-sd-deep/30 px-2 text-center text-[10px] text-sd-muted/50">
                Awaiting winner
              </div>
            )}
          </div>
        </div>

        {(preview || match.winnerId) && match.entrantA && match.entrantB && (
          <p className="mt-2 text-center text-[8px] uppercase tracking-widest text-emerald-200/40">
            {match.winnerId ? "Winner advanced →" : "Winner advances →"}
          </p>
        )}
      </div>
    </article>
  );
}
