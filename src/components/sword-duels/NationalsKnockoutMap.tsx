import {
  KNOCKOUT_ROUND_LABELS,
  type KnockoutMatch,
  type KnockoutRoundKey,
  type NationalsKnockoutModel,
} from "@/lib/products/sword-duels/nationals-knockout-bracket";
import { NationalsParticipantCard } from "./NationalsParticipantCard";

interface Props {
  model: NationalsKnockoutModel;
  preview?: boolean;
  tvMode?: boolean;
}

function KnockoutMatchCard({
  match,
  preview,
  tvMode,
}: {
  match: KnockoutMatch;
  preview?: boolean;
  tvMode?: boolean;
}) {
  const isFinal = match.round === "final";

  return (
    <div
      className={`relative rounded-xl p-2 ring-1 ring-inset ${
        isFinal
          ? "bg-emerald-500/10 ring-emerald-400/40"
          : "bg-sd-deep/35 ring-emerald-900/30"
      }`}
    >
      <p className="mb-1.5 text-center text-[8px] font-bold uppercase tracking-wider text-sd-muted/70">
        {match.label}
      </p>
      <div className="space-y-1">
        {match.entrantA ? (
          <NationalsParticipantCard
            entrant={match.entrantA}
            compact={!tvMode}
            tvMode={tvMode}
            wildcard={match.entrantA.isWildcard}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-emerald-500/20 px-2 py-3 text-center text-[10px] text-sd-muted/50">
            TBD
          </div>
        )}
        <p className="text-center text-[10px] font-black tracking-wider text-lime-300/80">
          VS
        </p>
        {match.entrantB ? (
          <NationalsParticipantCard
            entrant={match.entrantB}
            compact={!tvMode}
            tvMode={tvMode}
            wildcard={match.entrantB.isWildcard}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-emerald-500/20 px-2 py-3 text-center text-[10px] text-sd-muted/50">
            TBD
          </div>
        )}
      </div>
      {preview && (
        <p className="mt-1.5 text-center text-[8px] text-sd-muted/45">
          Winner advances →
        </p>
      )}
    </div>
  );
}

function RoundColumn({
  roundKey,
  matches,
  preview,
  tvMode,
}: {
  roundKey: KnockoutRoundKey;
  matches: KnockoutMatch[];
  preview?: boolean;
  tvMode?: boolean;
}) {
  return (
    <div className="flex min-w-[11rem] flex-1 flex-col gap-3">
      <h3 className="sticky top-0 z-10 bg-sd-deep/80 py-1 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-sd-glow backdrop-blur-sm">
        {KNOCKOUT_ROUND_LABELS[roundKey]}
      </h3>
      <div className="flex flex-1 flex-col justify-around gap-3">
        {matches.map((match) => (
          <KnockoutMatchCard
            key={match.id}
            match={match}
            preview={preview}
            tvMode={tvMode}
          />
        ))}
      </div>
    </div>
  );
}

export function NationalsKnockoutMap({ model, preview = false, tvMode = false }: Props) {
  return (
    <div className="space-y-6">
      <div className="sd-neon-panel overflow-hidden p-4 sm:p-5">
        <div className="inline-flex items-stretch overflow-hidden rounded-lg shadow-lg">
          <span className="bg-gradient-to-r from-emerald-400 to-lime-400 px-4 py-1.5 text-sm font-black uppercase tracking-widest text-sd-deep">
            Sword Duels
          </span>
          <span className="bg-emerald-500/25 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100 ring-1 ring-inset ring-emerald-400/40">
            Nationals knockout
          </span>
        </div>
        <h2 className={`mt-3 font-bold text-white ${tvMode ? "text-3xl" : "text-xl"}`}>
          Road to champion
        </h2>
        <p className={`mt-1 text-sd-muted ${tvMode ? "text-base" : "text-sm"}`}>
          {model.fieldSize} entrants · Area vs Area until one national champion
          {preview ? " · Placeholder preview" : ""}
        </p>
        <p className="mt-2 text-xs text-sd-muted/70">
          Round 1 pairs: Area 1 vs 2, 3 vs 4, … Area 15 vs Wild card
        </p>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <div className="sd-bracket-arena flex min-w-[56rem] gap-3 p-4">
          {model.rounds.map((matches) => {
            const roundKey = matches[0]?.round ?? "r16";
            return (
              <RoundColumn
                key={roundKey}
                roundKey={roundKey}
                matches={matches}
                preview={preview}
                tvMode={tvMode}
              />
            );
          })}
          <div className="flex min-w-[10rem] flex-col items-center justify-center gap-2 px-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sd-gold">
              Champion
            </p>
            <div className="sd-inset flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-emerald-500/25 text-center text-[10px] text-sd-muted/55">
              {model.champion ? model.champion.repName : "Crown awaits"}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 lg:hidden">
        {model.rounds.map((matches) => {
          const roundKey = matches[0]?.round ?? "r16";
          return (
            <section key={roundKey} className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-sd-glow">
                {KNOCKOUT_ROUND_LABELS[roundKey]}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {matches.map((match) => (
                  <KnockoutMatchCard
                    key={match.id}
                    match={match}
                    preview={preview}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
