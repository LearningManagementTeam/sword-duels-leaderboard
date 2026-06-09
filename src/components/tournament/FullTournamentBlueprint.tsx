"use client";

import Link from "next/link";
import { useState } from "react";
import { SdRegionalTournamentMap } from "@/components/sword-duels/SdRegionalTournamentMap";
import { SdV2FormatOverview } from "@/components/sword-duels/SdV2FormatOverview";
import { isRegionalAverageFormat } from "@/lib/products/sword-duels/tournament-format";
import type { SdTournamentFormat } from "@/lib/products/sword-duels/tournament-format";
import type {
  TournamentBlueprintModel,
  TournamentBlueprintPhase,
  TournamentBlueprintProgram,
  TournamentBlueprintStep,
} from "@/lib/tournament-blueprint";

interface Props {
  nationalCompetitions: TournamentBlueprintModel;
  swordDuels: TournamentBlueprintModel;
  /** Active SD format — controls diagram above set-by-set detail. */
  swordDuelsFormat?: SdTournamentFormat | null;
  /** Which program tab opens first on mobile. */
  defaultProgram?: TournamentBlueprintProgram;
  compact?: boolean;
}

const PROGRAM_TABS: {
  id: TournamentBlueprintProgram;
  label: string;
  short: string;
}[] = [
  { id: "national_competitions", label: "National Competitions", short: "NC" },
  { id: "sword_duels", label: "Sword Duels", short: "SD" },
];

function BlueprintStep({
  step,
  isLast,
}: {
  step: TournamentBlueprintStep;
  isLast: boolean;
}) {
  const card = (
    <div
      className={`sd-inset rounded-lg p-3 transition ${
        isLast ? "" : "mb-2"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{step.title}</p>
          <p className="text-[11px] text-cyan-200/70">{step.subtitle}</p>
        </div>
        {step.cutLine && (
          <span className="shrink-0 rounded-md bg-lime-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-lime-200 ring-1 ring-lime-400/30">
            Cut: {step.cutLine}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-sd-muted">{step.detail}</p>
    </div>
  );

  if (step.href) {
    return (
      <li>
        <Link
          href={step.href}
          className="group block rounded-lg transition hover:ring-1 hover:ring-cyan-400/25"
        >
          {card}
          <span className="mt-1 block text-right text-[10px] text-sd-muted/50 transition group-hover:text-cyan-300/80">
            View →
          </span>
        </Link>
      </li>
    );
  }

  return <li>{card}</li>;
}

function BlueprintPhaseColumn({
  phase,
  highlighted,
}: {
  phase: TournamentBlueprintPhase;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 ${
        highlighted
          ? "sd-glass-strong ring-1 ring-cyan-400/20"
          : "sd-glass"
      }`}
    >
      <header className="mb-4 border-b border-emerald-500/10 pb-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300/85">
          {phase.label}
        </p>
        <p className="mt-0.5 text-[11px] text-sd-muted/80">{phase.subtitle}</p>
      </header>
      <ol className="space-y-0">
        {phase.steps.map((step, i) => (
          <BlueprintStep
            key={step.id}
            step={step}
            isLast={i === phase.steps.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}

function BlueprintPanel({ model }: { model: TournamentBlueprintModel }) {
  const [phaseTab, setPhaseTab] = useState(0);

  return (
    <div className="space-y-5">
      <header className="space-y-1 text-center sm:text-left">
        <h3 className="text-lg font-semibold text-white">{model.headline}</h3>
        <p className="text-sm leading-relaxed text-sd-muted">{model.tagline}</p>
      </header>

      <div
        className={`hidden gap-4 lg:grid ${
          model.phases.length >= 4
            ? "lg:grid-cols-2 xl:grid-cols-4"
            : model.phases.length === 3
              ? "lg:grid-cols-3"
              : "lg:grid-cols-2"
        }`}
      >
        {model.phases.map((phase) => (
          <BlueprintPhaseColumn key={phase.id} phase={phase} />
        ))}
      </div>

      <div className="space-y-4 lg:hidden">
        <div className="flex flex-wrap gap-1 rounded-2xl sd-inset p-1">
          {model.phases.map((phase, i) => (
            <button
              key={phase.id}
              type="button"
              onClick={() => setPhaseTab(i)}
              className={`flex-1 rounded-xl px-2 py-2 text-[11px] font-semibold leading-tight transition sm:text-xs ${
                phaseTab === i
                  ? "bg-gradient-to-r from-cyan-400/30 to-emerald-400/25 text-white ring-1 ring-cyan-400/35"
                  : "text-sd-muted hover:text-white"
              }`}
            >
              {phase.label}
            </button>
          ))}
        </div>
        <BlueprintPhaseColumn phase={model.phases[phaseTab]!} highlighted />
      </div>
    </div>
  );
}

export function FullTournamentBlueprint({
  nationalCompetitions,
  swordDuels,
  swordDuelsFormat,
  defaultProgram = "national_competitions",
  compact = false,
}: Props) {
  const [program, setProgram] = useState<TournamentBlueprintProgram>(defaultProgram);
  const active =
    program === "sword_duels" ? swordDuels : nationalCompetitions;
  const sdIsV2 = isRegionalAverageFormat(swordDuelsFormat);

  return (
    <div className={`sd-neon-panel space-y-5 ${compact ? "p-4 sm:p-5" : "p-5 sm:p-8"}`}>
      <header className="space-y-2 text-center sm:text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-300/85">
          Tournament blueprint
        </p>
        <h2 className="text-xl font-bold text-white sm:text-2xl">
          The full journey to the crown
        </h2>
        <p className="text-sm leading-relaxed text-sd-muted">
          Every phase and round from opening roster to national champion — the
          complete map, not where live scores are today.
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
        {PROGRAM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setProgram(tab.id)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold ring-1 ring-inset transition ${
              program === tab.id
                ? "bg-gradient-to-r from-violet-400/25 to-cyan-400/20 text-white ring-violet-400/40"
                : "sd-glass text-sd-muted hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {program === "sword_duels" ? (
        <>
          {sdIsV2 ? (
            <SdV2FormatOverview />
          ) : (
            <SdRegionalTournamentMap showChampion compact={compact} />
          )}
          <details className="sd-glass rounded-xl p-4">
            <summary className="cursor-pointer text-sm font-semibold text-white">
              {sdIsV2
                ? "Set-by-set detail (Group A → B → final → regionals → finals)"
                : "Set-by-set detail (Group A → B → final → nationals)"}
            </summary>
            <div className="mt-4">
              <BlueprintPanel model={active} />
            </div>
          </details>
        </>
      ) : (
        <BlueprintPanel model={active} />
      )}

      <p className="text-center text-xs text-sd-muted sm:text-left">
        <Link href="/tournament-journey" className="sd-link">
          Open full-page tournament map →
        </Link>
      </p>
    </div>
  );
}
