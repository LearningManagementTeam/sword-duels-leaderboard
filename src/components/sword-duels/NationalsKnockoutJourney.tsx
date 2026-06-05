import type { ReactNode } from "react";
import {
  KNOCKOUT_ROUND_LABELS,
  type KnockoutRoundKey,
} from "@/lib/products/sword-duels/nationals-knockout-bracket";
import { NationalsKnockoutDuel } from "./NationalsKnockoutDuel";

const ROUND_ACCENT: Record<
  KnockoutRoundKey,
  { ring: string; step: string; glow: string }
> = {
  r16: {
    ring: "ring-cyan-400/35 bg-cyan-500/8",
    step: "bg-cyan-500/20 text-cyan-100 ring-cyan-400/35",
    glow: "from-cyan-500/10",
  },
  qf: {
    ring: "ring-emerald-400/35 bg-emerald-500/8",
    step: "bg-emerald-500/20 text-emerald-100 ring-emerald-400/35",
    glow: "from-emerald-500/10",
  },
  sf: {
    ring: "ring-lime-400/40 bg-lime-500/10",
    step: "bg-lime-500/20 text-lime-100 ring-lime-400/35",
    glow: "from-lime-500/12",
  },
  final: {
    ring: "ring-sd-gold/45 bg-amber-500/10",
    step: "bg-amber-400/25 text-amber-50 ring-amber-400/45",
    glow: "from-amber-500/15",
  },
};

function FlowConnector() {
  return (
    <div className="flex justify-center py-2" aria-hidden>
      <div className="flex flex-col items-center gap-1">
        <div className="h-6 w-px bg-gradient-to-b from-emerald-400/50 to-lime-400/40 sd-knockout-flow-line" />
        <span className="text-[8px] font-bold uppercase tracking-widest text-lime-300/50">
          ↓
        </span>
        <div className="h-6 w-px bg-gradient-to-b from-lime-400/40 to-transparent sd-knockout-flow-line" />
      </div>
    </div>
  );
}

function RoundStage({
  step,
  roundKey,
  title,
  subtitle,
  children,
}: {
  step: number;
  roundKey: KnockoutRoundKey;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const accent = ROUND_ACCENT[roundKey];

  return (
    <section
      className={`relative overflow-hidden rounded-2xl p-4 ring-1 ring-inset sm:p-5 ${accent.ring}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${accent.glow} to-transparent`}
        aria-hidden
      />
      <div className="relative mb-4 flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ring-1 ring-inset ${accent.step}`}
        >
          {step}
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sd-glow">
            {KNOCKOUT_ROUND_LABELS[roundKey]}
          </p>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-sd-muted/75">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

interface JourneyProps {
  rounds: import("@/lib/products/sword-duels/nationals-knockout-bracket").KnockoutMatch[][];
  preview?: boolean;
  tvMode?: boolean;
}

export function NationalsKnockoutJourney({ rounds, preview, tvMode }: JourneyProps) {
  let step = 1;

  const roundTitles: Record<KnockoutRoundKey, { title: string; subtitle: string }> = {
    r16: {
      title: "Area clashes open",
      subtitle: "Eight duels — Area 1 vs 2, 3 vs 4, … 15 vs Wild card",
    },
    qf: {
      title: "Quarterfinal battles",
      subtitle: "Eight become four",
    },
    sf: {
      title: "Semifinal showdown",
      subtitle: "Four become two",
    },
    final: {
      title: "The final clash",
      subtitle: "One duel for the national crown",
    },
  };

  return (
    <div className="space-y-2">
      {rounds.map((matches, roundIdx) => {
        const roundKey = matches[0]?.round ?? "r16";
        const meta = roundTitles[roundKey];
        const isFinal = roundKey === "final";
        const isSf = roundKey === "sf";

        return (
          <div key={roundKey}>
            <RoundStage
              step={step++}
              roundKey={roundKey}
              title={meta.title}
              subtitle={meta.subtitle}
            >
              <div
                className={`grid gap-3 ${
                  isFinal
                    ? "max-w-lg mx-auto"
                    : matches.length > 4
                      ? "sm:grid-cols-2"
                      : matches.length > 1
                        ? "sm:grid-cols-2"
                        : ""
                }`}
              >
                {matches.map((match, i) => (
                  <NationalsKnockoutDuel
                    key={match.id}
                    match={match}
                    preview={preview}
                    tvMode={tvMode}
                    featured={isSf || isFinal}
                    index={roundKey === "r16" ? i : undefined}
                  />
                ))}
              </div>
            </RoundStage>
            {roundIdx < rounds.length - 1 && <FlowConnector />}
          </div>
        );
      })}
    </div>
  );
}
