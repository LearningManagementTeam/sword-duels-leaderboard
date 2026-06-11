"use client";

interface Phase {
  id: string;
  label: string;
}

interface Props {
  phases: Phase[];
}

export function SdFullJourneyPhaseNav({ phases }: Props) {
  return (
    <nav
      aria-label="Tournament phases"
      className="sticky top-14 z-20 -mx-4 border-b border-emerald-500/15 bg-sd-deep/92 px-4 py-2.5 backdrop-blur-md sm:top-16"
    >
      <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {phases.map((phase, i) => (
          <a
            key={phase.id}
            href={`#${phase.id}`}
            className="shrink-0 rounded-full bg-emerald-950/50 px-3.5 py-1.5 text-xs font-semibold text-emerald-100/90 ring-1 ring-emerald-500/20 transition hover:bg-emerald-900/60 hover:ring-cyan-400/35"
          >
            <span className="mr-1.5 tabular-nums text-cyan-300/70">{i + 1}</span>
            {phase.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
