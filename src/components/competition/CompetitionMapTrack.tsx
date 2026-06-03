"use client";

import { useState } from "react";
import {
  milestoneIndex,
  milestonePhaseTab,
  milestonesForPhaseTab,
  type CompetitionMapPhaseTab,
  type CompetitionMilestoneId,
} from "@/lib/competition-map";

interface Props {
  activeMilestoneId: CompetitionMilestoneId;
}

const PHASE_TABS: { id: CompetitionMapPhaseTab; label: string }[] = [
  { id: "june", label: "June" },
  { id: "july", label: "July" },
  { id: "august", label: "August" },
];

function MilestoneDots({
  activeMilestoneId,
  milestones,
}: {
  activeMilestoneId: CompetitionMilestoneId;
  milestones: ReturnType<typeof milestonesForPhaseTab>;
}) {
  const activeIdx = milestoneIndex(activeMilestoneId);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-2">
      {milestones.map((m, i) => {
        const idx = milestoneIndex(m.id);
        const isActive = m.id === activeMilestoneId;
        const isPast = idx < activeIdx;
        return (
          <div key={m.id} className="flex items-center gap-2">
            <div
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-center transition ${
                isActive
                  ? "scale-105 ring-2 ring-sd-glow/60 bg-emerald-500/15 shadow-[0_0_20px_rgb(74_222_128/0.25)]"
                  : isPast
                    ? "opacity-85"
                    : "opacity-50"
              }`}
              title={m.label}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-gradient-to-br from-sd-lime to-emerald-400 text-sd-deep"
                    : isPast
                      ? "bg-emerald-600/50 text-white"
                      : "sd-glass text-sd-muted"
                }`}
              >
                {m.shortLabel}
              </span>
              <span
                className={`max-w-[5rem] text-[10px] leading-tight ${
                  isActive ? "text-sd-glow font-medium" : "text-sd-muted/70"
                }`}
              >
                {m.label.split(" — ").pop() ?? m.shortLabel}
              </span>
            </div>
            {i < milestones.length - 1 && (
              <div
                className={`h-0.5 w-4 rounded-full sm:w-6 ${
                  isPast ? "bg-emerald-500/50" : "bg-emerald-900/60"
                }`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CompetitionMapTrack({ activeMilestoneId }: Props) {
  const defaultTab = milestonePhaseTab(activeMilestoneId);
  const [phaseTab, setPhaseTab] = useState<CompetitionMapPhaseTab>(defaultTab);
  const phaseMilestones = milestonesForPhaseTab(phaseTab);

  const trackMilestones = milestonesForPhaseTab("june")
    .concat(milestonesForPhaseTab("july"))
    .concat(milestonesForPhaseTab("august"));
  const activeIdx = milestoneIndex(activeMilestoneId);

  return (
    <>
      <div className="hidden sm:block overflow-x-auto pb-2">
        <div className="flex items-center gap-1 min-w-0">
          {trackMilestones.map((m, i) => {
            const idx = milestoneIndex(m.id);
            const isActive = m.id === activeMilestoneId;
            const isPast = idx < activeIdx;
            return (
              <div key={m.id} className="flex flex-1 items-center gap-1 min-w-0">
                <div
                  className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-center transition min-w-0 ${
                    isActive
                      ? "scale-105 ring-2 ring-sd-glow/60 bg-emerald-500/15 shadow-[0_0_20px_rgb(74_222_128/0.25)]"
                      : isPast
                        ? "opacity-80"
                        : "opacity-45"
                  }`}
                  title={m.label}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-gradient-to-br from-sd-lime to-emerald-400 text-sd-deep"
                        : isPast
                          ? "bg-emerald-600/50 text-white"
                          : "sd-glass text-sd-muted"
                    }`}
                  >
                    {m.shortLabel}
                  </span>
                  <span
                    className={`max-w-[4.5rem] truncate text-[9px] leading-tight sm:max-w-none sm:text-[10px] ${
                      isActive ? "text-sd-glow font-medium" : "text-sd-muted/70"
                    }`}
                  >
                    {m.label.split(" — ").pop() ?? m.shortLabel}
                  </span>
                </div>
                {i < trackMilestones.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 min-w-[6px] rounded-full ${
                      isPast ? "bg-emerald-500/50" : "bg-emerald-900/60"
                    }`}
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sm:hidden space-y-3">
        <div className="flex rounded-xl sd-inset p-1 gap-1">
          {PHASE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPhaseTab(tab.id)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                phaseTab === tab.id
                  ? "bg-gradient-to-r from-sd-lime to-emerald-400 text-sd-deep"
                  : "text-sd-muted hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <MilestoneDots
          activeMilestoneId={activeMilestoneId}
          milestones={phaseMilestones}
        />
      </div>
    </>
  );
}
