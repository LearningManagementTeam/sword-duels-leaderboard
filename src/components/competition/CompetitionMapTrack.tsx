"use client";

import { useState } from "react";
import {
  COMPETITION_MILESTONES,
  milestoneIndex,
  milestonePhaseTab,
  milestonesForPhaseTab,
  type CompetitionMapPhaseTab,
  type CompetitionMilestoneId,
  type CompetitionMilestoneMeta,
} from "@/lib/competition-map";

interface Props {
  activeMilestoneId: CompetitionMilestoneId;
}

const PHASE_ZONES: {
  id: CompetitionMapPhaseTab;
  label: string;
  subtitle: string;
}[] = [
  { id: "june", label: "June", subtitle: "Area-wide" },
  { id: "july", label: "July", subtitle: "Regional" },
  { id: "august", label: "August", subtitle: "Finals" },
];

function nodeState(
  milestoneId: CompetitionMilestoneId,
  activeMilestoneId: CompetitionMilestoneId
) {
  const idx = milestoneIndex(milestoneId);
  const activeIdx = milestoneIndex(activeMilestoneId);
  if (milestoneId === activeMilestoneId) return "active" as const;
  if (idx < activeIdx) return "cleared" as const;
  return "locked" as const;
}

function MilestoneNode({
  milestone,
  activeMilestoneId,
  compact = false,
}: {
  milestone: CompetitionMilestoneMeta;
  activeMilestoneId: CompetitionMilestoneId;
  compact?: boolean;
}) {
  const state = nodeState(milestone.id, activeMilestoneId);
  const title = milestone.label.split(" — ").pop() ?? milestone.shortLabel;

  const shell =
    state === "active"
      ? "animate-glow-pulse bg-gradient-to-br from-sd-lime via-emerald-400 to-emerald-500 text-sd-deep ring-2 ring-fuchsia-400/50 shadow-[0_0_24px_rgb(163_230_53/0.45)]"
      : state === "cleared"
        ? "bg-emerald-600/70 text-white ring-2 ring-emerald-400/40 shadow-[0_0_12px_rgb(74_222_128/0.25)]"
        : "sd-glass text-sd-muted/60 ring-1 ring-emerald-900/50";

  const size = compact ? "h-8 w-8 text-[9px]" : "h-10 w-10 text-[10px]";

  return (
    <div
      className="flex min-w-0 flex-col items-center gap-1.5 text-center"
      title={milestone.label}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-bold transition ${size} ${shell}`}
        aria-current={state === "active" ? "step" : undefined}
      >
        {state === "cleared" ? "✓" : milestone.shortLabel}
      </div>
      <span
        className={`max-w-[4.5rem] text-[9px] leading-tight sm:max-w-[5.5rem] sm:text-[10px] ${
          state === "active"
            ? "font-semibold text-sd-glow"
            : state === "cleared"
              ? "text-emerald-200/80"
              : "text-sd-muted/50"
        }`}
      >
        {title}
      </span>
    </div>
  );
}

function Connector({
  fromId,
  activeMilestoneId,
}: {
  fromId: CompetitionMilestoneId;
  activeMilestoneId: CompetitionMilestoneId;
}) {
  const cleared = milestoneIndex(fromId) < milestoneIndex(activeMilestoneId);

  return (
    <div
      className={`relative h-0.5 w-full shrink-0 rounded-full ${
        cleared
          ? "bg-gradient-to-r from-emerald-500/70 to-emerald-400/40"
          : "bg-emerald-950/80"
      }`}
      aria-hidden
    >
      {cleared && (
        <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-[2px]" />
      )}
    </div>
  );
}

function PhaseQuestZone({
  phase,
  activeMilestoneId,
  milestones,
  isCurrentPhase,
}: {
  phase: (typeof PHASE_ZONES)[number];
  activeMilestoneId: CompetitionMilestoneId;
  milestones: CompetitionMilestoneMeta[];
  isCurrentPhase: boolean;
}) {
  return (
    <div
      className={`relative flex min-w-0 flex-1 flex-col rounded-xl p-3 sm:p-4 ${
        isCurrentPhase ? "sd-glass-strong ring-1 ring-sd-glow/25" : "sd-glass"
      }`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-emerald-500/10 pb-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sd-glow">
            {phase.label}
          </p>
          <p className="text-[10px] text-sd-muted/70">{phase.subtitle}</p>
        </div>
        {isCurrentPhase && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-200">
            Active
          </span>
        )}
      </div>
      <div className="flex items-start justify-center gap-0.5 sm:gap-1">
        {milestones.map((m, i) => (
          <div key={m.id} className="flex min-w-0 items-start">
            <MilestoneNode
              milestone={m}
              activeMilestoneId={activeMilestoneId}
              compact
            />
            {i < milestones.length - 1 && (
              <div className="mt-4 w-2 shrink-0 sm:w-3">
                <Connector fromId={m.id} activeMilestoneId={activeMilestoneId} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompetitionMapTrack({ activeMilestoneId }: Props) {
  const defaultTab = milestonePhaseTab(activeMilestoneId);
  const [phaseTab, setPhaseTab] = useState<CompetitionMapPhaseTab>(defaultTab);
  const activeIdx = milestoneIndex(activeMilestoneId);
  const progressPct =
    COMPETITION_MILESTONES.length > 1
      ? Math.min(
          100,
          (activeIdx / (COMPETITION_MILESTONES.length - 1)) * 100
        )
      : 0;

  const currentPhase = milestonePhaseTab(activeMilestoneId);
  const mobileMilestones = milestonesForPhaseTab(phaseTab);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.18em] text-sd-muted/70">
          <span>Season progress</span>
          <span className="text-sd-glow">
            {activeIdx + 1} / {COMPETITION_MILESTONES.length}
          </span>
        </div>
        <div className="sd-neon-track">
          <div
            className="sd-neon-track-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="hidden gap-3 sm:flex">
        {PHASE_ZONES.map((phase) => (
          <PhaseQuestZone
            key={phase.id}
            phase={phase}
            activeMilestoneId={activeMilestoneId}
            milestones={milestonesForPhaseTab(phase.id)}
            isCurrentPhase={phase.id === currentPhase}
          />
        ))}
      </div>

      <div className="sm:hidden space-y-3">
        <div className="flex rounded-xl sd-inset p-1 gap-1">
          {PHASE_ZONES.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPhaseTab(tab.id)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                phaseTab === tab.id
                  ? "bg-gradient-to-r from-sd-lime to-emerald-400 text-sd-deep shadow-[0_0_16px_rgb(163_230_53/0.3)]"
                  : "text-sd-muted hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="sd-glass-strong rounded-xl p-4">
          <p className="mb-3 text-center text-[10px] uppercase tracking-[0.2em] text-sd-muted/70">
            {PHASE_ZONES.find((p) => p.id === phaseTab)?.subtitle}
          </p>
          <div className="flex items-start justify-center gap-0.5">
            {mobileMilestones.map((m, i) => (
              <div key={m.id} className="flex min-w-0 items-start">
                <MilestoneNode
                  milestone={m}
                  activeMilestoneId={activeMilestoneId}
                />
                {i < mobileMilestones.length - 1 && (
                  <div className="mt-5 w-2 shrink-0">
                    <Connector
                      fromId={m.id}
                      activeMilestoneId={activeMilestoneId}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
