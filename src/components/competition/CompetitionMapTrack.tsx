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
import { PHASE_DISPLAY, type PhaseSlug } from "@/lib/season-labels";

interface Props {
  activeMilestoneId: CompetitionMilestoneId;
}

const PHASE_ZONES = (["june", "july", "august"] as const).map((id) => ({
  id,
  label: PHASE_DISPLAY[id].label,
  subtitle: PHASE_DISPLAY[id].subtitle,
}));

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
  showLabel = true,
}: {
  milestone: CompetitionMilestoneMeta;
  activeMilestoneId: CompetitionMilestoneId;
  showLabel?: boolean;
}) {
  const state = nodeState(milestone.id, activeMilestoneId);
  const title = milestone.label.split(" — ").pop() ?? milestone.shortLabel;

  const shell =
    state === "active"
      ? "animate-glow-pulse bg-gradient-to-br from-sd-lime via-emerald-400 to-emerald-500 text-sd-deep ring-2 ring-fuchsia-400/50 shadow-[0_0_20px_rgb(163_230_53/0.4)]"
      : state === "cleared"
        ? "bg-emerald-600/80 text-white ring-2 ring-emerald-400/35"
        : "sd-glass text-sd-muted/70 ring-1 ring-emerald-900/40";

  return (
    <div className="flex min-w-0 items-start gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${shell}`}
        aria-current={state === "active" ? "step" : undefined}
        title={milestone.label}
      >
        {state === "cleared" ? "✓" : milestone.shortLabel}
      </div>
      {showLabel && (
        <div className="min-w-0 flex-1 pt-1.5">
          <p
            className={`text-sm leading-snug ${
              state === "active"
                ? "font-semibold text-white"
                : state === "cleared"
                  ? "font-medium text-emerald-100/90"
                  : "text-sd-muted/75"
            }`}
          >
            {title}
          </p>
          <p className="mt-0.5 text-[11px] text-sd-muted/65">{milestone.shortLabel}</p>
        </div>
      )}
    </div>
  );
}

function VerticalMilestoneList({
  milestones,
  activeMilestoneId,
}: {
  milestones: CompetitionMilestoneMeta[];
  activeMilestoneId: CompetitionMilestoneId;
}) {
  return (
    <ol className="space-y-0">
      {milestones.map((m, i) => {
        const state = nodeState(m.id, activeMilestoneId);
        const isLast = i === milestones.length - 1;
        return (
          <li key={m.id} className="relative flex gap-0">
            {!isLast && (
              <div
                className={`absolute left-5 top-10 bottom-0 w-0.5 -translate-x-1/2 ${
                  state === "cleared"
                    ? "bg-gradient-to-b from-emerald-500/70 to-emerald-400/30"
                    : "bg-emerald-950/70"
                }`}
                aria-hidden
              />
            )}
            <div className="relative pb-5">
              <MilestoneNode milestone={m} activeMilestoneId={activeMilestoneId} />
            </div>
          </li>
        );
      })}
    </ol>
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
      className={`rounded-2xl p-4 sm:p-5 ${
        isCurrentPhase
          ? "sd-glass-strong ring-1 ring-sd-glow/20"
          : "sd-glass opacity-90"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-2 border-b border-emerald-500/10 pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sd-glow">
            {phase.label}
          </p>
          <p className="mt-0.5 text-xs text-sd-muted/75">{phase.subtitle}</p>
        </div>
        {isCurrentPhase && (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
            Now
          </span>
        )}
      </div>
      <VerticalMilestoneList
        milestones={milestones}
        activeMilestoneId={activeMilestoneId}
      />
    </div>
  );
}

export function CompetitionMapTrack({ activeMilestoneId }: Props) {
  const defaultTab = milestonePhaseTab(activeMilestoneId);
  const [phaseTab, setPhaseTab] = useState<CompetitionMapPhaseTab>(defaultTab);
  const activeIdx = milestoneIndex(activeMilestoneId);
  const progressPct =
    COMPETITION_MILESTONES.length > 1
      ? Math.min(100, (activeIdx / (COMPETITION_MILESTONES.length - 1)) * 100)
      : 0;

  const currentPhase = milestonePhaseTab(activeMilestoneId);
  const mobileMilestones = milestonesForPhaseTab(phaseTab);

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.18em] text-sd-muted/70">
          <span>Season progress</span>
          <span className="tabular-nums text-sd-glow">
            {activeIdx + 1} / {COMPETITION_MILESTONES.length}
          </span>
        </div>
        <div className="sd-neon-track h-2">
          <div
            className="sd-neon-track-fill h-full rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
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

      <div className="space-y-4 lg:hidden">
        <div className="flex rounded-2xl sd-inset p-1 gap-1">
          {PHASE_ZONES.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPhaseTab(tab.id)}
              className={`flex-1 rounded-xl px-1 py-2.5 text-xs font-semibold leading-tight transition sm:text-sm ${
                phaseTab === tab.id
                  ? "bg-gradient-to-r from-sd-lime to-emerald-400 text-sd-deep shadow-[0_0_16px_rgb(163_230_53/0.3)]"
                  : "text-sd-muted hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="sd-glass-strong rounded-2xl p-4 sm:p-5">
          <p className="mb-4 text-center text-xs text-sd-muted/75">
            {PHASE_DISPLAY[phaseTab as PhaseSlug].subtitle}
          </p>
          <VerticalMilestoneList
            milestones={mobileMilestones}
            activeMilestoneId={activeMilestoneId}
          />
        </div>
      </div>
    </div>
  );
}
